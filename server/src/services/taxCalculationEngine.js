/**
 * Motor de Apuração Fiscal e Tributária
 * Executa a consolidação de saldos credores e devedores para ICMS, IPI, PIS e COFINS
 * nos regimes Simples Nacional, Lucro Presumido (Cumulativo) e Lucro Real (Não-Cumulativo).
 */
export class TaxCalculationEngine {
  /**
   * Executa a apuração mensal completa de uma empresa para um período fiscal
   */
  static apurarPeriodo({
    empresa,
    documentos = [],
    saldoCredorAnteriorIcms = 0,
    saldoCredorAnteriorPis = 0,
    saldoCredorAnteriorCofins = 0,
    aplicarTeseSeculo = true // Abate o ICMS da base do PIS/COFINS (Tema 69 STF)
  }) {
    const regime = empresa.regime_tributario || 'LUCRO_PRESUMIDO';

    // 1. Apuração de ICMS Próprio (Princípio da Não-Cumulatividade)
    const apuracaoIcms = this.apurarIcmsProprio(documentos, saldoCredorAnteriorIcms, regime);

    // 2. Apuração de IPI
    const apuracaoIpi = this.apurarIpi(documentos, regime);

    // 3. Apuração de PIS e COFINS
    const apuracaoPis = this.apurarContribuicao({
      tipo: 'PIS',
      documentos,
      regime,
      saldoAnterior: saldoCredorAnteriorPis,
      aliqPresumido: 0.65,
      aliqReal: 1.65,
      aplicarTeseSeculo
    });

    const apuracaoCofins = this.apurarContribuicao({
      tipo: 'COFINS',
      documentos,
      regime,
      saldoAnterior: saldoCredorAnteriorCofins,
      aliqPresumido: 3.00,
      aliqReal: 7.60,
      aplicarTeseSeculo
    });

    return {
      regime,
      icms: apuracaoIcms,
      ipi: apuracaoIpi,
      pis: apuracaoPis,
      cofins: apuracaoCofins,
      apurado_em: new Date().toISOString()
    };
  }

  /**
   * Apuração do ICMS Próprio (Mapeado no Bloco E / Registro E110 do SPED)
   */
  static apurarIcmsProprio(documentos, saldoCredorAnterior = 0, regime = 'LUCRO_REAL') {
    let totalDebitos = 0;
    let totalCreditos = 0;
    let baseCalculoDebito = 0;
    let baseCalculoCredito = 0;
    const memoriaDocs = [];

    for (const doc of documentos) {
      if (doc.situacao_documento && doc.situacao_documento !== '00') continue; // Apenas regulares

      const isSaida = doc.tipo_operacao === 'SAIDA';
      const itens = doc.itens || [];

      for (const item of itens) {
        const vIcms = parseFloat(item.valor_icms) || 0;
        const vBcIcms = parseFloat(item.valor_bc_icms) || 0;

        if (isSaida) {
          // Débito pelas saídas tributadas (CST 00, 10, 20, 70, 90)
          if (['00', '10', '20', '70', '90'].includes(String(item.cst_icms))) {
            totalDebitos += vIcms;
            baseCalculoDebito += vBcIcms;
          }
        } else {
          // Entradas: Créditos válidos apenas para Revenda e Insumos no Lucro Real / Presumido
          const permiteCredito = item.credita_icms !== false &&
            ['REVENDA', 'INSUMO'].includes(item.destinacao_item || 'REVENDA') &&
            ['00', '10', '20', '70'].includes(String(item.cst_icms)) &&
            regime !== 'SIMPLES_NACIONAL';

          if (permiteCredito) {
            totalCreditos += vIcms;
            baseCalculoCredito += vBcIcms;
          }
        }
      }

      memoriaDocs.push({
        chave_acesso: doc.chave_acesso,
        numero: doc.numero,
        serie: doc.serie,
        tipo: doc.tipo_operacao,
        valor_icms: isSaida ? doc.totais?.valor_icms || 0 : (doc.itens?.filter(i => i.credita_icms).reduce((s, i) => s + (i.valor_icms || 0), 0) || 0)
      });
    }

    totalDebitos = Math.round(totalDebitos * 100) / 100;
    totalCreditos = Math.round(totalCreditos * 100) / 100;
    saldoCredorAnterior = Math.round(saldoCredorAnterior * 100) / 100;

    let saldoDevedor = 0;
    let impostoRecolher = 0;
    let saldoCredorTransportar = 0;

    const totalDisponivel = totalCreditos + saldoCredorAnterior;

    if (totalDebitos > totalDisponivel) {
      saldoDevedor = Math.round((totalDebitos - totalDisponivel) * 100) / 100;
      impostoRecolher = saldoDevedor;
      saldoCredorTransportar = 0;
    } else {
      saldoDevedor = 0;
      impostoRecolher = 0;
      saldoCredorTransportar = Math.round((totalDisponivel - totalDebitos) * 100) / 100;
    }

    return {
      imposto: 'ICMS_PROPRIO',
      base_calculo_debito: Math.round(baseCalculoDebito * 100) / 100,
      base_calculo_credito: Math.round(baseCalculoCredito * 100) / 100,
      total_debitos: totalDebitos,
      total_creditos: totalCreditos,
      saldo_credor_anterior: saldoCredorAnterior,
      saldo_devedor_apurado: saldoDevedor,
      imposto_a_recolher: impostoRecolher,
      saldo_credor_transportar: saldoCredorTransportar,
      memoria_calculo: {
        documentos_processados: memoriaDocs.length,
        resumo_docs: memoriaDocs.slice(0, 50)
      }
    };
  }

