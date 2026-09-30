import { SpedFormatter } from './spedFormatter.js';

/**
 * Gerador de EFD-Contribuições (PIS / COFINS)
 * Conforme Guia Prático da EFD-Contribuições v1.35+
 */
export class EfdContribuicoesGenerator {
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

  generate({
    empresa,
    periodoInicio,
    periodoFim,
    participantes = [],
    produtos = [],
    documentos = [],
    apuracaoPis = null,
    apuracaoCofins = null,
    versaoLayout = '006'
  }) {
    this.lines = [];
    this.counters.clear();
    this.totalLinhas = 0;

    const indIncFisc = empresa.regime_tributario === 'LUCRO_REAL' ? '1' : '2'; // 1=Não-cumulativo, 2=Cumulativo

    // Bloco 0
    let b0 = 0;
    this.addLine(
      SpedFormatter.buildLine([
        '0000',
        versaoLayout,
        '0', // Remessa original
        SpedFormatter.formatDate(periodoInicio),
        SpedFormatter.formatDate(periodoFim),
        empresa.razao_social,
        empresa.cnpj.replace(/\D/g, ''),
        empresa.uf,
        empresa.codigo_municipio_ibge,
        empresa.suframa || '',
        '00', // IND_NAT_PJ: 00 = PJ em Geral
        '0'   // IND_ATIV: 0 = Industrial / Comercial
      ])
    );
    b0++;

    this.addLine(SpedFormatter.buildLine(['0001', '0']));
    b0++;

    // 0110: Regime de Apuração da Contribuição Previdenciária e PIS/COFINS
    this.addLine(
      SpedFormatter.buildLine([
        '0110',
        indIncFisc,
        '1', // Apuração com base nos registros de consolidação
        '1'  // Incidência exclusivamente no mercado interno
      ])
    );
    b0++;

    // 0140: Cadastro de Estabelecimento
    this.addLine(
      SpedFormatter.buildLine([
        '0140',
        'ESTAB01',
        empresa.razao_social,
        empresa.cnpj.replace(/\D/g, ''),
        empresa.uf,
        empresa.inscricao_estadual.replace(/\D/g, ''),
        empresa.codigo_municipio_ibge,
        empresa.inscricao_municipal || ''
      ])
    );
    b0++;

    // Participantes 0150
    for (const part of participantes) {
      this.addLine(
        SpedFormatter.buildLine([
          '0150',
          part.codigo_participante,
          part.nome,
          part.codigo_pais || '1058',
          (part.cnpj_cpf || '').replace(/\D/g, ''),
          '',
          (part.inscricao_estadual || '').replace(/\D/g, ''),
          part.codigo_municipio_ibge,
          part.suframa || '',
          part.logradouro || 'Avenida Comercial',
          'S/N',
          '',
          'Centro'
        ])
      );
      b0++;
    }

    // Itens 0200
    for (const prod of produtos) {
      this.addLine(
        SpedFormatter.buildLine([
          '0200',
          prod.codigo_item,
          prod.descricao,
          prod.codigo_barra_gtin || '',
          '',
          prod.unidade_medida || 'UN',
          prod.tipo_item || '00',
          (prod.ncm || '').replace(/\D/g, '')
        ])
      );
      b0++;
    }

    b0++;
    this.addLine(SpedFormatter.buildLine(['0990', String(b0)]));

    // Bloco C
    let bC = 0;
    this.addLine(SpedFormatter.buildLine(['C001', documentos.length > 0 ? '0' : '1']));
    bC++;

    for (const doc of documentos) {
      const indOper = doc.tipo_operacao === 'SAIDA' ? '1' : '0';
      const indEmit = doc.tipo_emissao === 'PROPRIA' ? '0' : '1';
      const totais = doc.totais || {};

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
          SpedFormatter.formatMoney(0),
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
          SpedFormatter.formatMoney(0),
          SpedFormatter.formatMoney(0)
        ])
      );
      bC++;
    }

    bC++;
    this.addLine(SpedFormatter.buildLine(['C990', String(bC)]));

    // Bloco M (Apuração PIS M200 / COFINS M600)
    let bM = 0;
    this.addLine(SpedFormatter.buildLine(['M001', '0']));
    bM++;

    const pis = apuracaoPis || { total_debitos: 0, total_creditos: 0, imposto_a_recolher: 0 };
    const cofins = apuracaoCofins || { total_debitos: 0, total_creditos: 0, imposto_a_recolher: 0 };

    // Registro M200: Consolidação da Contribuição para o PIS/PASEP do Período
    this.addLine(
      SpedFormatter.buildLine([
        'M200',
        SpedFormatter.formatMoney(pis.total_debitos),
        SpedFormatter.formatMoney(0),
        SpedFormatter.formatMoney(0),
        SpedFormatter.formatMoney(pis.total_creditos),
        SpedFormatter.formatMoney(0),
        SpedFormatter.formatMoney(0),
        SpedFormatter.formatMoney(0),
        SpedFormatter.formatMoney(pis.imposto_a_recolher)
      ])
    );
    bM++;

    // Registro M600: Consolidação da Contribuição para a COFINS do Período
    this.addLine(
      SpedFormatter.buildLine([
        'M600',
        SpedFormatter.formatMoney(cofins.total_debitos),
        SpedFormatter.formatMoney(0),
        SpedFormatter.formatMoney(0),
        SpedFormatter.formatMoney(cofins.total_creditos),
        SpedFormatter.formatMoney(0),
        SpedFormatter.formatMoney(0),
        SpedFormatter.formatMoney(0),
        SpedFormatter.formatMoney(cofins.imposto_a_recolher)
      ])
    );
    bM++;

    bM++;
    this.addLine(SpedFormatter.buildLine(['M990', String(bM)]));

    // Bloco 1
    this.addLine(SpedFormatter.buildLine(['1001', '1']));
    this.addLine(SpedFormatter.buildLine(['1990', '2']));

    // Bloco 9
    this.addLine(SpedFormatter.buildLine(['9001', '0']));
    for (const [reg, count] of this.counters.entries()) {
      this.addLine(SpedFormatter.buildLine(['9900', reg, String(count)]));
    }
    const qtdTipos = this.counters.size + 3;
    this.addLine(SpedFormatter.buildLine(['9900', '9900', String(qtdTipos)]));
    this.addLine(SpedFormatter.buildLine(['9900', '9990', '1']));
    this.addLine(SpedFormatter.buildLine(['9900', '9999', '1']));
    this.addLine(SpedFormatter.buildLine(['9990', String(qtdTipos + 2)]));
    this.addLine(SpedFormatter.buildLine(['9999', String(this.totalLinhas + 1)]));

    return this.lines.join('');
  }
}
