import assert from 'node:assert/strict';
import { DfeParser } from '../src/services/dfeParser.js';
import { DeParaService } from '../src/services/deParaService.js';
import { TaxCalculationEngine } from '../src/services/taxCalculationEngine.js';
import { PreValidatorService } from '../src/services/preValidatorService.js';
import { EfdIcmsIpiGenerator } from '../src/services/sped/efdIcmsIpiGenerator.js';
import { EfdContribuicoesGenerator } from '../src/services/sped/efdContribuicoesGenerator.js';

console.log('🧪 [TEST SUITE] Iniciando Bateria de Testes do Módulo de Escrituração Fiscal e SPED...\n');

// ============================================================================
// TESTE 1: Parser de NF-e e CT-e
// ============================================================================
console.log('▶ Teste 1: Parser de XML de NF-e...');
const xmlNfeExemplo = `<?xml version="1.0" encoding="UTF-8"?>
<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
  <NFe>
    <infNFe Id="NFe35260128192837000109550010000123451000123458" versao="4.00">
      <ide>
        <cUF>35</cUF>
        <cNF>00012345</cNF>
        <natOp>VENDA DE MERCADORIAS</natOp>
        <mod>55</mod>
        <serie>1</serie>
        <nNF>12345</nNF>
        <dhEmi>2026-01-15T10:00:00-03:00</dhEmi>
        <tpNF>1</tpNF>
        <idDest>1</idDest>
        <cMunFG>3550308</cMunFG>
        <tpImp>1</tpImp>
        <tpEmis>1</tpEmis>
        <cDV>8</cDV>
        <tpAmb>1</tpAmb>
        <finNFe>1</finNFe>
        <indFinal>0</indFinal>
        <indPres>1</indPres>
        <procEmi>0</procEmi>
        <verProc>1.0</verProc>
      </ide>
      <emit>
        <CNPJ>28192837000109</CNPJ>
        <xNome>Comércio Distribuidor Paulistano Ltda</xNome>
        <xFant>Distribuidora Paulistano</xFant>
        <enderEmit>
          <xLgr>Av Paulista</xLgr>
          <nro>1000</nro>
          <xBairro>Bela Vista</xBairro>
          <cMun>3550308</cMun>
          <xMun>Sao Paulo</xMun>
          <UF>SP</UF>
          <CEP>01310100</CEP>
        </enderEmit>
        <IE>112233445566</IE>
        <CRT>3</CRT>
      </emit>
      <dest>
        <CNPJ>98765432000188</CNPJ>
        <xNome>Supermercado Bom Preço Ltda</xNome>
        <enderDest>
          <xLgr>Rua das Flores</xLgr>
          <nro>50</nro>
          <xBairro>Centro</xBairro>
          <cMun>3550308</cMun>
          <xMun>Sao Paulo</xMun>
          <UF>SP</UF>
          <CEP>01001000</CEP>
        </enderDest>
        <indIEDest>1</indIEDest>
        <IE>998877665544</IE>
      </dest>
      <det nItem="1">
        <prod>
          <cProd>PROD001</cProd>
          <cEAN>7891234567890</cEAN>
          <xProd>Solvente Industrial Alifático 20L</xProd>
          <NCM>29011000</NCM>
          <CFOP>5102</CFOP>
          <uCom>UN</uCom>
          <qCom>10.0000</qCom>
          <vUnCom>100.00</vUnCom>
          <vProd>1000.00</vProd>
          <cEANTrib>7891234567890</cEANTrib>
          <uTrib>UN</uTrib>
          <qTrib>10.0000</qTrib>
          <vUnTrib>100.00</vUnTrib>
          <indTot>1</indTot>
        </prod>
        <imposto>
          <ICMS>
            <ICMS00>
              <orig>0</orig>
              <CST>00</CST>
              <modBC>3</modBC>
              <vBC>1000.00</vBC>
              <pICMS>18.00</pICMS>
              <vICMS>180.00</vICMS>
            </ICMS00>
          </ICMS>
          <PIS>
            <PISAliq>
              <CST>01</CST>
              <vBC>1000.00</vBC>
              <pPIS>1.65</pPIS>
              <vPIS>16.50</vPIS>
            </PISAliq>
          </PIS>
          <COFINS>
            <COFINSAliq>
              <CST>01</CST>
              <vBC>1000.00</vBC>
              <pCOFINS>7.60</pCOFINS>
              <vCOFINS>76.00</vCOFINS>
            </COFINSAliq>
          </COFINS>
        </imposto>
      </det>
      <total>
        <ICMSTot>
          <vBC>1000.00</vBC>
          <vICMS>180.00</vICMS>
          <vICMSDeson>0.00</vICMSDeson>
          <vFCP>0.00</vFCP>
          <vBCST>0.00</vBCST>
          <vST>0.00</vST>
          <vFCPST>0.00</vFCPST>
          <vFCPSTRet>0.00</vFCPSTRet>
          <vProd>1000.00</vProd>
          <vFrete>0.00</vFrete>
          <vSeg>0.00</vSeg>
          <vDesc>0.00</vDesc>
          <vII>0.00</vII>
          <vIPI>0.00</vIPI>
          <vIPIDevol>0.00</vIPIDevol>
          <vPIS>16.50</vPIS>
          <vCOFINS>76.00</vCOFINS>
          <vOutro>0.00</vOutro>
          <vNF>1000.00</vNF>
        </ICMSTot>
      </total>
    </infNFe>
    <protNFe versao="4.00">
      <infProt>
        <tpAmb>1</tpAmb>
        <verAplic>SP_NFE_PL_009</verAplic>
        <chNFe>35260128192837000109550010000123451000123458</chNFe>
        <dhRecbto>2026-01-15T10:05:00-03:00</dhRecbto>
        <nProt>135260000123456</nProt>
        <digVal>abcdef123456=</digVal>
        <cStat>100</cStat>
        <xMotivo>Autorizado o uso da NF-e</xMotivo>
      </infProt>
    </protNFe>
  </NFe>
</nfeProc>`;