  /**
   * Apuração do IPI (Bloco E / Registro E520)
   */
  static apurarIpi(documentos, regime) {
    let totalDebitos = 0;
    let totalCreditos = 0;

    for (const doc of documentos) {
      if (doc.situacao_documento && doc.situacao_documento !== '00') continue;
      const isSaida = doc.tipo_operacao === 'SAIDA';
      for (const item of (doc.itens || [])) {
        const vIpi = parseFloat(item.valor_ipi) || 0;
        if (isSaida && ['00', '50'].includes(String(item.cst_ipi))) {
          totalDebitos += vIpi;
        } else if (!isSaida && ['00', '50'].includes(String(item.cst_ipi)) && item.credita_ipi) {
          totalCreditos += vIpi;
        }
      }
    }

    totalDebitos = Math.round(totalDebitos * 100) / 100;
    totalCreditos = Math.round(totalCreditos * 100) / 100;
    const impostoRecolher = totalDebitos > totalCreditos ? Math.round((totalDebitos - totalCreditos) * 100) / 100 : 0;
    const saldoCredor = totalCreditos > totalDebitos ? Math.round((totalCreditos - totalDebitos) * 100) / 100 : 0;

    return {
      imposto: 'IPI',
      total_debitos: totalDebitos,
      total_creditos: totalCreditos,
      imposto_a_recolher: impostoRecolher,
      saldo_credor_transportar: saldoCredor
    };
  }

