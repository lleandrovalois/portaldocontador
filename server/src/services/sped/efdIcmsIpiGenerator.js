import { SpedFormatter } from './spedFormatter.js';

/**
 * Gerador Oficial de EFD ICMS IPI (SPED Fiscal)
 * Produz a escrituração digital completa conforme Guia Prático da EFD v3.1.6+
 */
export class EfdIcmsIpiGenerator {
  constructor() {
    this.lines = [];
    this.counters = new Map();
    this.totalLinhas = 0;
  }

  addLine(line) {
    this.lines.push(line);
    this.totalLinhas++;
    const parts = line.split('|');
    const regType = parts[1];
    if (regType) {
      this.counters.set(regType, (this.counters.get(regType) || 0) + 1);
    }
  }

  /**
   * Constrói o arquivo completo a partir dos dados do período
   */
  generate({
    empresa,
    periodoInicio,
    periodoFim,
    participantes = [],
    produtos = [],
    documentos = [],
    apuracaoIcms = null,
    versaoLayout = '018',
    finalidade = '0' // 0 = Remessa original, 1 = Substituto
  }) {
    this.lines = [];
    this.counters.clear();
    this.totalLinhas = 0;

    // ==========================================
    // BLOCO 0: ABERTURA, IDENTIFICAÇÃO E CADASTROS
    // ==========================================
    this.buildBloco0({
      empresa,
      periodoInicio,
      periodoFim,
      participantes,
      produtos,
      versaoLayout,
      finalidade
    });

    // ==========================================
    // BLOCO C: DOCUMENTOS FISCAIS I - MERCADORIAS
    // ==========================================
    this.buildBlocoC({ documentos });

    // ==========================================
    // BLOCO E: APURAÇÃO DO ICMS E DO IPI
    // ==========================================
    this.buildBlocoE({
      periodoInicio,
      periodoFim,
      apuracaoIcms
    });

    // ==========================================
    // BLOCO 9: CONTROLE E ENCERRAMENTO DO ARQUIVO
    // ==========================================
    this.buildBloco9();

    return this.lines.join('');
  }

  buildBloco0({ empresa, periodoInicio, periodoFim, participantes, produtos, versaoLayout, finalidade }) {
    let bloco0Count = 0;

    // Registro 0000: Abertura do Arquivo Digital e Identificação da Entidade
    this.addLine(
      SpedFormatter.buildLine([
        '0000',
        versaoLayout,
        finalidade,
        SpedFormatter.formatDate(periodoInicio),
        SpedFormatter.formatDate(periodoFim),
        empresa.razao_social,
        empresa.cnpj.replace(/\D/g, ''),
        empresa.uf,
        empresa.inscricao_estadual.replace(/\D/g, ''),
        empresa.codigo_municipio_ibge,
        empresa.inscricao_municipal || '',
        empresa.suframa || '',
        empresa.perfil_sped || 'A',
        empresa.ind_atividade || '0'
      ])
    );
    bloco0Count++;

    // Registro 0001: Abertura do Bloco 0
    this.addLine(SpedFormatter.buildLine(['0001', '0']));
    bloco0Count++;

    // Registro 0005: Dados Complementares da Entidade
    this.addLine(
      SpedFormatter.buildLine([
        '0005',
        empresa.nome_fantasia || empresa.razao_social,
        empresa.cep || '01001000',
        empresa.logradouro || 'Avenida Principal',
        empresa.numero || '100',
        empresa.complemento || '',
        empresa.bairro || 'Centro',
        empresa.telefone || '1133334444',
        empresa.email || 'fiscal@empresa.com.br'
      ])
    );
    bloco0Count++;

    // Registro 0100: Dados do Contabilista
    this.addLine(
      SpedFormatter.buildLine([
        '0100',
        'Contador Responsavel',
        '12345678909',
        'CRC-SP 123456/O',
        '12345678000195',
        '01001000',
        'Rua dos Contabilistas',
        '50',
        'Sala 2',
        'Consolação',
        '1133335555',
        '',
        'contador@portaldocontador.com.br',
        empresa.codigo_municipio_ibge
      ])
    );
    bloco0Count++;

    // Registro 0150: Tabela de Cadastro do Participante (Clientes / Fornecedores)
    for (const part of participantes) {
      this.addLine(
        SpedFormatter.buildLine([
          '0150',
          part.codigo_participante,
          part.nome,
          part.codigo_pais || '1058',
          (part.cnpj_cpf || '').replace(/\D/g, ''),
          '', // CPF se pessoa física
          (part.inscricao_estadual || '').replace(/\D/g, ''),
          part.codigo_municipio_ibge,
          part.suframa || '',
          part.logradouro || 'Rua Comercial',
          part.numero || 'S/N',
          part.complemento || '',
          part.bairro || 'Distrito Industrial'
        ])
      );
      bloco0Count++;
    }

    // Registro 0190: Identificação das Unidades de Medida
    const unidades = new Set();
    produtos.forEach((p) => unidades.add(p.unidade_medida || 'UN'));
    for (const unid of unidades) {
      this.addLine(
        SpedFormatter.buildLine([
          '0190',
          unid,
          `Unidade de Medida ${unid}`
        ])
      );
      bloco0Count++;
    }

    // Registro 0200: Tabela de Identificação do Item (Produtos e Serviços)
    for (const prod of produtos) {
      this.addLine(
        SpedFormatter.buildLine([
          '0200',
          prod.codigo_item,
          prod.descricao,
          prod.codigo_barra_gtin || '',
          '', // COD_ANT_ITEM
          prod.unidade_medida || 'UN',
          prod.tipo_item || '00',
          (prod.ncm || '').replace(/\D/g, ''),
          '', // EX_IPI
          '', // COD_GEN
          '', // COD_LST
          SpedFormatter.formatRate(prod.aliquota_icms_padrao || 18.0),
          (prod.cest || '').replace(/\D/g, '')
        ])
      );
      bloco0Count++;
    }

    // Registro 0990: Encerramento do Bloco 0 (+1 para a linha do próprio 0990)
    bloco0Count++;
    this.addLine(SpedFormatter.buildLine(['0990', String(bloco0Count)]));
  }