const parser = new DfeParser();
const parsedNfe = parser.parse(xmlNfeExemplo);

assert.equal(parsedNfe.numero, 12345);
assert.equal(parsedNfe.modelo, '55');
assert.equal(parsedNfe.totais.valor_total_documento, 1000);
assert.equal(parsedNfe.totais.valor_icms, 180);
assert.equal(parsedNfe.itens.length, 1);
assert.equal(parsedNfe.itens[0].cfop_origem, '5102');
console.log('   ✅ NF-e parseada com sucesso (Chave:', parsedNfe.chave_acesso, ')');

// ============================================================================
// TESTE 2: Resolução de "De-Para" Fiscal
// ============================================================================
console.log('\n▶ Teste 2: Algoritmo de De-Para Fiscal...');
const dePara = new DeParaService();

// Caso A: Revenda Interna no Lucro Real
const dpRevenda = dePara.aplicarMatrizPadrao('5102', true, 'REVENDA', 'LUCRO_REAL');
assert.equal(dpRevenda.cfop_escriturado, '1102');
assert.equal(dpRevenda.cst_icms_escriturado, '00');
assert.equal(dpRevenda.cst_pis_escriturado, '50');
assert.equal(dpRevenda.credita_icms, true);
assert.equal(dpRevenda.credita_pis_cofins, true);

// Caso B: Uso e Consumo Interestadual
const dpConsumo = dePara.aplicarMatrizPadrao('6102', false, 'USO_CONSUMO', 'LUCRO_REAL');
assert.equal(dpConsumo.cfop_escriturado, '2556');
assert.equal(dpConsumo.cst_icms_escriturado, '90');
assert.equal(dpConsumo.cst_pis_escriturado, '70');
assert.equal(dpConsumo.credita_icms, false);
assert.equal(dpConsumo.credita_pis_cofins, false);

// Caso C: Substituição Tributária
const dpST = dePara.aplicarMatrizPadrao('5405', true, 'REVENDA', 'LUCRO_PRESUMIDO');
assert.equal(dpST.cfop_escriturado, '1403');
assert.equal(dpST.cst_icms_escriturado, '60');
console.log('   ✅ Regras De-Para: Revenda (5102->1102), Consumo (6102->2556) e ST (5405->1403) validadas!');

// ============================================================================
// TESTE 3: Motor de Apuração (ICMS, IPI, PIS/COFINS com Tema 69 STF)
// ============================================================================
console.log('\n▶ Teste 3: Motor de Apuração Tributária...');

const empresaTeste = {
  razao_social: 'Comércio Distribuidor Paulistano Ltda',
  cnpj: '28192837000109',
  uf: 'SP',
  inscricao_estadual: '112233445566',
  codigo_municipio_ibge: '3550308',
  regime_tributario: 'LUCRO_REAL',
  perfil_sped: 'A'
};

const docSaida = {
  id: 'doc-saida-1',
  numero: 12345,
  serie: '1',
  chave_acesso: '35260128192837000109550010000123451000123451',
  tipo_operacao: 'SAIDA',
  tipo_emissao: 'PROPRIA',
  situacao_documento: '00',
  data_emissao: '2026-01-15',
  participante_codigo: 'CLI001',
  destinatario: {
    cnpj_cpf: '98765432000188',
    uf: 'SP'
  },
  valor_total_documento: 10000.00,
  totais: {
    valor_total_documento: 10000.00,
    valor_produtos: 10000.00,
    valor_bc_icms: 10000.00,
    valor_icms: 1800.00
  },
  itens: [
    {
      numero_item: 1,
      codigo_item: 'PROD001',
      cfop_escriturado: '5102',
      ncm: '29011000',
      valor_bruto: 10000.00,
      valor_desconto: 0,
      cst_icms: '00',
      valor_bc_icms: 10000.00,
      aliquota_icms: 18.00,
      valor_icms: 1800.00,
      cst_pis: '01',
      cst_cofins: '01'
    }
  ]
};

