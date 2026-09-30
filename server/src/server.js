import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import { checkDbConnection, isDbConnected } from './db.js';
import { DfeParser } from './services/dfeParser.js';
import { DeParaService } from './services/deParaService.js';
import { TaxCalculationEngine } from './services/taxCalculationEngine.js';
import { PreValidatorService } from './services/preValidatorService.js';
import { EfdIcmsIpiGenerator } from './services/sped/efdIcmsIpiGenerator.js';
import { EfdContribuicoesGenerator } from './services/sped/efdContribuicoesGenerator.js';
import { fiscalRepository } from './services/fiscalRepository.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Multer para upload em memória de XMLs e lotes
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB
});

const dfeParser = new DfeParser();
const deParaService = new DeParaService();

// ============================================================================
// ROTAS DE SAÚDE E DIAGNÓSTICO
// ============================================================================

app.get('/api/v1/health', async (req, res) => {
  const dbStatus = await checkDbConnection();
  res.json({
    status: 'ONLINE',
    service: 'Portal do Contador - Fiscal Engine & SPED',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    database: {
      connected: dbStatus.ok,
      details: dbStatus
    }
  });
});

// ============================================================================
// CADASTROS BÁSICOS (TENANTS & EMPRESAS)
// ============================================================================

app.get('/api/v1/tenants/:tenantId/empresas', async (req, res) => {
  try {
    const { tenantId } = req.params;
    const empresas = await fiscalRepository.getEmpresas(tenantId);
    res.json({ success: true, count: empresas.length, data: empresas });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/v1/tenants/:tenantId/empresas/:empresaId', async (req, res) => {
  try {
    const { tenantId, empresaId } = req.params;
    const empresa = await fiscalRepository.getEmpresaById(tenantId, empresaId);
    if (!empresa) {
      return res.status(404).json({ success: false, error: 'Empresa não encontrada.' });
    }
    res.json({ success: true, data: empresa });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// PIPELINE DE INGESTÃO E PARSER DE DF-e COM DE-PARA
// ============================================================================

app.post('/api/v1/tenants/:tenantId/empresas/:empresaId/dfe/importar', upload.array('arquivos'), async (req, res) => {
  try {
    const { tenantId, empresaId } = req.params;
    const { destinacao = 'REVENDA' } = req.body;

    const empresa = await fiscalRepository.getEmpresaById(tenantId, empresaId);
    if (!empresa) {
      return res.status(404).json({ success: false, error: 'Empresa destinatária não encontrada.' });
    }

    const arquivosProcessados = [];
    const erros = [];

    // Processa arquivos enviados via Multer (multipart) ou via JSON payload
    let xmlList = [];
    if (req.files && req.files.length > 0) {
      xmlList = req.files.map(f => ({ name: f.originalname, content: f.buffer.toString('utf-8') }));
    } else if (req.body.xmlContent) {
      xmlList = [{ name: 'payload.xml', content: req.body.xmlContent }];
    } else if (req.body.xmlList && Array.isArray(req.body.xmlList)) {
      xmlList = req.body.xmlList;
    }

    if (xmlList.length === 0) {
      return res.status(400).json({ success: false, error: 'Nenhum XML fornecido para ingestão.' });
    }

    for (const itemXml of xmlList) {
      try {
        // 1. Parser do XML oficial
        const parsed = dfeParser.parse(itemXml.content);

        // 2. Determinar se é Entrada ou Saída com base no CNPJ da Empresa
        const cnpjEmpresa = empresa.cnpj.replace(/\D/g, '');
        const cnpjEmitente = (parsed.emitente?.cnpj_cpf || '').replace(/\D/g, '');
        const isSaida = cnpjEmitente === cnpjEmpresa;
        const tipoOperacao = isSaida ? 'SAIDA' : 'ENTRADA';
        const tipoEmissao = isSaida ? 'PROPRIA' : 'TERCEIROS';

        // 3. Cadastrar ou sincronizar o Participante (Registro 0150)
        const participanteDados = isSaida ? parsed.destinatario : parsed.emitente;
        const codPart = `PART_${participanteDados.cnpj_cpf.slice(-6) || Math.floor(Math.random() * 100000)}`;

        const participanteSalvo = await fiscalRepository.upsertParticipante(tenantId, {
          codigo_participante: codPart,
          nome: participanteDados.razao_social || 'Participante Comercial',
          cnpj_cpf: participanteDados.cnpj_cpf,
          inscricao_estadual: participanteDados.inscricao_estadual || '',
          codigo_municipio_ibge: participanteDados.codigo_municipio_ibge || empresa.codigo_municipio_ibge,
          uf: participanteDados.uf || empresa.uf
        });

        // 4. Processar Itens e Executar o Algoritmo De-Para
        const itensProcessados = [];
        for (const item of parsed.itens) {
          // Cadastrar ou sincronizar o Produto (Registro 0200)
          await fiscalRepository.upsertProduto(tenantId, empresaId, {
            codigo_item: item.codigo_item,
            descricao: item.descricao,
            unidade_medida: item.unidade_medida,
            tipo_item: item.tipo_item || (destinacao === 'INSUMO' ? '01' : '00'),
            ncm: item.ncm,
            cest: item.cest,
            codigo_barra_gtin: item.codigo_barra_gtin
          });

          // Resolução de De-Para se for documento de entrada
          let cfopEscriturado = item.cfop_origem;
          let cstIcmsEscriturado = item.cst_icms;
          let cstPisEscriturado = item.cst_pis;
          let cstCofinsEscriturado = item.cst_cofins;
          let creditaIcms = false;
          let creditaPisCofins = empresa.regime_tributario === 'LUCRO_REAL';

          if (tipoOperacao === 'ENTRADA') {
            const dePara = await deParaService.resolveItemEntrada({
              tenantId,
              empresaId,
              participanteId: participanteSalvo.id,
              ncm: item.ncm,
              cfopFornecedor: item.cfop_origem,
              ufFornecedor: parsed.emitente.uf,
              ufEmpresa: empresa.uf,
              destinacao: item.destinacao || destinacao,
              regimeTributario: empresa.regime_tributario
            });

            cfopEscriturado = dePara.cfop_escriturado;
            cstIcmsEscriturado = dePara.cst_icms_escriturado;
            cstPisEscriturado = dePara.cst_pis_escriturado;
            cstCofinsEscriturado = dePara.cst_cofins_escriturado;
            creditaIcms = dePara.credita_icms;
            creditaPisCofins = dePara.credita_pis_cofins;
          }

          itensProcessados.push({
            ...item,
            destinacao_item: item.destinacao || destinacao,
            cfop_escriturado: cfopEscriturado,
            cst_icms: cstIcmsEscriturado,
            cst_pis: cstPisEscriturado,
            cst_cofins: cstCofinsEscriturado,
            credita_icms: creditaIcms,
            credita_pis_cofins: creditaPisCofins
          });
        }

        // 5. Salvar o Documento Fiscal Completo
        const docParaSalvar = {
          chave_acesso: parsed.chave_acesso,
          modelo: parsed.modelo,
          serie: parsed.serie,
          numero: parsed.numero,
          tipo_operacao: tipoOperacao,
          tipo_emissao: tipoEmissao,
          situacao_documento: '00',
          data_emissao: parsed.data_emissao,
          data_entrada_saida: parsed.data_entrada_saida,
          natureza_operacao: parsed.natureza_operacao,
          indicador_pagamento: parsed.indicador_pagamento,
          indicador_frete: parsed.indicador_frete,
          participante_id: participanteSalvo.id,
          participante_codigo: codPart,
          participante_nome: participanteSalvo.nome,
          totais: parsed.totais,
          itens: itensProcessados,
          xml_conteudo: itemXml.content
        };

        const docSalvo = await fiscalRepository.salvarDocumento(tenantId, empresaId, docParaSalvar);

        arquivosProcessados.push({
          arquivo: itemXml.name,
          chave_acesso: parsed.chave_acesso,
          numero: parsed.numero,
          serie: parsed.serie,
          tipo_operacao: tipoOperacao,
          valor_total: parsed.totais.valor_total_documento,
          itens_count: itensProcessados.length,
          status: 'IMPORTADO_COM_SUCESSO'
        });
      } catch (errDoc) {
        erros.push({
          arquivo: itemXml.name,
          erro: errDoc.message
        });
      }
    }

    res.json({
      success: true,
      total_enviados: xmlList.length,
      total_processados: arquivosProcessados.length,
      total_erros: erros.length,
      importados: arquivosProcessados,
      erros
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// CONSULTA DE DOCUMENTOS ESCRITURADOS
// ============================================================================

app.get('/api/v1/tenants/:tenantId/empresas/:empresaId/documentos', async (req, res) => {
  try {
    const { tenantId, empresaId } = req.params;
    const { anoMes, tipoOperacao } = req.query;

    const docs = await fiscalRepository.getDocumentos(tenantId, empresaId, { anoMes, tipoOperacao });
    res.json({
      success: true,
      count: docs.length,
      data: docs
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// MOTOR DE APURAÇÃO TRIBUTÁRIA (ICMS, IPI, PIS/COFINS)
// ============================================================================

app.post('/api/v1/tenants/:tenantId/empresas/:empresaId/apuracao/calcular', async (req, res) => {
  try {
    const { tenantId, empresaId } = req.params;
    const { anoMes, saldoCredorAnteriorIcms = 0, aplicarTeseSeculo = true } = req.body;

    if (!anoMes || !/^\d{4}-\d{2}$/.test(anoMes)) {
      return res.status(400).json({ success: false, error: 'Parâmetro anoMes é obrigatório no formato YYYY-MM.' });
    }

    const empresa = await fiscalRepository.getEmpresaById(tenantId, empresaId);
    if (!empresa) {
      return res.status(404).json({ success: false, error: 'Empresa não encontrada.' });
    }

    // Buscar documentos do período
    const documentos = await fiscalRepository.getDocumentos(tenantId, empresaId, { anoMes });

    // Executar motor de cálculo
    const resultadoApuracao = TaxCalculationEngine.apurarPeriodo({
      empresa,
      documentos,
      saldoCredorAnteriorIcms: parseFloat(saldoCredorAnteriorIcms) || 0,
      aplicarTeseSeculo: Boolean(aplicarTeseSeculo)
    });

    // Salvar apuração do ICMS no repositório
    await fiscalRepository.salvarApuracao(tenantId, empresaId, anoMes, resultadoApuracao.icms);

    res.json({
      success: true,
      periodo: anoMes,
      empresa: {
        razao_social: empresa.razao_social,
        cnpj: empresa.cnpj,
        regime_tributario: empresa.regime_tributario
      },
      documentos_considerados: documentos.length,
      apuracao: resultadoApuracao
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// AUDITORIA PRÉVIA E REGRAS DE CONSISTÊNCIA PRÉ-PVA
// ============================================================================

app.post('/api/v1/tenants/:tenantId/empresas/:empresaId/auditoria/validar', async (req, res) => {
  try {
    const { tenantId, empresaId } = req.params;
    const { anoMes } = req.body;

    const empresa = await fiscalRepository.getEmpresaById(tenantId, empresaId);
    if (!empresa) {
      return res.status(404).json({ success: false, error: 'Empresa não encontrada.' });
    }

    const documentos = await fiscalRepository.getDocumentos(tenantId, empresaId, { anoMes });
    const participantes = await fiscalRepository.getParticipantes(tenantId);
    const produtos = await fiscalRepository.getProdutos(tenantId, empresaId);

    // Calcular apuração para validar contra documentos
    const apuracaoResultado = TaxCalculationEngine.apurarPeriodo({
      empresa,
      documentos
    });

    const auditoria = PreValidatorService.auditarPeriodo({
      empresa,
      documentos,
      participantes,
      produtos,
      apuracaoIcms: apuracaoResultado.icms
    });

    res.json({
      success: true,
      periodo: anoMes,
      auditoria
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// MOTOR DE EXPORTAÇÃO SPED (EFD ICMS IPI & EFD-CONTRIBUIÇÕES)
// ============================================================================

app.get('/api/v1/tenants/:tenantId/empresas/:empresaId/sped/exportar', async (req, res) => {
  try {
    const { tenantId, empresaId } = req.params;
    const { anoMes, tipo = 'EFD_ICMS_IPI' } = req.query;

    if (!anoMes || !/^\d{4}-\d{2}$/.test(anoMes)) {
      return res.status(400).json({ success: false, error: 'Parâmetro anoMes é obrigatório no formato YYYY-MM.' });
    }

    const empresa = await fiscalRepository.getEmpresaById(tenantId, empresaId);
    if (!empresa) {
      return res.status(404).json({ success: false, error: 'Empresa não encontrada.' });
    }

    // Determinar início e fim do mês
    const parts = anoMes.split('-');
    const dtIni = `${anoMes}-01`;
    const ultimoDia = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10), 0).getDate();
    const dtFin = `${anoMes}-${String(ultimoDia).padStart(2, '0')}`;

    const documentos = await fiscalRepository.getDocumentos(tenantId, empresaId, { anoMes });
    const participantes = await fiscalRepository.getParticipantes(tenantId);
    const produtos = await fiscalRepository.getProdutos(tenantId, empresaId);

    // Apuração prévia para alimentar o Bloco E / Bloco M
    const apuracaoResultado = TaxCalculationEngine.apurarPeriodo({
      empresa,
      documentos
    });

    let conteudoSped = '';
    let nomeArquivo = '';

    if (tipo === 'EFD_ICMS_IPI') {
      const generator = new EfdIcmsIpiGenerator();
      conteudoSped = generator.generate({
        empresa,
        periodoInicio: dtIni,
        periodoFim: dtFin,
        participantes,
        produtos,
        documentos,
        apuracaoIcms: apuracaoResultado.icms
      });
      nomeArquivo = `SPED_EFD_ICMS_IPI_${empresa.cnpj.replace(/\D/g, '')}_${anoMes.replace('-', '')}.txt`;
    } else if (tipo === 'EFD_CONTRIBUICOES') {
      const generator = new EfdContribuicoesGenerator();
      conteudoSped = generator.generate({
        empresa,
        periodoInicio: dtIni,
        periodoFim: dtFin,
        participantes,
        produtos,
        documentos,
        apuracaoPis: apuracaoResultado.pis,
        apuracaoCofins: apuracaoResultado.cofins
      });
      nomeArquivo = `SPED_EFD_CONTRIBUICOES_${empresa.cnpj.replace(/\D/g, '')}_${anoMes.replace('-', '')}.txt`;
    } else {
      return res.status(400).json({ success: false, error: 'Tipo de SPED inválido. Opções: EFD_ICMS_IPI ou EFD_CONTRIBUICOES.' });
    }

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${nomeArquivo}"`);
    res.send(conteudoSped);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// REGRAS FISCAIS DE-PARA (CRUD)
// ============================================================================

app.get('/api/v1/tenants/:tenantId/empresas/:empresaId/regras-depara', async (req, res) => {
  try {
    const { tenantId, empresaId } = req.params;
    const regras = await fiscalRepository.getRegrasDePara(tenantId, empresaId);
    res.json({ success: true, count: regras.length, data: regras });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Inicialização do Servidor
if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`🚀 [Portal do Contador - Fiscal Engine] Servidor escutando na porta ${port}`);
    console.log(`📡 Endpoints disponíveis em http://localhost:${port}/api/v1/`);
  });
}

export default app;