  buildBlocoC({ documentos }) {
    let blocoCCount = 0;

    // Registro C001: Abertura do Bloco C (0 = Bloco com dados)
    const temDados = documentos && documentos.length > 0;
    this.addLine(SpedFormatter.buildLine(['C001', temDados ? '0' : '1']));
    blocoCCount++;

    if (temDados) {
      for (const doc of documentos) {
        const indOper = doc.tipo_operacao === 'SAIDA' ? '1' : '0';
        const indEmit = doc.tipo_emissao === 'PROPRIA' ? '0' : '1';
        const totais = doc.totais || {};

        // Registro C100: Nota Fiscal Eletrônica
        this.addLine(
          SpedFormatter.buildLine([
            'C100',
            indOper,
            indEmit,
            doc.participante_codigo || doc.participante_id || 'PART001',
            doc.modelo || '55',
            doc.situacao_documento || '00',
            doc.serie || '1',
            String(doc.numero),
            doc.chave_acesso,
            SpedFormatter.formatDate(doc.data_emissao),
            SpedFormatter.formatDate(doc.data_entrada_saida || doc.data_emissao),
            SpedFormatter.formatMoney(doc.valor_total_documento || totais.valor_total_documento),
            doc.indicador_pagamento || '0',
            SpedFormatter.formatMoney(doc.valor_desconto || totais.valor_desconto),
            SpedFormatter.formatMoney(0), // VL_ABAT_NT
            SpedFormatter.formatMoney(doc.valor_produtos || totais.valor_produtos),
            doc.indicador_frete || '9',
            SpedFormatter.formatMoney(doc.valor_frete || totais.valor_frete),
            SpedFormatter.formatMoney(doc.valor_seguro || totais.valor_seguro),
            SpedFormatter.formatMoney(doc.valor_outras_despesas || totais.valor_outras_despesas),
            SpedFormatter.formatMoney(doc.valor_bc_icms || totais.valor_bc_icms),
            SpedFormatter.formatMoney(doc.valor_icms || totais.valor_icms),
            SpedFormatter.formatMoney(doc.valor_bc_icms_st || totais.valor_bc_icms_st),
            SpedFormatter.formatMoney(doc.valor_icms_st || totais.valor_icms_st),
            SpedFormatter.formatMoney(doc.valor_ipi || totais.valor_ipi),
            SpedFormatter.formatMoney(doc.valor_pis || totais.valor_pis),
            SpedFormatter.formatMoney(doc.valor_cofins || totais.valor_cofins),
            SpedFormatter.formatMoney(0), // VL_PIS_ST
            SpedFormatter.formatMoney(0)  // VL_COFINS_ST
          ])
        );
        blocoCCount++;

        // Itens: Registro C170
        const itens = doc.itens || [];
        const analiticoMap = new Map();

        for (let i = 0; i < itens.length; i++) {
          const item = itens[i];
          const nItem = item.numero_item || (i + 1);
          const cfop = item.cfop_escriturado || item.cfop_origem || (indOper === '1' ? '5102' : '1102');
          const cstIcms = item.cst_icms || '00';
          const aliqIcms = parseFloat(item.aliquota_icms) || 0;

          this.addLine(
            SpedFormatter.buildLine([
              'C170',
              String(nItem),
              item.codigo_item,
              item.descricao_complementar || '',
              SpedFormatter.formatQty(item.quantidade_comercial || 1),
              item.unidade_medida || 'UN',
              SpedFormatter.formatMoney(item.valor_bruto),
              SpedFormatter.formatMoney(item.valor_desconto || 0),
              '0', // IND_MOV
              cstIcms,
              cfop,
              '', // COD_NAT
              SpedFormatter.formatMoney(item.valor_bc_icms || 0),
              SpedFormatter.formatRate(aliqIcms),
              SpedFormatter.formatMoney(item.valor_icms || 0),
              SpedFormatter.formatMoney(item.valor_bc_icms_st || 0),
              SpedFormatter.formatRate(item.aliquota_icms_st || 0),
              SpedFormatter.formatMoney(item.valor_icms_st || 0),
              '0', // IND_APUR
              item.cst_ipi || '99',
              item.codigo_enquadramento_ipi || '999',
              SpedFormatter.formatMoney(item.valor_bc_ipi || 0),
              SpedFormatter.formatRate(item.aliquota_ipi || 0),
              SpedFormatter.formatMoney(item.valor_ipi || 0),
              item.cst_pis || '70',
              SpedFormatter.formatMoney(item.valor_bc_pis || 0),
              SpedFormatter.formatRate(item.aliquota_pis || 0),
              SpedFormatter.formatMoney(item.valor_pis || 0),
              item.cst_cofins || '70',
              SpedFormatter.formatMoney(item.valor_bc_cofins || 0),
              SpedFormatter.formatRate(item.aliquota_cofins || 0),
              SpedFormatter.formatMoney(item.valor_cofins || 0),
              '' // COD_CTA
            ])
          );
          blocoCCount++;

          // Agrupador para Registro C190 (Analítico do Documento)
          const keyC190 = `${cstIcms}|${cfop}|${aliqIcms.toFixed(2)}`;
          const current = analiticoMap.get(keyC190) || {
            cst: cstIcms,
            cfop,
            aliq: aliqIcms,
            vlOpr: 0,
            vlBcIcms: 0,
            vlIcms: 0,
            vlBcIcmsSt: 0,
            vlIcmsSt: 0,
            vlIpi: 0
          };
          current.vlOpr += parseFloat(item.valor_bruto) || 0;
          current.vlBcIcms += parseFloat(item.valor_bc_icms) || 0;
          current.vlIcms += parseFloat(item.valor_icms) || 0;
          current.vlBcIcmsSt += parseFloat(item.valor_bc_icms_st) || 0;
          current.vlIcmsSt += parseFloat(item.valor_icms_st) || 0;
          current.vlIpi += parseFloat(item.valor_ipi) || 0;
          analiticoMap.set(keyC190, current);
        }

        // Registro C190: Consolidação Analítica da NF-e
        for (const analitico of analiticoMap.values()) {
          this.addLine(
            SpedFormatter.buildLine([
              'C190',
              analitico.cst,
              analitico.cfop,
              SpedFormatter.formatRate(analitico.aliq),
              SpedFormatter.formatMoney(analitico.vlOpr),
              SpedFormatter.formatMoney(analitico.vlBcIcms),
              SpedFormatter.formatMoney(analitico.vlIcms),
              SpedFormatter.formatMoney(analitico.vlBcIcmsSt),
              SpedFormatter.formatMoney(analitico.vlIcmsSt),
              SpedFormatter.formatMoney(0), // VL_RED_BC
              SpedFormatter.formatMoney(analitico.vlIpi),
              '' // COD_OBS
            ])
          );
          blocoCCount++;
        }
      }
    }

    // Registro C990: Encerramento do Bloco C
    blocoCCount++;
    this.addLine(SpedFormatter.buildLine(['C990', String(blocoCCount)]));
  }

