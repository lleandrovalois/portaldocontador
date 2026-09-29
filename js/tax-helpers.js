/**
 * Portal do Contador - Módulo de Auxiliares Tributários e Formatação
 * Fornece dicionários de CFOP, CST, CSOSN, validação de Chave de Acesso e formatações financeiras.
 */

const TaxHelpers = (() => {
  // Dicionário dos CFOPs mais comuns e explicações contábeis
  const cfopDescriptions = {
    '1101': 'Compra para industrialização',
    '1102': 'Compra para comercialização',
    '1201': 'Devolução de venda de produção própria',
    '1202': 'Devolução de venda de mercadoria adquirida de terceiros',
    '1403': 'Compra para comercialização em operação com mercadoria sujeita a ST',
    '1556': 'Compra de material para uso ou consumo',
    '2101': 'Compra para industrialização (Interestadual)',
    '2102': 'Compra para comercialização (Interestadual)',
    '2202': 'Devolução de venda interestadual',
    '2403': 'Compra interestadual para comercialização com ST',
    '2556': 'Compra interestadual de material para uso ou consumo',
    '5101': 'Venda de produção do estabelecimento',
    '5102': 'Venda de mercadoria adquirida ou recebida de terceiros',
    '5103': 'Venda de produção efetuada fora do estabelecimento',
    '5104': 'Venda de mercadoria adquirida efetuada fora do estabelecimento',
    '5201': 'Devolução de compra para industrialização',
    '5202': 'Devolução de compra para comercialização',
    '5401': 'Venda de produção sujeita ao regime de substituição tributária (ST)',
    '5403': 'Venda de mercadoria adquirida de terceiros com ST (Substituto)',
    '5405': 'Venda de mercadoria com ST (Substituído)',
    '5551': 'Venda de bem do ativo imobilizado',
    '5910': 'Remessa em bonificação, doação ou brinde',
    '5915': 'Remessa para conserto ou reparo',
    '5927': 'Lançamento por perda, roubo ou deterioração',
    '5949': 'Outra saída de mercadoria ou prestação de serviço não especificada',
    '6101': 'Venda interestadual de produção do estabelecimento',
    '6102': 'Venda interestadual de mercadoria adquirida de terceiros',
    '6201': 'Devolução interestadual de compra para industrialização',
    '6202': 'Devolução interestadual de compra para comercialização',
    '6401': 'Venda interestadual de produção com ST',
    '6403': 'Venda interestadual de mercadoria de terceiros com ST (Substituto)',
    '6404': 'Venda interestadual com ICMS cobrado anteriormente por ST',
    '6910': 'Remessa interestadual em bonificação ou doação',
    '6949': 'Outra saída interestadual não especificada'
  };

  // Dicionário de CST do ICMS (Regime Normal)
  const cstIcmsDescriptions = {
    '00': 'Tributada integralmente',
    '10': 'Tributada com cobrança do ICMS por Substituição Tributária (ST)',
    '20': 'Com redução de base de cálculo',
    '30': 'Isenta ou não tributada com cobrança do ICMS por ST',
    '40': 'Isenta',
    '41': 'Não tributada',
    '50': 'Suspensão',
    '51': 'Diferimento',
    '60': 'ICMS cobrado anteriormente por Substituição Tributária',
    '70': 'Com redução de base de cálculo e cobrança do ICMS por ST',
    '90': 'Outras'
  };

  // Dicionário de CSOSN (Simples Nacional)
  const csosnDescriptions = {
    '101': 'Tributada pelo Simples Nacional com permissão de crédito',
    '102': 'Tributada pelo Simples Nacional sem permissão de crédito',
    '103': 'Isenção do ICMS no Simples Nacional para faixa de receita bruta',
    '201': 'Tributada pelo Simples com permissão de crédito e com cobrança do ICMS por ST',
    '202': 'Tributada pelo Simples sem permissão de crédito e com cobrança do ICMS por ST',
    '203': 'Isenção do ICMS no Simples para faixa de receita e cobrança de ICMS por ST',
    '300': 'Imune',
    '400': 'Não tributada pelo Simples Nacional',
    '500': 'ICMS cobrado anteriormente por ST ou antecipação',
    '900': 'Outros (Simples Nacional)'
  };

  // Dicionário de PIS / COFINS CST
  const cstPisCofinsDescriptions = {
    '01': 'Operação Tributável com Alíquota Básica',
    '02': 'Operação Tributável com Alíquota Diferenciada',
    '03': 'Operação Tributável com Alíquota por Unidade de Medida de Produto',
    '04': 'Operação Tributável Monofásica - Revenda a Alíquota Zero',
    '05': 'Operação Tributável por Substituição Tributária',
    '06': 'Operação Tributável a Alíquota Zero',
    '07': 'Operação Isenta da Contribuição',
    '08': 'Operação sem Incidência da Contribuição',
    '09': 'Operação com Suspensão da Contribuição',
    '49': 'Outras Operações de Saída',
    '50': 'Operação com Direito a Crédito - Vinculada Exclusivamente a Receita Tributada no Mercado Interno',
    '70': 'Operação de Aquisição sem Direito a Crédito',
    '99': 'Outras Operações'
  };

  // Modalidades de Frete
  const modFreteDescriptions = {
    '0': 'Contratação do Frete por conta do Remetente (CIF)',
    '1': 'Contratação do Frete por conta do Destinatário (FOB)',
    '2': 'Contratação do Frete por conta de Terceiros',
    '3': 'Transporte Próprio por conta do Remetente',
    '4': 'Transporte Próprio por conta do Destinatário',
    '9': 'Sem Ocorrência de Transporte'
  };

  // Formas de Pagamento
  const tPagDescriptions = {
    '01': 'Dinheiro',
    '02': 'Cheque',
    '03': 'Cartão de Crédito',
    '04': 'Cartão de Débito',
    '05': 'Crédito Loja',
    '10': 'Vale Alimentação',
    '11': 'Vale Refeição',
    '12': 'Vale Presente',
    '13': 'Vale Combustível',
    '14': 'Duplicata Mercantil',
    '15': 'Boleto Bancário',
    '16': 'Depósito Bancário',
    '17': 'Pagamento Instantâneo (PIX)',
    '18': 'Transferência bancária, Carteira Digital',
    '19': 'Programa de fidelidade, Cashback, Crédito Virtual',
    '90': 'Sem Pagamento',
    '99': 'Outros'
  };

  // Formata moeda BRL
  function formatCurrency(val) {
    if (val === null || val === undefined || isNaN(val)) return 'R$ 0,00';
    return Number(val).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  // Formata percentual
  function formatPercent(val) {
    if (val === null || val === undefined || isNaN(val)) return '0,00%';
    return Number(val).toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }) + '%';
  }

  // Formata quantidade
  function formatQuantity(val) {
    if (val === null || val === undefined || isNaN(val)) return '0';
    const num = Number(val);
    return Number.isInteger(num)
      ? num.toLocaleString('pt-BR')
      : num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 4 });
  }

  // Formata CNPJ ou CPF
  function formatDocument(doc) {
    if (!doc) return '-';
    const clean = doc.replace(/\D/g, '');
    if (clean.length === 14) {
      return clean.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
    }
    if (clean.length === 11) {
      return clean.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
    }
    return doc;
  }

  // Formata CEP
  function formatCEP(cep) {
    if (!cep) return '';
    const clean = cep.replace(/\D/g, '');
    if (clean.length === 8) {
      return clean.replace(/^(\d{5})(\d{3})$/, '$1-$2');
    }
    return cep;
  }

  // Formata Chave de Acesso (44 dígitos agrupados de 4 em 4)
  function formatChave(chave) {
    if (!chave) return '-';
    const clean = chave.replace(/\D/g, '');
    if (clean.length === 44) {
      return clean.match(/.{1,4}/g).join(' ');
    }
    return chave;
  }

  // Validador de DV da Chave de Acesso da NF-e (Módulo 11)
  function validateChaveAcesso(chave) {
    if (!chave) return { valid: false, message: 'Chave não informada' };
    const clean = chave.replace(/\D/g, '');
    if (clean.length !== 44) {
      return { valid: false, message: `Chave com tamanho incorreto (${clean.length} dígitos, esperado 44)` };
    }

    const base = clean.substring(0, 43);
    const dvInformado = parseInt(clean.charAt(43), 10);

    let soma = 0;
    let peso = 2;
    for (let i = base.length - 1; i >= 0; i--) {
      soma += parseInt(base.charAt(i), 10) * peso;
      peso = peso === 9 ? 2 : peso + 1;
    }

    const resto = soma % 11;
    const dvCalculado = (resto === 0 || resto === 1) ? 0 : 11 - resto;

    if (dvCalculado === dvInformado) {
      return {
        valid: true,
        message: 'Dígito verificador válido (Módulo 11 SEFAZ)',
        uf: clean.substring(0, 2),
        aamm: clean.substring(2, 6),
        cnpj: clean.substring(6, 20),
        mod: clean.substring(20, 22),
        serie: clean.substring(22, 25),
        nNF: clean.substring(25, 34),
        tpEmis: clean.substring(34, 35),
        cNF: clean.substring(35, 43),
        cDV: dvInformado
      };
    } else {
      return {
        valid: false,
        message: `Dígito verificador inválido: calculado ${dvCalculado}, mas informado na chave ${dvInformado}`
      };
    }
  }

  // Formata Data/Hora ISO para padrão brasileiro
  function formatDate(isoStr) {
    if (!isoStr) return '-';
    try {
      const date = new Date(isoStr);
      if (isNaN(date.getTime())) return isoStr;
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return isoStr;
    }
  }

  // Realiza checagem contábil de consistência da Nota Fiscal
  function runConsistencyAudit(nfeData) {
    const alerts = [];
    const totals = nfeData.totais || {};
    const items = nfeData.itens || [];

    // 1. Checagem de Chave de Acesso
    if (nfeData.chaveAcesso) {
      const chaveCheck = validateChaveAcesso(nfeData.chaveAcesso);
      if (chaveCheck.valid) {
        alerts.push({
          type: 'success',
          title: 'Chave de Acesso Válida',
          desc: 'O dígito verificador da chave confere perfeitamente com a regra Módulo 11 da SEFAZ.'
        });
      } else {
        alerts.push({
          type: 'warning',
          title: 'Atenção na Chave de Acesso',
          desc: chaveCheck.message
        });
      }
    }

    // 2. Checagem de Soma dos Produtos vs vProd
    if (items.length > 0 && totals.vProd !== undefined) {
      const somaItens = items.reduce((acc, it) => acc + (it.vProd || 0), 0);
      const diff = Math.abs(somaItens - totals.vProd);
      if (diff > 0.05) {
        alerts.push({
          type: 'warning',
          title: 'Divergência na Soma dos Produtos',
          desc: `A soma dos itens (${formatCurrency(somaItens)}) difere do total de produtos declarado (${formatCurrency(totals.vProd)}). Diferença: ${formatCurrency(diff)}.`
        });
      } else {
        alerts.push({
          type: 'success',
          title: 'Soma dos Produtos Consistente',
          desc: `A somatória dos ${items.length} itens bate perfeitamente com o total de mercadorias declarado.`
        });
      }
    }

    // 3. Checagem da Equação do Valor Total da NF
    // vNF = vProd - vDesc - vICMSDeson + vST + vFrete + vSeg + vOutro + vII + vIPI + vIPIDevol
    if (totals.vNF !== undefined) {
      const calculado = (totals.vProd || 0)
        - (totals.vDesc || 0)
        + (totals.vST || 0)
        + (totals.vFrete || 0)
        + (totals.vSeg || 0)
        + (totals.vOutro || 0)
        + (totals.vIPI || 0);

      const diffTotal = Math.abs(calculado - totals.vNF);
      if (diffTotal < 0.10) {
        alerts.push({
          type: 'success',
          title: 'Equação de Fechamento da NF Correta',
          desc: `A fórmula [Produtos - Descontos + Tributos/Acessórios = Total da NF] foi verificada com sucesso.`
        });
      } else {
        alerts.push({
          type: 'info',
          title: 'Fechamento da NF com Variação',
          desc: `Valor total calculado pela fórmula: ${formatCurrency(calculado)} vs Declarado: ${formatCurrency(totals.vNF)} (pode haver retenções, desonerações ou devoluções).`
        });
      }
    }

    // 4. Checagem de Operação Interestadual vs CFOP
    const emitUF = nfeData.emitente?.uf;
    const destUF = nfeData.destinatario?.uf;
    if (emitUF && destUF && items.length > 0) {
      const isInterestadual = emitUF.toUpperCase() !== destUF.toUpperCase();
      const firstCfop = String(items[0].cfop || '');
      const cfopIniciaCom = firstCfop.charAt(0);

      if (isInterestadual && (cfopIniciaCom === '5' || cfopIniciaCom === '1')) {
        alerts.push({
          type: 'warning',
          title: 'Possível Inconsistência de CFOP Estadual',
          desc: `Remetente (${emitUF}) e Destinatário (${destUF}) são de estados diferentes, porém o item usa CFOP ${firstCfop} (típico de operação interna estadual).`
        });
      } else if (!isInterestadual && (cfopIniciaCom === '6' || cfopIniciaCom === '2')) {
        alerts.push({
          type: 'warning',
          title: 'Possível Inconsistência de CFOP Interestadual',
          desc: `Remetente e Destinatário são ambos de ${emitUF}, porém o item usa CFOP ${firstCfop} (iniciado em 6/2, típico de interestadual).`
        });
      } else {
        alerts.push({
          type: 'success',
          title: `Operação ${isInterestadual ? 'Interestadual' : 'Interna'} Identificada`,
          desc: `Origem: ${emitUF} ➔ Destino: ${destUF}. CFOPs compatíveis com a rota fiscal.`
        });
      }
    }

    return alerts;
  }

  return {
    cfopDescriptions,
    cstIcmsDescriptions,
    csosnDescriptions,
    cstPisCofinsDescriptions,
    modFreteDescriptions,
    tPagDescriptions,
    formatCurrency,
    formatPercent,
    formatQuantity,
    formatDocument,
    formatCEP,
    formatChave,
    formatDate,
    validateChaveAcesso,
    runConsistencyAudit
  };
})();

// Export globally
window.TaxHelpers = TaxHelpers;
