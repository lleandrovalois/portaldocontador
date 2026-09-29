/**
 * Portal do Contador - Interpretador Oficial de DANFE em PDF
 * Utiliza PDF.js para extração de texto e analisador léxico/heurístico
 * para identificar campos de notas fiscais padrão DANFE SEFAZ.
 */

const DanfePDFParser = (() => {

  // Configura worker do PDF.js
  if (window.pdfjsLib) {
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = './vendor/pdf.worker.min.js';
  }

  // Helper para converter string monetária pt-BR (ex: "1.250,50") em float
  function parseBrazilianNumber(str) {
    if (!str) return 0.0;
    const clean = str.replace(/[^\d,.-]/g, '').trim();
    if (!clean) return 0.0;
    // Se tiver vírgula como separador decimal
    if (clean.includes(',')) {
      const standard = clean.replace(/\./g, '').replace(',', '.');
      const val = parseFloat(standard);
      return isNaN(val) ? 0.0 : val;
    }
    const val = parseFloat(clean);
    return isNaN(val) ? 0.0 : val;
  }

  // Extrai todo o texto do documento PDF
  async function extractTextFromPDF(pdfDataBuffer) {
    if (!window.pdfjsLib) {
      throw new Error('A biblioteca PDF.js não foi carregada corretamente.');
    }

    const loadingTask = window.pdfjsLib.getDocument({ data: pdfDataBuffer });
    const pdfDoc = await loadingTask.promise;
    let fullText = '';
    const pages = [];

    for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
      const page = await pdfDoc.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageLines = [];
      let lastY = null;
      let currentLine = '';

      for (const item of textContent.items) {
        if (lastY === null || Math.abs(item.transform[5] - lastY) > 5) {
          if (currentLine) pageLines.push(currentLine.trim());
          currentLine = item.str;
          lastY = item.transform[5];
        } else {
          currentLine += (currentLine.endsWith(' ') || item.str.startsWith(' ') ? '' : ' ') + item.str;
        }
      }
      if (currentLine) pageLines.push(currentLine.trim());

      const pageText = pageLines.join('\n');
      pages.push(pageText);
      fullText += '\n' + pageText;
    }

    return { fullText, pages, numPages: pdfDoc.numPages };
  }

  // Parser principal de texto do DANFE
  async function parsePDF(pdfDataBuffer, fileName = 'Documento.pdf') {
    const { fullText, pages, numPages } = await extractTextFromPDF(pdfDataBuffer);

    // 1. Extração da Chave de Acesso (44 dígitos)
    let chaveAcesso = '';
    const chaveMatch = fullText.match(/\b(\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4})\b/);
    if (chaveMatch) {
      chaveAcesso = chaveMatch[1].replace(/\D/g, '');
    }

    // 2. Número da Nota e Série
    let nNF = '';
    let serie = '1';
    const numMatch = fullText.match(/(?:N[º°o]|Número|NÚMERO)\s*[:.]?\s*(\d{1,3}(?:\.\d{3})*|\d+)/i);
    if (numMatch) {
      nNF = numMatch[1].replace(/\./g, '');
    }
    const serieMatch = fullText.match(/(?:SÉRIE|SERIE|Série)\s*[:.]?\s*(\d+)/i);
    if (serieMatch) {
      serie = serieMatch[1];
    }

    // 3. Natureza da Operação
    let natOp = 'Venda de mercadorias ou serviços';
    const natMatch = fullText.match(/NATUREZA DA OPERA[ÇC][ÃA]O\s*[:\n]?\s*([^\n\r]+)/i);
    if (natMatch && natMatch[1].trim()) {
      natOp = natMatch[1].trim().replace(/^[:\-\s]+/, '');
    }

    // 4. Protocolo de Autorização
    let nProt = '';
    let dhRecbto = '';
    const protMatch = fullText.match(/PROTOCOLO DE AUTORIZA[ÇC][ÃA]O(?: DE USO)?\s*[:\n]?\s*([\d\s\/\-:]+)/i);
    if (protMatch) {
      nProt = protMatch[1].trim();
    }

    // 5. CNPJs / CPFs no documento
    const cnpjs = fullText.match(/\b\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}\b/g) || [];
    const cpfs = fullText.match(/\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/g) || [];

    const emitenteCNPJ = cnpjs[0] || '';
    const destinatarioCNPJ = cnpjs[1] || cpfs[0] || '';

    // 6. Datas
    const datas = fullText.match(/\b\d{2}\/\d{2}\/\d{4}\b/g) || [];
    const dataEmissao = datas[0] || new Date().toISOString();

    // 7. Extração de Totais e Tributos
    function extractMoneyPattern(pattern) {
      const match = fullText.match(pattern);
      if (match && match[1]) {
        return parseBrazilianNumber(match[1]);
      }
      return 0.0;
    }

    const vNF = extractMoneyPattern(/VALOR TOTAL DA NOTA\s*(?:R\$\s*)?([\d.,]+)/i)
      || extractMoneyPattern(/TOTAL DA NOTA\s*(?:R\$\s*)?([\d.,]+)/i);

    const vProd = extractMoneyPattern(/VALOR TOTAL DOS PRODUTOS\s*(?:R\$\s*)?([\d.,]+)/i)
      || extractMoneyPattern(/TOTAL DOS PRODUTOS\s*(?:R\$\s*)?([\d.,]+)/i)
      || vNF;

    const vBC = extractMoneyPattern(/BASE DE C[ÁA]LCULO DO ICMS\s*(?:R\$\s*)?([\d.,]+)/i);
    const vICMS = extractMoneyPattern(/VALOR DO ICMS\s*(?:R\$\s*)?([\d.,]+)/i);
    const vBCST = extractMoneyPattern(/BASE DE C[ÁA]LCULO DO ICMS ST\s*(?:R\$\s*)?([\d.,]+)/i);
    const vST = extractMoneyPattern(/VALOR DO ICMS ST\s*(?:R\$\s*)?([\d.,]+)/i);
    const vFrete = extractMoneyPattern(/VALOR DO FRETE\s*(?:R\$\s*)?([\d.,]+)/i);
    const vSeg = extractMoneyPattern(/VALOR DO SEGURO\s*(?:R\$\s*)?([\d.,]+)/i);
    const vDesc = extractMoneyPattern(/DESCONTO\s*(?:R\$\s*)?([\d.,]+)/i);
    const vIPI = extractMoneyPattern(/VALOR DO IPI\s*(?:R\$\s*)?([\d.,]+)/i);
    const vPIS = extractMoneyPattern(/VALOR DO PIS\s*(?:R\$\s*)?([\d.,]+)/i);
    const vCOFINS = extractMoneyPattern(/VALOR DA COFINS\s*(?:R\$\s*)?([\d.,]+)/i);

    // 8. Nomes e Razões Sociais
    // Heurística de localização dos blocos emitente e destinatário
    let emitenteNome = 'Emitente Identificado no DANFE';
    let destinatarioNome = 'Destinatário Identificado no DANFE';

    const emitMatch = fullText.match(/EMITENTE\s*[:\n]?\s*([^\n\r]+)/i);
    if (emitMatch && emitMatch[1].trim()) emitenteNome = emitMatch[1].trim();

    const destMatch = fullText.match(/DESTINAT[ÁA]RIO\s*\/?\s*REMETENTE[\s\S]*?NOME\s*\/?\s*RAZ[ÃA]O SOCIAL\s*[:\n]?\s*([^\n\r]+)/i);
    if (destMatch && destMatch[1].trim()) destinatarioNome = destMatch[1].trim();

    // 9. Extração de Linhas de Produtos/Itens
    const itens = [];
    const lines = fullText.split('\n');
    let itemCounter = 1;

    // Procura linhas que contenham estrutura de item (Código/Descrição, NCM 8 dígitos, CST, CFOP 4 dígitos, etc.)
    for (const line of lines) {
      // Exemplo de padrão: "PROD001 PARAFUSO SEXTAVADO 73181500 0102 5102 UN 10,00 2,50 25,00"
      const itemPattern = /^(.*?)\s+(\d{8})\s+(\d{3,4})\s+(\d{4})\s+([A-Za-z]{2,3})\s+([\d.,]+)\s+([\d.,]+)\s+([\d.,]+)/;
      const match = line.match(itemPattern);
      if (match) {
        const descCompleta = match[1].trim();
        const ncm = match[2];
        const cstCsosn = match[3];
        const cfop = match[4];
        const uCom = match[5];
        const qCom = parseBrazilianNumber(match[6]);
        const vUnCom = parseBrazilianNumber(match[7]);
        const vProdItem = parseBrazilianNumber(match[8]);

        itens.push({
          nItem: itemCounter++,
          cProd: `ITEM-${itemCounter - 1}`,
          xProd: descCompleta || `Item de Mercadoria #${itemCounter - 1}`,
          ncm: ncm,
          cfop: cfop,
          uCom: uCom,
          qCom: qCom,
          vUnCom: vUnCom,
          vProd: vProdItem,
          vDesc: 0,
          icms: {
            cst: cstCsosn,
            csosn: cstCsosn,
            vBC: 0,
            pICMS: 0,
            vICMS: 0
          },
          pis: { vPIS: 0 },
          cofins: { vCOFINS: 0 },
          ipi: { vIPI: 0 }
        });
      }
    }

    // Se nenhum item foi extraído por regex estrita (layout de PDF customizado), cria item sintético com o total
    if (itens.length === 0) {
      itens.push({
        nItem: 1,
        cProd: 'LOTE-UNICO',
        xProd: 'Mercadorias / Serviços discriminados no DANFE anexado',
        ncm: '00000000',
        cfop: '5102',
        uCom: 'UN',
        qCom: 1,
        vUnCom: vProd || vNF,
        vProd: vProd || vNF,
        vDesc: vDesc,
        icms: {
          cst: '00',
          vBC: vBC,
          pICMS: vBC > 0 ? ((vICMS / vBC) * 100) : 0,
          vICMS: vICMS
        },
        pis: { vPIS: vPIS },
        cofins: { vCOFINS: vCOFINS },
        ipi: { vIPI: vIPI }
      });
    }

    return {
      tipoDocumento: 'NF-e (DANFE PDF)',
      formatoOrigem: 'PDF',
      origemNomeArquivo: fileName,
      chaveAcesso: chaveAcesso,
      ide: {
        mod: '55',
        serie: serie,
        nNF: nNF || '1',
        dhEmi: dataEmissao,
        natOp: natOp,
        tpNF: '1',
        cNF: nNF
      },
      protocolo: nProt ? {
        nProt: nProt,
        dhRecbto: dataEmissao,
        cStat: '100',
        xMotivo: 'Autorizado o uso da NF-e'
      } : null,
      emitente: {
        cnpjCpf: emitenteCNPJ,
        razaoSocial: emitenteNome,
        nomeFantasia: emitenteNome,
        crtDesc: 'Extraído do DANFE'
      },
      destinatario: destinatarioCNPJ ? {
        cnpjCpf: destinatarioCNPJ,
        razaoSocial: destinatarioNome
      } : null,
      itens: itens,
      totais: {
        vBC: vBC,
        vICMS: vICMS,
        vBCST: vBCST,
        vST: vST,
        vProd: vProd,
        vFrete: vFrete,
        vSeg: vSeg,
        vDesc: vDesc,
        vIPI: vIPI,
        vPIS: vPIS,
        vCOFINS: vCOFINS,
        vNF: vNF || (vProd - vDesc + vFrete + vST + vIPI)
      },
      transporte: {
        modFrete: '0'
      },
      cobranca: {
        duplicatas: []
      },
      pagamentos: [{
        tPag: '15',
        vPag: vNF
      }],
      infoAdicional: {
        infCpl: `Extração automatizada de DANFE em PDF (${numPages} página(s)). Verifique a conferência com o XML original se necessário.`
      },
      pdfExtractedText: fullText
    };
  }

  return {
    parsePDF,
    extractTextFromPDF
  };
})();

// Export globally
window.DanfePDFParser = DanfePDFParser;