  buildBlocoE({ periodoInicio, periodoFim, apuracaoIcms }) {
    let blocoECount = 0;

    // Registro E001: Abertura do Bloco E
    this.addLine(SpedFormatter.buildLine(['E001', '0']));
    blocoECount++;

    // Registro E100: Período da Apuração do ICMS
    this.addLine(
      SpedFormatter.buildLine([
        'E100',
        SpedFormatter.formatDate(periodoInicio),
        SpedFormatter.formatDate(periodoFim)
      ])
    );
    blocoECount++;

    const ap = apuracaoIcms || {
      total_debitos: 0,
      total_creditos: 0,
      saldo_credor_anterior: 0,
      saldo_devedor_apurado: 0,
      imposto_a_recolher: 0,
      saldo_credor_transportar: 0
    };

    // Registro E110: Apuração do ICMS - Operações Próprias
    this.addLine(
      SpedFormatter.buildLine([
        'E110',
        SpedFormatter.formatMoney(ap.total_debitos),
        SpedFormatter.formatMoney(0), // VL_AJ_DEBITOS
        SpedFormatter.formatMoney(0), // VL_TOT_AJ_DEBITOS
        SpedFormatter.formatMoney(0), // VL_ESTORNOS_CRED
        SpedFormatter.formatMoney(ap.total_creditos),
        SpedFormatter.formatMoney(0), // VL_AJ_CREDITOS
        SpedFormatter.formatMoney(0), // VL_TOT_AJ_CREDITOS
        SpedFormatter.formatMoney(0), // VL_ESTORNOS_DEB
        SpedFormatter.formatMoney(ap.saldo_credor_anterior),
        SpedFormatter.formatMoney(ap.saldo_devedor_apurado),
        SpedFormatter.formatMoney(0), // VL_TOT_DEDUC
        SpedFormatter.formatMoney(ap.imposto_a_recolher),
        SpedFormatter.formatMoney(ap.saldo_credor_transportar),
        SpedFormatter.formatMoney(0)  // DEB_ESP
      ])
    );
    blocoECount++;

    // Registro E116: Obrigações do ICMS Recolhido ou a Recolher
    if (ap.imposto_a_recolher > 0) {
      // Vencimento padrão no 20º dia do mês subsequente
      const dtVenc = new Date(periodoFim);
      dtVenc.setDate(20);
      dtVenc.setMonth(dtVenc.getMonth() + 1);

      this.addLine(
        SpedFormatter.buildLine([
          'E116',
          '000', // Código da Obrigação a recolher (ICMS Normal)
          SpedFormatter.formatMoney(ap.imposto_a_recolher),
          SpedFormatter.formatDate(dtVenc),
          '046-2', // Código de Receita Estadual (exemplo SP GARE ICMS Normal)
          '',
          '',
          '',
          '',
          '',
          `0${periodoInicio.substring(5, 7)}${periodoInicio.substring(0, 4)}` // Mes/Ano
        ])
      );
      blocoECount++;
    }

    // Registro E990: Encerramento do Bloco E
    blocoECount++;
    this.addLine(SpedFormatter.buildLine(['E990', String(blocoECount)]));
  }

  buildBloco9() {
    // Registro 9001: Abertura do Bloco 9
    this.addLine(SpedFormatter.buildLine(['9001', '0']));

    // Totalização de Registros do Arquivo (Registro 9900)
    for (const [reg, count] of this.counters.entries()) {
      this.addLine(SpedFormatter.buildLine(['9900', reg, String(count)]));
    }

    // Incluir contadores dos registros 9900, 9990 e 9999
    const qtdTipos = this.counters.size + 3; // + 9900, 9990, 9999
    this.addLine(SpedFormatter.buildLine(['9900', '9900', String(qtdTipos)]));
    this.addLine(SpedFormatter.buildLine(['9900', '9990', '1']));
    this.addLine(SpedFormatter.buildLine(['9900', '9999', '1']));

    // Registro 9990: Encerramento do Bloco 9
    this.addLine(SpedFormatter.buildLine(['9990', String(qtdTipos + 2)]));

    // Registro 9999: Encerramento do Arquivo Digital (+1 para incluir a própria linha)
    this.addLine(SpedFormatter.buildLine(['9999', String(this.totalLinhas + 1)]));
  }
}
