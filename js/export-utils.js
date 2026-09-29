/**
 * Portal do Contador - Módulo de Exportação e Relatórios
 * Permite exportação para Excel (CSV com BOM UTF-8), JSON e Impressão de Relatório
 */

const ExportUtils = (() => {

  // Exporta Itens da Nota Fiscal para CSV formatado para Excel em português
  function exportItemsToCSV(nfeData) {
    if (!nfeData || !nfeData.itens || nfeData.itens.length === 0) {
      alert('Não há itens na nota para exportar.');
      return;
    }

    const headers = [
      'Item',
      'Código',
      'Descrição do Produto',
      'NCM',
      'CFOP',
      'Unidade',
      'Quantidade',
      'Valor Unitário (R$)',
      'Valor Total (R$)',
      'Desconto (R$)',
      'CST/CSOSN ICMS',
      'Base ICMS (R$)',
      'Alíq ICMS (%)',
      'Valor ICMS (R$)',
      'Base ST (R$)',
      'Valor ICMS ST (R$)',
      'Valor PIS (R$)',
      'Valor COFINS (R$)',
      'Valor IPI (R$)'
    ];

    const rows = nfeData.itens.map(item => [
      item.nItem,
      `"${(item.cProd || '').replace(/"/g, '""')}"`,
      `"${(item.xProd || '').replace(/"/g, '""')}"`,
      `"${item.ncm || ''}"`,
      `"${item.cfop || ''}"`,
      `"${item.uCom || ''}"`,
      String(item.qCom || 0).replace('.', ','),
      String(item.vUnCom || 0).replace('.', ','),
      String(item.vProd || 0).replace('.', ','),
      String(item.vDesc || 0).replace('.', ','),
      `"${item.icms?.cst || item.icms?.csosn || ''}"`,
      String(item.icms?.vBC || 0).replace('.', ','),
      String(item.icms?.pICMS || 0).replace('.', ','),
      String(item.icms?.vICMS || 0).replace('.', ','),
      String(item.icms?.vBCST || 0).replace('.', ','),
      String(item.icms?.vICMSST || 0).replace('.', ','),
      String(item.pis?.vPIS || 0).replace('.', ','),
      String(item.cofins?.vCOFINS || 0).replace('.', ','),
      String(item.ipi?.vIPI || 0).replace('.', ',')
    ]);

    // Ponto-e-vírgula é o separador padrão de CSV para Excel em sistemas pt-BR
    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const nfNumber = nfeData.ide?.nNF || 'desconhecida';
    link.setAttribute('href', url);
    link.setAttribute('download', `itens_nfe_${nfNumber}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // Exporta dados completos estruturados para JSON
  function exportToJSON(nfeData) {
    if (!nfeData) return;
    const cleanData = { ...nfeData };
    delete cleanData.rawXML;
    delete cleanData.pdfExtractedText;

    const jsonStr = JSON.stringify(cleanData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const nfNumber = nfeData.ide?.nNF || 'dados';
    link.setAttribute('href', url);
    link.setAttribute('download', `interpretacao_nfe_${nfNumber}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // Copia texto para a área de transferência com retorno visual
  async function copyToClipboard(text, successCallback) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
      }
      if (typeof successCallback === 'function') {
        successCallback();
      }
    } catch (err) {
      console.error('Falha ao copiar:', err);
    }
  }

  // Aciona impressão amigável do relatório da nota
  function printReport() {
    window.print();
  }

  return {
    exportItemsToCSV,
    exportToJSON,
    copyToClipboard,
    printReport
  };
})();

// Export globally
window.ExportUtils = ExportUtils;
