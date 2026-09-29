/**
 * Portal do Contador - Interpretador Oficial de XML NF-e / NFC-e / NFS-e
 * Extração de dados da árvore XML para objeto padronizado amigável.
 */

const NFeXMLParser = (() => {

  // Helper para buscar elementos independentemente de namespaces
  function findNode(parent, tag) {
    if (!parent) return null;
    // Tenta busca direta por tagName
    const direct = parent.getElementsByTagName(tag);
    if (direct && direct.length > 0) return direct[0];

    // Tenta pelo localName
    for (let i = 0; i < parent.children.length; i++) {
      const child = parent.children[i];
      if (child.localName === tag || child.nodeName.endsWith(':' + tag)) {
        return child;
      }
      const recursive = findNode(child, tag);
      if (recursive) return recursive;
    }
    return null;
  }

  function findNodes(parent, tag) {
    if (!parent) return [];
    const results = [];
    const direct = parent.getElementsByTagName(tag);
    if (direct && direct.length > 0) {
      return Array.from(direct);
    }
    // Varredura recursiva por localName
    function traverse(node) {
      for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i];
        if (child.localName === tag || child.nodeName.endsWith(':' + tag)) {
          results.push(child);
        } else {
          traverse(child);
        }
      }
    }
    traverse(parent);
    return results;
  }

  function getText(parent, tag, defaultVal = '') {
    const node = findNode(parent, tag);
    if (!node || node.textContent === null || node.textContent === undefined) return defaultVal;
    return node.textContent.trim();
  }

  function getFloat(parent, tag, defaultVal = 0.0) {
    const txt = getText(parent, tag);
    if (!txt) return defaultVal;
    const num = parseFloat(txt);
    return isNaN(num) ? defaultVal : num;
  }

  function getInt(parent, tag, defaultVal = 0) {
    const txt = getText(parent, tag);
    if (!txt) return defaultVal;
    const num = parseInt(txt, 10);
    return isNaN(num) ? defaultVal : num;
  }

  // Parse principal
  function parseXML(xmlString) {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlString, 'application/xml');

      // Verifica se houve erro de parsing sintático
      const parseError = xmlDoc.getElementsByTagName('parsererror');
      if (parseError && parseError.length > 0) {
        throw new Error('O arquivo XML fornecido possui erros de formatação ou sintaxe inválida.');
      }

      // Procura por nós principais da NF-e
      let infNFe = findNode(xmlDoc, 'infNFe');
      
      // Se não encontrou infNFe, pode ser NFS-e (Nota de Serviço)
      if (!infNFe) {
        const infNfse = findNode(xmlDoc, 'InfNfse') || findNode(xmlDoc, 'infNFSe');
        if (infNfse) {
          return parseNFSe(xmlDoc, infNfse);
        }
        throw new Error('Nenhuma estrutura válida de NF-e, NFC-e ou NFS-e foi localizada neste arquivo XML.');
      }

      // Extração de Chave de Acesso
      let chaveAcesso = '';
      const idAttr = infNFe.getAttribute('Id');
      if (idAttr) {
        chaveAcesso = idAttr.replace(/^NFe/i, '').replace(/\D/g, '');
      }
      if (!chaveAcesso || chaveAcesso.length !== 44) {
        // Tenta achar em protNFe/infProt/chNFe
        const chNFeNode = findNode(xmlDoc, 'chNFe');
        if (chNFeNode && chNFeNode.textContent) {
          chaveAcesso = chNFeNode.textContent.trim().replace(/\D/g, '');
        }
      }

      // Dados de Identificação (ide)
      const ideNode = findNode(infNFe, 'ide') || infNFe;
      const ide = {
        cUF: getText(ideNode, 'cUF'),
        cNF: getText(ideNode, 'cNF'),
        natOp: getText(ideNode, 'natOp'),
        mod: getText(ideNode, 'mod', '55'),
        serie: getText(ideNode, 'serie'),
        nNF: getText(ideNode, 'nNF'),
        dhEmi: getText(ideNode, 'dhEmi') || getText(ideNode, 'dEmi'),
        dhSaiEnt: getText(ideNode, 'dhSaiEnt') || getText(ideNode, 'dSaiEnt'),
        tpNF: getText(ideNode, 'tpNF', '1'), // 0 = Entrada, 1 = Saída
        idDest: getText(ideNode, 'idDest', '1'), // 1 = Interna, 2 = Interestadual, 3 = Exterior
        tpAmb: getText(ideNode, 'tpAmb', '1'), // 1 = Produção, 2 = Homologação
        finNFe: getText(ideNode, 'finNFe', '1'), // 1 = Normal, 2 = Complementar, etc.
        indFinal: getText(ideNode, 'indFinal', '0'), // 1 = Consumidor Final
        indPres: getText(ideNode, 'indPres', '0'),
        procEmi: getText(ideNode, 'procEmi', '0')
      };

      // Protocolo de Autorização (protNFe)
      const protNode = findNode(xmlDoc, 'infProt');
      const protocolo = protNode ? {
        tpAmb: getText(protNode, 'tpAmb'),
        verAplic: getText(protNode, 'verAplic'),
        chNFe: getText(protNode, 'chNFe'),
        dhRecbto: getText(protNode, 'dhRecbto'),
        nProt: getText(protNode, 'nProt'),
        digVal: getText(protNode, 'digVal'),
        cStat: getText(protNode, 'cStat'),
        xMotivo: getText(protNode, 'xMotivo')
      } : null;

      // Dados do Emitente (emit)
      const emitNode = findNode(infNFe, 'emit');
      const enderEmitNode = findNode(emitNode, 'enderEmit');
      const crtCode = getText(emitNode, 'CRT');
      let crtDesc = 'Não informado';
      if (crtCode === '1') crtDesc = 'Simples Nacional';
      else if (crtCode === '2') crtDesc = 'Simples Nacional - Excesso de sublimite';
      else if (crtCode === '3') crtDesc = 'Regime Normal (Lucro Presumido / Real)';

      const emitente = {
        cnpjCpf: getText(emitNode, 'CNPJ') || getText(emitNode, 'CPF'),
        razaoSocial: getText(emitNode, 'xNome'),
        nomeFantasia: getText(emitNode, 'xFant'),
        ie: getText(emitNode, 'IE'),
        crt: crtCode,
        crtDesc: crtDesc,
        logradouro: getText(enderEmitNode, 'xLgr'),
        numero: getText(enderEmitNode, 'nro'),
        complemento: getText(enderEmitNode, 'xCpl'),
        bairro: getText(enderEmitNode, 'xBairro'),
        municipio: getText(enderEmitNode, 'xMun'),
        cMun: getText(enderEmitNode, 'cMun'),
        uf: getText(enderEmitNode, 'UF'),
        cep: getText(enderEmitNode, 'CEP'),
        telefone: getText(enderEmitNode, 'fone')
      };

      // Dados do Destinatário (dest)
      const destNode = findNode(infNFe, 'dest');
      const enderDestNode = findNode(destNode, 'enderDest');
      const destinatario = destNode ? {
        cnpjCpf: getText(destNode, 'CNPJ') || getText(destNode, 'CPF') || getText(destNode, 'idEstrangeiro'),
        razaoSocial: getText(destNode, 'xNome'),
        ie: getText(destNode, 'IE'),
        indIEDest: getText(destNode, 'indIEDest'),
        email: getText(destNode, 'email'),
        logradouro: getText(enderDestNode, 'xLgr'),
        numero: getText(enderDestNode, 'nro'),
        complemento: getText(enderDestNode, 'xCpl'),
        bairro: getText(enderDestNode, 'xBairro'),
        municipio: getText(enderDestNode, 'xMun'),
        cMun: getText(enderDestNode, 'cMun'),
        uf: getText(enderDestNode, 'UF'),
        cep: getText(enderDestNode, 'CEP'),
        telefone: getText(enderDestNode, 'fone')
      } : null;

      // Itens / Produtos (det)
      const detNodes = findNodes(infNFe, 'det');
      const itens = detNodes.map((det, index) => {
        const prod = findNode(det, 'prod') || det;
        const imposto = findNode(det, 'imposto');

        // Tratamento do ICMS (pode estar em ICMS00, ICMS10, ICMSSN101, etc.)
        let icmsDados = {
          cst: '',
          csosn: '',
          orig: '',
          vBC: 0.0,
          pICMS: 0.0,
          vICMS: 0.0,
          vBCST: 0.0,
          pICMSST: 0.0,
          vICMSST: 0.0,
          pRedBC: 0.0,
          pCredSN: 0.0,
          vCredICMSSN: 0.0
        };

        const icmsContainer = findNode(imposto, 'ICMS');
        if (icmsContainer && icmsContainer.children.length > 0) {
          const icmsChild = icmsContainer.children[0];
          icmsDados.orig = getText(icmsChild, 'orig');
          icmsDados.cst = getText(icmsChild, 'CST');
          icmsDados.csosn = getText(icmsChild, 'CSOSN');
          icmsDados.vBC = getFloat(icmsChild, 'vBC');
          icmsDados.pICMS = getFloat(icmsChild, 'pICMS');
          icmsDados.vICMS = getFloat(icmsChild, 'vICMS');
          icmsDados.vBCST = getFloat(icmsChild, 'vBCST');
          icmsDados.pICMSST = getFloat(icmsChild, 'pICMSST');
          icmsDados.vICMSST = getFloat(icmsChild, 'vICMSST');
          icmsDados.pRedBC = getFloat(icmsChild, 'pRedBC');
          icmsDados.pCredSN = getFloat(icmsChild, 'pCredSN');
          icmsDados.vCredICMSSN = getFloat(icmsChild, 'vCredICMSSN');
        }

        // PIS
        let pisDados = { cst: '', vBC: 0.0, pPIS: 0.0, vPIS: 0.0 };
        const pisContainer = findNode(imposto, 'PIS');
        if (pisContainer && pisContainer.children.length > 0) {
          const pisChild = pisContainer.children[0];
          pisDados.cst = getText(pisChild, 'CST');
          pisDados.vBC = getFloat(pisChild, 'vBC');
          pisDados.pPIS = getFloat(pisChild, 'pPIS');
          pisDados.vPIS = getFloat(pisChild, 'vPIS');
        }

        // COFINS
        let cofinsDados = { cst: '', vBC: 0.0, pCOFINS: 0.0, vCOFINS: 0.0 };
        const cofinsContainer = findNode(imposto, 'COFINS');
        if (cofinsContainer && cofinsContainer.children.length > 0) {
          const cofinsChild = cofinsContainer.children[0];
          cofinsDados.cst = getText(cofinsChild, 'CST');
          cofinsDados.vBC = getFloat(cofinsChild, 'vBC');
          cofinsDados.pCOFINS = getFloat(cofinsChild, 'pCOFINS');
          cofinsDados.vCOFINS = getFloat(cofinsChild, 'vCOFINS');
        }

        // IPI
        let ipiDados = { cst: '', vBC: 0.0, pIPI: 0.0, vIPI: 0.0, cEnq: '' };
        const ipiContainer = findNode(imposto, 'IPI');
        if (ipiContainer) {
          ipiDados.cEnq = getText(ipiContainer, 'cEnq');
          const ipiTrib = findNode(ipiContainer, 'IPITrib');
          if (ipiTrib) {
            ipiDados.cst = getText(ipiTrib, 'CST');
            ipiDados.vBC = getFloat(ipiTrib, 'vBC');
            ipiDados.pIPI = getFloat(ipiTrib, 'pIPI');
            ipiDados.vIPI = getFloat(ipiTrib, 'vIPI');
          } else {
            const ipiNT = findNode(ipiContainer, 'IPINT');
            if (ipiNT) ipiDados.cst = getText(ipiNT, 'CST');
          }
        }

        return {
          nItem: parseInt(det.getAttribute('nItem') || (index + 1), 10),
          cProd: getText(prod, 'cProd'),
          cEAN: getText(prod, 'cEAN'),
          xProd: getText(prod, 'xProd'),
          ncm: getText(prod, 'NCM'),
          cest: getText(prod, 'CEST'),
          cfop: getText(prod, 'CFOP'),
          uCom: getText(prod, 'uCom'),
          qCom: getFloat(prod, 'qCom'),
          vUnCom: getFloat(prod, 'vUnCom'),
          vProd: getFloat(prod, 'vProd'),
          vDesc: getFloat(prod, 'vDesc'),
          vFrete: getFloat(prod, 'vFrete'),
          vSeg: getFloat(prod, 'vSeg'),
          vOutro: getFloat(prod, 'vOutro'),
          vTotTrib: getFloat(imposto, 'vTotTrib'),
          infAdProd: getText(prod, 'infAdProd'),
          icms: icmsDados,
          pis: pisDados,
          cofins: cofinsDados,
          ipi: ipiDados
        };
      });

      // Totais da Nota Fiscal (total/ICMSTot)
      const icmsTot = findNode(infNFe, 'ICMSTot') || findNode(infNFe, 'total');
      const totais = {
        vBC: getFloat(icmsTot, 'vBC'),
        vICMS: getFloat(icmsTot, 'vICMS'),
        vICMSDeson: getFloat(icmsTot, 'vICMSDeson'),
        vFCPUFDest: getFloat(icmsTot, 'vFCPUFDest'),
        vICMSUFDest: getFloat(icmsTot, 'vICMSUFDest'),
        vICMSUFRemet: getFloat(icmsTot, 'vICMSUFRemet'),
        vFCP: getFloat(icmsTot, 'vFCP'),
        vBCST: getFloat(icmsTot, 'vBCST'),
        vST: getFloat(icmsTot, 'vST'),
        vFCPST: getFloat(icmsTot, 'vFCPST'),
        vFCPSTRet: getFloat(icmsTot, 'vFCPSTRet'),
        vProd: getFloat(icmsTot, 'vProd'),
        vFrete: getFloat(icmsTot, 'vFrete'),
        vSeg: getFloat(icmsTot, 'vSeg'),
        vDesc: getFloat(icmsTot, 'vDesc'),
        vII: getFloat(icmsTot, 'vII'),
        vIPI: getFloat(icmsTot, 'vIPI'),
        vIPIDevol: getFloat(icmsTot, 'vIPIDevol'),
        vPIS: getFloat(icmsTot, 'vPIS'),
        vCOFINS: getFloat(icmsTot, 'vCOFINS'),
        vOutro: getFloat(icmsTot, 'vOutro'),
        vNF: getFloat(icmsTot, 'vNF'),
        vTotTrib: getFloat(icmsTot, 'vTotTrib')
      };

      // Transporte (transp)
      const transpNode = findNode(infNFe, 'transp');
      const transportaNode = findNode(transpNode, 'transporta');
      const veicNode = findNode(transpNode, 'veicTransp');
      const volNode = findNode(transpNode, 'vol');
      const transporte = {
        modFrete: getText(transpNode, 'modFrete', '9'),
        transportadora: transportaNode ? {
          cnpjCpf: getText(transportaNode, 'CNPJ') || getText(transportaNode, 'CPF'),
          xNome: getText(transportaNode, 'xNome'),
          ie: getText(transportaNode, 'IE'),
          xEnder: getText(transportaNode, 'xEnder'),
          xMun: getText(transportaNode, 'xMun'),
          uf: getText(transportaNode, 'UF')
        } : null,
        veiculo: veicNode ? {
          placa: getText(veicNode, 'placa'),
          uf: getText(veicNode, 'UF'),
          rntc: getText(veicNode, 'RNTC')
        } : null,
        volume: volNode ? {
          qVol: getFloat(volNode, 'qVol'),
          esp: getText(volNode, 'esp'),
          marca: getText(volNode, 'marca'),
          pesoL: getFloat(volNode, 'pesoL'),
          pesoB: getFloat(volNode, 'pesoB')
        } : null
      };

      // Cobrança e Duplicatas (cobr)
      const cobrNode = findNode(infNFe, 'cobr');
      const fatNode = findNode(cobrNode, 'fat');
      const dupNodes = findNodes(cobrNode, 'dup');
      const cobranca = {
        fatura: fatNode ? {
          nFat: getText(fatNode, 'nFat'),
          vOrig: getFloat(fatNode, 'vOrig'),
          vDesc: getFloat(fatNode, 'vDesc'),
          vLiq: getFloat(fatNode, 'vLiq')
        } : null,
        duplicatas: dupNodes.map(dup => ({
          nDup: getText(dup, 'nDup'),
          dVenc: getText(dup, 'dVenc'),
          vDup: getFloat(dup, 'vDup')
        }))
      };

      // Pagamento (pag)
      const pagNodes = findNodes(infNFe, 'detPag');
      const pagamentos = pagNodes.map(p => ({
        tPag: getText(p, 'tPag'),
        vPag: getFloat(p, 'vPag'),
        indPag: getText(p, 'indPag') // 0 = À vista, 1 = A prazo
      }));

      // Informações Adicionais (infAdic)
      const infAdicNode = findNode(infNFe, 'infAdic');
      const infoAdicional = {
        infAdFisco: getText(infAdicNode, 'infAdFisco'),
        infCpl: getText(infAdicNode, 'infCpl')
      };

      return {
        tipoDocumento: ide.mod === '65' ? 'NFC-e' : 'NF-e',
        formatoOrigem: 'XML',
        chaveAcesso,
        ide,
        protocolo,
        emitente,
        destinatario,
        itens,
        totais,
        transporte,
        cobranca,
        pagamentos,
        infoAdicional,
        rawXML: xmlString
      };

    } catch (err) {
      console.error('Erro ao interpretar XML:', err);
      throw err;
    }
  }

  // Parser simplificado para NFS-e padrão ABRASF
  function parseNFSe(xmlDoc, infNfse) {
    const numero = getText(infNfse, 'Numero');
    const codigoVerificacao = getText(infNfse, 'CodigoVerificacao');
    const dataEmissao = getText(infNfse, 'DataEmissao');
    const prestador = findNode(infNfse, 'PrestadorServico') || findNode(infNfse, 'Prestador');
    const tomador = findNode(infNfse, 'TomadorServico') || findNode(infNfse, 'Tomador');
    const servico = findNode(infNfse, 'Servico');
    const valores = findNode(servico, 'Valores');

    const vServicos = getFloat(valores, 'ValorServicos');
    const vIss = getFloat(valores, 'ValorIss');
    const vPis = getFloat(valores, 'ValorPis');
    const vCofins = getFloat(valores, 'ValorCofins');
    const vInss = getFloat(valores, 'ValorInss');
    const vIr = getFloat(valores, 'ValorIr');
    const vCsll = getFloat(valores, 'ValorCsll');
    const vLiquido = getFloat(valores, 'ValorLiquidoNfse') || vServicos;

    return {
      tipoDocumento: 'NFS-e',
      formatoOrigem: 'XML',
      chaveAcesso: codigoVerificacao,
      ide: {
        mod: 'NFS-e',
        serie: getText(infNfse, 'Serie', 'UNICA'),
        nNF: numero,
        dhEmi: dataEmissao,
        natOp: getText(servico, 'Discriminacao', 'Prestação de Serviços'),
        tpNF: '1',
        cNF: numero
      },
      protocolo: {
        nProt: codigoVerificacao,
        dhRecbto: dataEmissao,
        cStat: '100',
        xMotivo: 'Autorizada'
      },
      emitente: {
        cnpjCpf: getText(prestador, 'Cnpj') || getText(prestador, 'Cpf'),
        razaoSocial: getText(prestador, 'RazaoSocial') || getText(prestador, 'NomeFantasia', 'Prestador de Serviços'),
        nomeFantasia: getText(prestador, 'NomeFantasia'),
        ie: getText(prestador, 'InscricaoMunicipal'),
        crtDesc: 'Prestador Municipal',
        municipio: getText(prestador, 'Municipio'),
        uf: getText(prestador, 'Uf')
      },
      destinatario: tomador ? {
        cnpjCpf: getText(tomador, 'Cnpj') || getText(tomador, 'Cpf'),
        razaoSocial: getText(tomador, 'RazaoSocial', 'Tomador de Serviços'),
        municipio: getText(tomador, 'Municipio'),
        uf: getText(tomador, 'Uf')
      } : null,
      itens: [{
        nItem: 1,
        cProd: getText(servico, 'ItemListaServico', 'SERV01'),
        xProd: getText(servico, 'Discriminacao', 'Prestação de Serviços Especializados'),
        ncm: '00000000',
        cfop: '5933',
        uCom: 'UN',
        qCom: 1,
        vUnCom: vServicos,
        vProd: vServicos,
        vDesc: getFloat(valores, 'ValorDeducoes'),
        icms: { cst: 'ISENTO', vBC: 0, vICMS: 0 },
        pis: { vPIS: vPis },
        cofins: { vCOFINS: vCofins }
      }],
      totais: {
        vProd: vServicos,
        vNF: vLiquido,
        vICMS: 0,
        vISS: vIss,
        vPIS: vPis,
        vCOFINS: vCofins,
        vINSS: vInss,
        vIR: vIr,
        vCSLL: vCsll,
        vDesc: getFloat(valores, 'ValorDeducoes')
      },
      transporte: { modFrete: '9' },
      cobranca: { duplicatas: [] },
      pagamentos: [{ tPag: '99', vPag: vLiquido }],
      infoAdicional: {
        infCpl: getText(servico, 'Discriminacao')
      }
    };
  }

  return {
    parseXML
  };
})();

// Export globally
window.NFeXMLParser = NFeXMLParser;