const docEntrada = {
  id: 'doc-entrada-1',
  numero: 987,
  serie: '1',
  chave_acesso: '35260101234567000189550010000009871000009873',
  tipo_operacao: 'ENTRADA',
  tipo_emissao: 'TERCEIROS',
  situacao_documento: '00',
  data_emissao: '2026-01-10',
  participante_codigo: 'CLI001',
  emitente: {
    cnpj_cpf: '98765432000188',
    uf: 'SP'
  },
  valor_total_documento: 4000.00,
  totais: {
    valor_total_documento: 4000.00,
    valor_produtos: 4000.00,
    valor_bc_icms: 4000.00,
    valor_icms: 720.00
  },
  itens: [
    {
      numero_item: 1,
      codigo_item: 'PROD002',
      cfop_escriturado: '1102',
      ncm: '39011010',
      destinacao_item: 'REVENDA',
      credita_icms: true,
      valor_bruto: 4000.00,
      valor_desconto: 0,
      cst_icms: '00',
      valor_bc_icms: 4000.00,
      aliquota_icms: 18.00,
      valor_icms: 720.00,
      cst_pis: '50',
      cst_cofins: '50'
    }
  ]
};

const docs = [docSaida, docEntrada];

const resultadoApuracao = TaxCalculationEngine.apurarPeriodo({
  empresa: empresaTeste,
  documentos: docs,
  saldoCredorAnteriorIcms: 200.00,
  aplicarTeseSeculo: true
});

// ICMS: Débitos = 1800 | Créditos = 720 + 200 (anterior) = 920 | A Recolher = 1800 - 920 = 880
assert.equal(resultadoApuracao.icms.total_debitos, 1800.00);
assert.equal(resultadoApuracao.icms.total_creditos, 720.00);
assert.equal(resultadoApuracao.icms.saldo_credor_anterior, 200.00);
assert.equal(resultadoApuracao.icms.imposto_a_recolher, 880.00);

// PIS com Tema 69 STF: Base Saída = 10000 - 1800 (ICMS) = 8200 * 1.65% = 135.30
// Crédito PIS: Base Entrada = 4000 * 1.65% = 66.00
// PIS a Recolher = 135.30 - 66.00 = 69.30
assert.equal(resultadoApuracao.pis.total_icms_excluido_tema69, 1800.00);
assert.equal(resultadoApuracao.pis.base_calculo_saidas, 8200.00);
assert.equal(resultadoApuracao.pis.total_debitos, 135.30);
assert.equal(resultadoApuracao.pis.total_creditos, 66.00);
assert.equal(resultadoApuracao.pis.imposto_a_recolher, 69.30);

console.log('   ✅ ICMS: Déb R$ 1.800 - Créd R$ 920 = A Recolher R$ 880,00');
console.log('   ✅ PIS (Tema 69 STF): ICMS excluído da base (R$ 8.200) -> Déb R$ 135,30 - Créd R$ 66,00 = A Recolher R$ 69,30');

// ============================================================================
// TESTE 4: Gerador de SPED EFD ICMS IPI (0000, C100, C170, E110, 9999)
// ============================================================================
console.log('\n▶ Teste 4: Gerador de SPED Fiscal (EFD ICMS IPI)...');
const efdGenerator = new EfdIcmsIpiGenerator();
const spedContent = efdGenerator.generate({
  empresa: empresaTeste,
  periodoInicio: '2026-01-01',
  periodoFim: '2026-01-31',
  participantes: [
    {
      codigo_participante: 'CLI001',
      nome: 'Supermercado Bom Preço Ltda',
      cnpj_cpf: '98765432000188',
      uf: 'SP',
      inscricao_estadual: '998877665544',
      codigo_municipio_ibge: '3550308'
    }
  ],
  produtos: [
    {
      codigo_item: 'PROD001',
      descricao: 'Solvente Industrial Alifático 20L',
      unidade_medida: 'UN',
      tipo_item: '00',
      ncm: '29011000'
    }
  ],
  documentos: [docSaida],
  apuracaoIcms: resultadoApuracao.icms
});

assert.ok(spedContent.includes('|0000|018|0|01012026|31012026|Comércio Distribuidor Paulistano Ltda|28192837000109|SP|112233445566|3550308|'));
assert.ok(spedContent.includes('|C100|1|0|'));
assert.ok(spedContent.includes('|C170|1|PROD001|'));
assert.ok(spedContent.includes('|E110|1800,00|'));
assert.ok(spedContent.includes('|9999|'));

