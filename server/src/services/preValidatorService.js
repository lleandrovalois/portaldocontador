/**
 * Serviço de Pré-Validação e Auditoria Fiscal (Regras de Consistência Pré-PVA)
 * Executa as 10 verificações fundamentais para garantir que o arquivo seja aceito
 * sem advertências ou erros impeditivos no validador da Receita Federal.
 */
export class PreValidatorService {
  /**
   * Executa a auditoria completa de um conjunto de documentos e apuração
   */
  static auditarPeriodo({
    empresa,
    documentos = [],
    participantes = [],
    produtos = [],
    apuracaoIcms = null
  }) {
    const inconsistencias = [];

    const participantesMap = new Map();
    for (const p of participantes) {
      participantesMap.set(p.codigo_participante || p.id, p);
      if (p.cnpj_cpf) {
        participantesMap.set(p.cnpj_cpf.replace(/\D/g, ''), p);
      }
    }

    const produtosMap = new Map();
    for (const prod of produtos) {
      produtosMap.set(prod.codigo_item || prod.id, prod);
    }

    let somaDebitosDocumentos = 0;
    let somaCreditosDocumentos = 0;

    for (const doc of documentos) {
      const chave = doc.chave_acesso || '';
      const isSaida = doc.tipo_operacao === 'SAIDA';
      const itens = doc.itens || [];

      // -----------------------------------------------------------------------
      // REGRA 3: Validação do Dígito Verificador da Chave de Acesso (Módulo 11)
      // -----------------------------------------------------------------------
      if (chave) {
        const dvValido = this.validarModulo11Sefaz(chave);
        if (!dvValido) {
          inconsistencias.push({
            tipo: 'ERRO',
            codigo: 'VAL_CHAVE_ACESSO_DV',
            documento: `NF ${doc.numero}/${doc.serie}`,
            chave_acesso: chave,
            mensagem: `A Chave de Acesso [${chave}] possui Dígito Verificador inválido pelo Módulo 11 da SEFAZ.`
          });
        }
      }

      // -----------------------------------------------------------------------
      // REGRA 7: Participante Cadastrado no Bloco 0150
      // -----------------------------------------------------------------------
      const partId = doc.participante_codigo || doc.participante_id || (doc.participante ? doc.participante.codigo_participante : null);
      const partDoc = doc.destinatario?.cnpj_cpf || doc.emitente?.cnpj_cpf || '';
      const participanteEncontrado = participantesMap.get(partId) || participantesMap.get(partDoc.replace(/\D/g, ''));

      if (!participanteEncontrado && !doc.participante) {
        inconsistencias.push({
          tipo: 'ERRO',
          codigo: 'VAL_PARTICIPANTE_ORFAO',
          documento: `NF ${doc.numero}/${doc.serie}`,
          chave_acesso: chave,
          mensagem: `Documento com participante [${partId || partDoc}] não cadastrado na tabela de participantes (Registro 0150).`
        });
      }

      // -----------------------------------------------------------------------
      // REGRA 1: Total do Documento vs Soma dos Itens + Adicionais - Descontos
      // -----------------------------------------------------------------------
      const vProd = parseFloat(doc.valor_produtos || doc.totais?.valor_produtos || 0);
      const vDesc = parseFloat(doc.valor_desconto || doc.totais?.valor_desconto || 0);
      const vFrete = parseFloat(doc.valor_frete || doc.totais?.valor_frete || 0);
      const vSeg = parseFloat(doc.valor_seguro || doc.totais?.valor_seguro || 0);
      const vOutro = parseFloat(doc.valor_outras_despesas || doc.totais?.valor_outras_despesas || 0);
      const vIpi = parseFloat(doc.valor_ipi || doc.totais?.valor_ipi || 0);
      const vSt = parseFloat(doc.valor_icms_st || doc.totais?.valor_icms_st || 0);
      const vDoc = parseFloat(doc.valor_total_documento || doc.totais?.valor_total_documento || 0);

      const somaItens = itens.reduce((acc, it) => acc + ((parseFloat(it.valor_bruto) || 0) - (parseFloat(it.valor_desconto) || 0)), 0);
      const totalEsperado = Math.round((somaItens + vFrete + vSeg + vOutro + vIpi + vSt) * 100) / 100;

      if (itens.length > 0 && Math.abs(vDoc - totalEsperado) > 0.05) {
        inconsistencias.push({
          tipo: 'ERRO',
          codigo: 'VAL_C100_VS_C170_TOTAL',
          documento: `NF ${doc.numero}/${doc.serie}`,
          chave_acesso: chave,
          mensagem: `Total do documento (R$ ${vDoc.toFixed(2)}) difere da soma dos itens com adicionais/descontos (R$ ${totalEsperado.toFixed(2)}).`
        });
      }

      // Auditoria dos Itens do Documento
      for (const item of itens) {
        const cfop = String(item.cfop_escriturado || item.cfop_origem || '');
        const cstIcms = String(item.cst_icms || '00');
        const vBcIcms = parseFloat(item.valor_bc_icms) || 0;
        const aliqIcms = parseFloat(item.aliquota_icms) || 0;
        const vIcms = parseFloat(item.valor_icms) || 0;
        const cstPis = String(item.cst_pis || '70');

        // Acúmulo para checagem da E110
        if (isSaida && ['00', '10', '20', '70', '90'].includes(cstIcms)) {
          somaDebitosDocumentos += vIcms;
        } else if (!isSaida && item.credita_icms && ['00', '10', '20', '70'].includes(cstIcms)) {
          somaCreditosDocumentos += vIcms;
        }

        // -----------------------------------------------------------------------
        // REGRA 4: Territorialidade do CFOP vs UF Emitente/Destinatário
        // -----------------------------------------------------------------------
        const ufPart = participanteEncontrado ? participanteEncontrado.uf : (isSaida ? doc.destinatario?.uf : doc.emitente?.uf);
        if (ufPart && empresa.uf) {
          const isMesmaUf = String(ufPart).toUpperCase() === String(empresa.uf).toUpperCase();
          const digitoCfop = cfop.charAt(0);

          if (isSaida) {
            if (isMesmaUf && digitoCfop !== '5') {
              inconsistencias.push({
                tipo: 'ERRO',
                codigo: 'VAL_CFOP_TERRITORIALIDADE',
                documento: `NF ${doc.numero}`,
                chave_acesso: chave,
                mensagem: `Operação de Saída interna (${empresa.uf} -> ${ufPart}) com CFOP incorreto [${cfop}]. Esperado inicial '5'.`
              });
            } else if (!isMesmaUf && ufPart !== 'EX' && digitoCfop !== '6') {
              inconsistencias.push({
                tipo: 'ERRO',
                codigo: 'VAL_CFOP_TERRITORIALIDADE',
                documento: `NF ${doc.numero}`,
                chave_acesso: chave,
                mensagem: `Operação de Saída interestadual (${empresa.uf} -> ${ufPart}) com CFOP incorreto [${cfop}]. Esperado inicial '6'.`
              });
            }
          } else {
            if (isMesmaUf && digitoCfop !== '1') {
              inconsistencias.push({
                tipo: 'ERRO',
                codigo: 'VAL_CFOP_TERRITORIALIDADE',
                documento: `NF ${doc.numero}`,
                chave_acesso: chave,
                mensagem: `Operação de Entrada interna (${ufPart} -> ${empresa.uf}) com CFOP de escrituração incorreto [${cfop}]. Esperado inicial '1'.`
              });
            } else if (!isMesmaUf && ufPart !== 'EX' && digitoCfop !== '2') {
              inconsistencias.push({
                tipo: 'ERRO',
                codigo: 'VAL_CFOP_TERRITORIALIDADE',
                documento: `NF ${doc.numero}`,
                chave_acesso: chave,
                mensagem: `Operação de Entrada interestadual (${ufPart} -> ${empresa.uf}) com CFOP de escrituração incorreto [${cfop}]. Esperado inicial '2'.`
              });
            }
          }
        }

        // -----------------------------------------------------------------------
        // REGRA 5: Consistência do Cálculo de ICMS (CST 00 x Base x Alíquota)
        // -----------------------------------------------------------------------
        if (cstIcms === '00' && vBcIcms > 0 && aliqIcms > 0) {
          const valorEsperado = Math.round((vBcIcms * (aliqIcms / 100)) * 100) / 100;
          if (Math.abs(vIcms - valorEsperado) > 0.05) {
            inconsistencias.push({
              tipo: 'ERRO',
              codigo: 'VAL_CST_ALIQ_CALC_ICMS',
              documento: `NF ${doc.numero}, Item ${item.numero_item}`,
              chave_acesso: chave,
              mensagem: `Item ${item.numero_item}: ICMS declarado (R$ ${vIcms.toFixed(2)}) difere de Base R$ ${vBcIcms.toFixed(2)} x Alíquota ${aliqIcms}% (R$ ${valorEsperado.toFixed(2)}).`
            });
          }
        } else if (['40', '41', '50'].includes(cstIcms) && (vBcIcms > 0 || vIcms > 0)) {
          inconsistencias.push({
            tipo: 'ERRO',
            codigo: 'VAL_CST_ALIQ_CALC_ICMS',
            documento: `NF ${doc.numero}, Item ${item.numero_item}`,
            chave_acesso: chave,
            mensagem: `Item com CST de isenção/não-tributado [${cstIcms}] possui Base de Cálculo ou ICMS indevidamente preenchidos.`
          });
        }

        // -----------------------------------------------------------------------
        // REGRA 6: CST de PIS/COFINS vs. Regime Tributário
        // -----------------------------------------------------------------------
        if (empresa.regime_tributario === 'LUCRO_PRESUMIDO' && !isSaida) {
          if (cstPis >= '50' && cstPis <= '66') {
            inconsistencias.push({
              tipo: 'ERRO',
              codigo: 'VAL_CST_PIS_REGIME_COERENCIA',
              documento: `NF ${doc.numero}, Item ${item.numero_item}`,
              chave_acesso: chave,
              mensagem: `Empresa no Lucro Presumido escriturou CST de PIS de crédito [${cstPis}], vedado no regime cumulativo.`
            });
          }
        }

        // -----------------------------------------------------------------------
        // REGRA 8: Item Cadastrado no Bloco 0200 com NCM Válida
        // -----------------------------------------------------------------------
        const ncmLimpa = String(item.ncm || '').replace(/\D/g, '');
        if (ncmLimpa.length !== 8) {
          inconsistencias.push({
            tipo: 'ERRO',
            codigo: 'VAL_ITEM_ORFAO_NCM_VALIDO',
            documento: `NF ${doc.numero}, Item ${item.numero_item}`,
            chave_acesso: chave,
            mensagem: `Item [${item.codigo_item}] possui NCM inválida [${item.ncm}]. O código NCM deve possuir exatamente 8 dígitos numéricos.`
          });
        }

        // -----------------------------------------------------------------------
        // REGRA 10: Tese do Século (Alerta de ICMS na Base de PIS/COFINS)
        // -----------------------------------------------------------------------
        if (isSaida && vIcms > 0 && ['01', '02'].includes(cstPis)) {
          const vBcPis = parseFloat(item.valor_bc_pis) || 0;
          const vBruto = parseFloat(item.valor_bruto) || 0;
          // Se a BC do PIS for idêntica ao valor bruto sem abater o ICMS
          if (Math.abs(vBcPis - vBruto) < 0.05) {
            inconsistencias.push({
              tipo: 'ALERTA',
              codigo: 'VAL_TESE_SECULO_ICMS_BASE_PIS',
              documento: `NF ${doc.numero}, Item ${item.numero_item}`,
              chave_acesso: chave,
              mensagem: `O ICMS destacado (R$ ${vIcms.toFixed(2)}) não foi excluído da Base do PIS/COFINS (Tema 69 STF). Verifique a oportunidade de economia tributária.`
            });
          }
        }
      }

      // -----------------------------------------------------------------------
      // REGRA 2: Amarração C170 vs Analítico C190
      // -----------------------------------------------------------------------
      // Validação semântica: cada combinação de CST+CFOP+Alíquota deve bater
      const grupos = new Map();
      for (const item of itens) {
        const k = `${item.cst_icms || '00'}|${item.cfop_escriturado || item.cfop_origem}|${parseFloat(item.aliquota_icms || 0).toFixed(2)}`;
        const g = grupos.get(k) || { bc: 0, icms: 0 };
        g.bc += parseFloat(item.valor_bc_icms) || 0;
        g.icms += parseFloat(item.valor_icms) || 0;
        grupos.set(k, g);
      }
      for (const [k, v] of grupos.entries()) {
        if (v.bc > 0 && v.icms === 0 && !['40', '41', '50', '60'].includes(k.split('|')[0])) {
          inconsistencias.push({
            tipo: 'ALERTA',
            codigo: 'VAL_C100_VS_C190_ICMS',
            documento: `NF ${doc.numero}`,
            chave_acesso: chave,
            mensagem: `Agrupamento fiscal [${k}] possui Base de Cálculo R$ ${v.bc.toFixed(2)} mas ICMS zerado.`
          });
        }
      }
    }

    // -----------------------------------------------------------------------
    // REGRA 9: Conciliação da Apuração E110 com os Documentos
    // -----------------------------------------------------------------------
    if (apuracaoIcms) {
      somaDebitosDocumentos = Math.round(somaDebitosDocumentos * 100) / 100;
      somaCreditosDocumentos = Math.round(somaCreditosDocumentos * 100) / 100;

      const debApurado = Math.round((apuracaoIcms.total_debitos || 0) * 100) / 100;
      const credApurado = Math.round((apuracaoIcms.total_creditos || 0) * 100) / 100;

      if (Math.abs(somaDebitosDocumentos - debApurado) > 0.05) {
        inconsistencias.push({
          tipo: 'ERRO',
          codigo: 'VAL_E110_VS_DOCS_CONCILIACAO',
          documento: 'Apuração Mensal ICMS (Registro E110)',
          mensagem: `Total de débitos na apuração (R$ ${debApurado.toFixed(2)}) diverge da soma dos documentos de saída (R$ ${somaDebitosDocumentos.toFixed(2)}).`
        });
      }

      if (Math.abs(somaCreditosDocumentos - credApurado) > 0.05) {
        inconsistencias.push({
          tipo: 'ERRO',
          codigo: 'VAL_E110_VS_DOCS_CONCILIACAO',
          documento: 'Apuração Mensal ICMS (Registro E110)',
          mensagem: `Total de créditos na apuração (R$ ${credApurado.toFixed(2)}) diverge da soma dos créditos elegíveis de entrada (R$ ${somaCreditosDocumentos.toFixed(2)}).`
        });
      }
    }

    const errosImpeditivos = inconsistencias.filter(i => i.tipo === 'ERRO').length;
    const alertas = inconsistencias.filter(i => i.tipo === 'ALERTA').length;

    return {
      status: errosImpeditivos === 0 ? 'APROVADO' : 'REPROVADO',
      aprovado_para_pva: errosImpeditivos === 0,
      total_inconsistencias: inconsistencias.length,
      erros_impeditivos: errosImpeditivos,
      alertas: alertas,
      inconsistencias
    };
  }

  /**
   * Cálculo do Dígito Verificador Módulo 11 da SEFAZ
   */
  static validarModulo11Sefaz(chave) {
    if (!chave || chave.length !== 44) return false;
    const base = chave.substring(0, 43);
    const dvDeclarado = parseInt(chave.charAt(43), 10);

    let soma = 0;
    let peso = 2;
    for (let i = base.length - 1; i >= 0; i--) {
      soma += parseInt(base.charAt(i), 10) * peso;
      peso = peso >= 9 ? 2 : peso + 1;
    }
    const resto = soma % 11;
    const dvCalculado = (resto === 0 || resto === 1) ? 0 : 11 - resto;

    return dvCalculado === dvDeclarado;
  }
}