  /**
   * Apuração Genérica de Contribuições (PIS ou COFINS)
   */
  static apurarContribuicao({
    tipo,
    documentos,
    regime,
    saldoAnterior = 0,
    aliqPresumido,
    aliqReal,
    aplicarTeseSeculo
  }) {
    const isPis = tipo === 'PIS';
    const fieldValor = isPis ? 'valor_pis' : 'valor_cofins';
    const fieldBc = isPis ? 'valor_bc_pis' : 'valor_bc_cofins';
    const fieldCst = isPis ? 'cst_pis' : 'cst_cofins';

    let totalDebitos = 0;
    let totalCreditos = 0;
    let totalBaseCalculoSaida = 0;
    let totalBaseCalculoCredito = 0;
    let totalIcmsExcluido = 0;

    if (regime === 'SIMPLES_NACIONAL') {
      return {
        imposto: tipo,
        regime: 'SIMPLES_NACIONAL',
        mensagem: 'Apuração unificada via DAS no PGDAS-D.',
        imposto_a_recolher: 0,
        saldo_credor_transportar: 0
      };
    }

    const isNaoCumulativo = regime === 'LUCRO_REAL';
    const aliquotaPadrao = isNaoCumulativo ? aliqReal : aliqPresumido;

    for (const doc of documentos) {
      if (doc.situacao_documento && doc.situacao_documento !== '00') continue;
      const isSaida = doc.tipo_operacao === 'SAIDA';

      for (const item of (doc.itens || [])) {
        const vBruto = parseFloat(item.valor_bruto) || 0;
        const vDesc = parseFloat(item.valor_desconto) || 0;
        const vIcms = parseFloat(item.valor_icms) || 0;
        const cst = String(item[fieldCst] || '70');

        if (isSaida) {
          // CSTs de saída tributada: 01 (Operação Tributável com Alíquota Básica), 02, 03
          if (['01', '02', '03'].includes(cst)) {
            let base = vBruto - vDesc;

            // Tema 69 STF: Exclusão do ICMS da base de PIS e COFINS
            if (aplicarTeseSeculo && vIcms > 0) {
              base = Math.max(0, base - vIcms);
              totalIcmsExcluido += vIcms;
            }

            const valorCalculado = Math.round((base * (aliquotaPadrao / 100)) * 100) / 100;
            totalBaseCalculoSaida += base;
            totalDebitos += valorCalculado;
          }
        } else if (isNaoCumulativo) {
          // Entradas: No Lucro Real, permite crédito em insumos e revenda (CSTs 50 a 66)
          const isItemApropriavel = ['REVENDA', 'INSUMO'].includes(item.destinacao_item);
          if (isItemApropriavel && cst.startsWith('5')) {
            const baseCred = vBruto - vDesc;
            const valorCredito = Math.round((baseCred * (aliquotaPadrao / 100)) * 100) / 100;
            totalBaseCalculoCredito += baseCred;
            totalCreditos += valorCredito;
          }
        }
      }
    }

    totalDebitos = Math.round(totalDebitos * 100) / 100;
    totalCreditos = Math.round(totalCreditos * 100) / 100;
    saldoAnterior = Math.round(saldoAnterior * 100) / 100;

    let saldoDevedor = 0;
    let impostoRecolher = 0;
    let saldoCredorTransportar = 0;

    const totalDisponivel = totalCreditos + saldoAnterior;

    if (totalDebitos > totalDisponivel) {
      saldoDevedor = Math.round((totalDebitos - totalDisponivel) * 100) / 100;
      impostoRecolher = saldoDevedor;
      saldoCredorTransportar = 0;
    } else {
      saldoDevedor = 0;
      impostoRecolher = 0;
      saldoCredorTransportar = Math.round((totalDisponivel - totalDebitos) * 100) / 100;
    }

    return {
      imposto: tipo,
      regime: isNaoCumulativo ? 'NAO_CUMULATIVO (LUCRO REAL)' : 'CUMULATIVO (LUCRO PRESUMIDO)',
      aliquota_aplicada: aliquotaPadrao,
      base_calculo_saidas: Math.round(totalBaseCalculoSaida * 100) / 100,
      base_calculo_creditos: Math.round(totalBaseCalculoCredito * 100) / 100,
      total_icms_excluido_tema69: Math.round(totalIcmsExcluido * 100) / 100,
      total_debitos: totalDebitos,
      total_creditos: totalCreditos,
      saldo_credor_anterior: saldoAnterior,
      saldo_devedor_apurado: saldoDevedor,
      imposto_a_recolher: impostoRecolher,
      saldo_credor_transportar: saldoCredorTransportar
    };
  }
}