console.log('   ✅ Arquivo SPED EFD ICMS IPI gerado com sucesso!');

// Teste EFD-Contribuições
const efdContrGenerator = new EfdContribuicoesGenerator();
const spedContrContent = efdContrGenerator.generate({
  empresa: empresaTeste,
  periodoInicio: '2026-01-01',
  periodoFim: '2026-01-31',
  participantes: [
    {
      codigo_participante: 'CLI001',
      nome: 'Supermercado Bom Preço Ltda',
      cnpj_cpf: '98765432000188',
      uf: 'SP',
      inscricao_estadual: '998877665544',
      codigo_municipio_ibge: '3550308'
    }
  ],
  produtos: [
    {
      codigo_item: 'PROD001',
      descricao: 'Solvente Industrial Alifático 20L',
      unidade_medida: 'UN',
      tipo_item: '00',
      ncm: '29011000'
    }
  ],
  documentos: [docSaida],
  apuracaoPis: resultadoApuracao.pis,
  apuracaoCofins: resultadoApuracao.cofins
});

assert.ok(spedContrContent.includes('|0000|006|0|01012026|31012026|Comércio Distribuidor Paulistano Ltda|'));
assert.ok(spedContrContent.includes('|0110|1|1|1|')); // Não-cumulativo
assert.ok(spedContrContent.includes('|M200|135,30|0,00|0,00|66,00|0,00|0,00|0,00|69,30|')); // PIS M200
assert.ok(spedContrContent.includes('|M600|')); // COFINS M600
assert.ok(spedContrContent.includes('|9999|'));
console.log('   ✅ Arquivo SPED EFD-Contribuições gerado com sucesso! Contém Registros 0000, 0110, C100, M200, M600 e 9999.');

const linhasSped = spedContent.trim().split('\r\n');
console.log(`   📄 Amostra Linha 1: ${linhasSped[0]}`);
console.log(`   📄 Amostra Linha E110: ${linhasSped.find(l => l.startsWith('|E110|'))}`);
console.log(`   📄 Amostra Linha 9999: ${linhasSped[linhasSped.length - 1]}`);

// ============================================================================
// TESTE 5: Pré-Validador de 10 Regras
// ============================================================================
console.log('\n▶ Teste 5: Pré-Validador e Auditoria Fiscal...');

// Teste com o lote consistente
const auditValida = PreValidatorService.auditarPeriodo({
  empresa: empresaTeste,
  documentos: [docSaida],
  participantes: [
    {
      codigo_participante: 'CLI001',
      nome: 'Supermercado Bom Preço Ltda',
      cnpj_cpf: '98765432000188',
      uf: 'SP',
      inscricao_estadual: '998877665544',
      codigo_municipio_ibge: '3550308'
    }
  ],
  produtos: [
    {
      codigo_item: 'PROD001',
      descricao: 'Solvente Industrial Alifático 20L',
      unidade_medida: 'UN',
      tipo_item: '00',
      ncm: '29011000'
    }
  ],
  apuracaoIcms: {
    total_debitos: 1800.00,
    total_creditos: 0.00
  }
});

console.log('   Resultado Auditoria Consistente:', auditValida.status, '(Erros:', auditValida.erros_impeditivos, ')');
console.log('   Inconsistências encontradas:', auditValida.inconsistencias);
assert.equal(auditValida.erros_impeditivos, 0);

// Teste provocando inconsistência (chave inválida e soma de itens divergente)
const docInconsistente = {
  ...docSaida,
  chave_acesso: '35260128192837000109550010000123451000123450', // DV errado propositalmente
  valor_total_documento: 9999.00 // Diverge da soma dos itens (10000)
};

const auditInconsistente = PreValidatorService.auditarPeriodo({
  empresa: empresaTeste,
  documentos: [docInconsistente],
  participantes: [], // Participante órfão proposital
  produtos: [],
  apuracaoIcms: { total_debitos: 1800.00, total_creditos: 0 }
});

console.log('   Resultado Auditoria Inconsistente:', auditInconsistente.status, '(Erros:', auditInconsistente.erros_impeditivos, ')');
assert.ok(auditInconsistente.erros_impeditivos > 0);
assert.ok(auditInconsistente.inconsistencias.some(i => i.codigo === 'VAL_CHAVE_ACESSO_DV'));
assert.ok(auditInconsistente.inconsistencias.some(i => i.codigo === 'VAL_C100_VS_C170_TOTAL'));
assert.ok(auditInconsistente.inconsistencias.some(i => i.codigo === 'VAL_PARTICIPANTE_ORFAO'));

console.log('   ✅ Pré-validador interceptou corretamente DV inválido, divergência C100 vs C170 e participante órfão!\n');

console.log('🎉 TODOS OS TESTES FORAM EXECUTADOS COM SUCESSO!');
