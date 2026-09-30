import { XMLParser } from 'fast-xml-parser';

/**
 * Parser de Documentos Fiscais Eletrônicos (NF-e, NFC-e, CT-e, NFS-e)
 * Compatível com Schemas SEFAZ v4.00, v3.10 e ABRASF
 */
export class DfeParser {
  constructor() {
    this.parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      textNodeName: '#text',
      parseTagValue: true,
      trimValues: true,
    });
  }

  /**
   * Identifica o tipo do documento e despacha para o extrator específico
   */
  parse(xmlContent) {
    if (!xmlContent || typeof xmlContent !== 'string') {
      throw new Error('Conteúdo XML inválido ou vazio.');
    }

    const xmlObj = this.parser.parse(xmlContent);

    if (xmlObj.nfeProc || xmlObj.NFe) {
      return this.parseNFe(xmlObj);
    } else if (xmlObj.cteProc || xmlObj.CTe) {
      return this.parseCTe(xmlObj);
    } else if (xmlObj.CompNfse || xmlObj.ConsultarNfseResposta || xmlObj.GerarNfseResposta) {
      return this.parseNFSe(xmlObj);
    }

    throw new Error('Formato de XML não reconhecido. Suportados: NF-e (mod 55/65), CT-e (mod 57) e NFS-e.');
  }

  /**
   * Parser especializado em NF-e (Modelo 55) e NFC-e (Modelo 65)
   */
  parseNFe(xmlObj) {
    const nfe = xmlObj.nfeProc?.NFe || xmlObj.NFe;
    if (!nfe || !nfe.infNFe) {
      throw new Error('Estrutura de infNFe não encontrada no XML da NF-e.');
    }

    const inf = nfe.infNFe;
    const ide = inf.ide || {};
    const emit = inf.emit || {};
    const dest = inf.dest || {};
    const total = inf.total?.ICMSTot || {};
    const protNFe = xmlObj.nfeProc?.protNFe?.infProt;

    // Extração da Chave de Acesso
    let chave = protNFe?.chNFe || inf['@_Id'] || '';
    chave = chave.replace(/\D/g, '');

    // Formatação de Datas
    const dataEmissao = ide.dhEmi ? ide.dhEmi.substring(0, 10) : (ide.dEmi || new Date().toISOString().substring(0, 10));
    const dataSaidaEntrada = ide.dhSaiEnt ? ide.dhSaiEnt.substring(0, 10) : dataEmissao;

    // Itens (det)
    let detList = inf.det;
    if (!Array.isArray(detList)) {
      detList = detList ? [detList] : [];
    }

    const itens = detList.map((det) => {
      const prod = det.prod || {};
      const imp = det.imposto || {};

      // Detalhes do ICMS
      const icmsNode = imp.ICMS ? Object.values(imp.ICMS)[0] : {};
      const cstIcms = String(icmsNode.CST ?? icmsNode.CSOSN ?? '00').padStart(2, '0');
      const vBcIcms = parseFloat(icmsNode.vBC) || 0;
      const pIcms = parseFloat(icmsNode.pICMS) || 0;
      const vIcms = parseFloat(icmsNode.vICMS) || 0;
      const vBcIcmsSt = parseFloat(icmsNode.vBCST) || 0;
      const pIcmsSt = parseFloat(icmsNode.pICMSST) || 0;
      const vIcmsSt = parseFloat(icmsNode.vICMSST) || 0;
      const pRedBcIcms = parseFloat(icmsNode.pRedBC) || 0;

      // Detalhes do IPI
      const ipiTrib = imp.IPI?.IPITrib || {};
      const cstIpi = String(imp.IPI?.IPITrib?.CST ?? imp.IPI?.IPINT?.CST ?? '99').padStart(2, '0');
      const cEnqIpi = String(imp.IPI?.cEnq || '999');
      const vBcIpi = parseFloat(ipiTrib.vBC) || 0;
      const pIpi = parseFloat(ipiTrib.pIPI) || 0;
      const vIpi = parseFloat(ipiTrib.vIPI) || 0;

      // Detalhes do PIS
      const pisNode = imp.PIS ? Object.values(imp.PIS)[0] : {};
      const cstPis = String(pisNode.CST || '70').padStart(2, '0');
      const vBcPis = parseFloat(pisNode.vBC) || 0;
      const pPis = parseFloat(pisNode.pPIS) || 0;
      const vPis = parseFloat(pisNode.vPIS) || 0;

      // Detalhes do COFINS
      const cofinsNode = imp.COFINS ? Object.values(imp.COFINS)[0] : {};
      const cstCofins = String(cofinsNode.CST || '70').padStart(2, '0');
      const vBcCofins = parseFloat(cofinsNode.vBC) || 0;
      const pCofins = parseFloat(cofinsNode.pCOFINS) || 0;
      const vCofins = parseFloat(cofinsNode.vCOFINS) || 0;

      return {
        numero_item: parseInt(det['@_nItem'] || '1', 10),
        codigo_item: String(prod.cProd || '').trim(),
        descricao: String(prod.xProd || '').trim(),
        ncm: String(prod.NCM || '').replace(/\D/g, '').padStart(8, '0'),
        cest: prod.CEST ? String(prod.CEST).replace(/\D/g, '') : null,
        codigo_barra_gtin: prod.cEAN && prod.cEAN !== 'SEM GTIN' ? String(prod.cEAN) : null,
        cfop_origem: String(prod.CFOP || '').replace(/\D/g, ''),
        unidade_medida: String(prod.uCom || 'UN').trim().toUpperCase(),
        quantidade_comercial: parseFloat(prod.qCom) || 1,
        valor_unitario: parseFloat(prod.vUnCom) || 0,
        valor_bruto: parseFloat(prod.vProd) || 0,
        valor_desconto: parseFloat(prod.vDesc) || 0,
        
        // ICMS
        cst_icms: cstIcms,
        percentual_reducao_bc_icms: pRedBcIcms,
        valor_bc_icms: vBcIcms,
        aliquota_icms: pIcms,
        valor_icms: vIcms,
        valor_bc_icms_st: vBcIcmsSt,
        aliquota_icms_st: pIcmsSt,
        valor_icms_st: vIcmsSt,

        // IPI
        cst_ipi: cstIpi,
        codigo_enquadramento_ipi: cEnqIpi,
        valor_bc_ipi: vBcIpi,
        aliquota_ipi: pIpi,
        valor_ipi: vIpi,

        // PIS
        cst_pis: cstPis,
        valor_bc_pis: vBcPis,
        aliquota_pis: pPis,
        valor_pis: vPis,

        // COFINS
        cst_cofins: cstCofins,
        valor_bc_cofins: vBcCofins,
        aliquota_cofins: pCofins,
        valor_cofins: vCofins
      };
    });

    return {
      modelo: String(ide.mod || '55'),
      serie: String(ide.serie || '1'),
      numero: parseInt(ide.nNF || '0', 10),
      chave_acesso: chave,
      data_emissao: dataEmissao,
      data_entrada_saida: dataSaidaEntrada,
      natureza_operacao: String(ide.natOp || 'Venda de Mercadorias').trim(),
      tipo_operacao_sefaz: ide.tpNF === 0 ? 'ENTRADA' : 'SAIDA', // 0=Entrada, 1=Saída
      indicador_pagamento: String(ide.indPag || '0'),
      indicador_frete: String(inf.transp?.modFrete || '9'),

      emitente: {
        cnpj_cpf: String(emit.CNPJ || emit.CPF || '').replace(/\D/g, ''),
        razao_social: String(emit.xNome || '').trim(),
        nome_fantasia: String(emit.xFant || '').trim(),
        inscricao_estadual: String(emit.IE || '').replace(/\D/g, ''),
        uf: String(emit.enderEmit?.UF || '').toUpperCase(),
        codigo_municipio_ibge: String(emit.enderEmit?.cMun || ''),
        crt: String(emit.CRT || '3') // 1=Simples, 2=Excesso, 3=Regime Normal
      },

      destinatario: {
        cnpj_cpf: String(dest.CNPJ || dest.CPF || '').replace(/\D/g, ''),
        razao_social: String(dest.xNome || '').trim(),
        inscricao_estadual: String(dest.IE || '').replace(/\D/g, ''),
        uf: String(dest.enderDest?.UF || '').toUpperCase(),
        codigo_municipio_ibge: String(dest.enderDest?.cMun || '')
      },

      totais: {
        valor_produtos: parseFloat(total.vProd) || 0,
        valor_desconto: parseFloat(total.vDesc) || 0,
        valor_frete: parseFloat(total.vFrete) || 0,
        valor_seguro: parseFloat(total.vSeg) || 0,
        valor_outras_despesas: parseFloat(total.vOutro) || 0,
        valor_total_documento: parseFloat(total.vNF) || 0,
        valor_bc_icms: parseFloat(total.vBC) || 0,
        valor_icms: parseFloat(total.vICMS) || 0,
        valor_bc_icms_st: parseFloat(total.vBCST) || 0,
        valor_icms_st: parseFloat(total.vST) || 0,
        valor_ipi: parseFloat(total.vIPI) || 0,
        valor_pis: parseFloat(total.vPIS) || 0,
        valor_cofins: parseFloat(total.vCOFINS) || 0
      },

      itens
    };
  }

  /**
   * Parser para Conhecimento de Transporte Eletrônico (CT-e Mod 57)
   */
  parseCTe(xmlObj) {
    const cte = xmlObj.cteProc?.CTe || xmlObj.CTe;
    const inf = cte?.infCte;
    if (!inf) throw new Error('infCte não encontrado no XML do CT-e.');

    const ide = inf.ide || {};
    const emit = inf.emit || {};
    const rem = inf.rem || {};
    const dest = inf.dest || {};
    const vPrest = inf.vPrest || {};
    const imp = inf.imp?.ICMS ? Object.values(inf.imp.ICMS)[0] : {};

    return {
      modelo: '57',
      serie: String(ide.serie || '1'),
      numero: parseInt(ide.nCT || '0', 10),
      chave_acesso: (xmlObj.cteProc?.protCTe?.infProt?.chCTe || inf['@_Id'] || '').replace(/\D/g, ''),
      data_emissao: ide.dhEmi ? ide.dhEmi.substring(0, 10) : new Date().toISOString().substring(0, 10),
      data_entrada_saida: ide.dhEmi ? ide.dhEmi.substring(0, 10) : new Date().toISOString().substring(0, 10),
      natureza_operacao: String(ide.natOp || 'Prestacao de Servico de Transporte'),
      tipo_operacao_sefaz: 'ENTRADA',
      indicador_pagamento: '0',
      indicador_frete: '0',
      emitente: {
        cnpj_cpf: String(emit.CNPJ || '').replace(/\D/g, ''),
        razao_social: String(emit.xNome || ''),
        inscricao_estadual: String(emit.IE || ''),
        uf: String(emit.enderEmit?.UF || ''),
        codigo_municipio_ibge: String(emit.enderEmit?.cMun || '')
      },
      destinatario: {
        cnpj_cpf: String(dest.CNPJ || dest.CPF || '').replace(/\D/g, ''),
        razao_social: String(dest.xNome || ''),
        inscricao_estadual: String(dest.IE || ''),
        uf: String(dest.enderDest?.UF || ''),
        codigo_municipio_ibge: String(dest.enderDest?.cMun || '')
      },
      totais: {
        valor_produtos: parseFloat(vPrest.vTPrest) || 0,
        valor_desconto: 0,
        valor_frete: 0,
        valor_seguro: 0,
        valor_outras_despesas: 0,
        valor_total_documento: parseFloat(vPrest.vRec || vPrest.vTPrest) || 0,
        valor_bc_icms: parseFloat(imp.vBC) || 0,
        valor_icms: parseFloat(imp.vICMS) || 0,
        valor_bc_icms_st: 0,
        valor_icms_st: 0,
        valor_ipi: 0,
        valor_pis: 0,
        valor_cofins: 0
      },
      itens: [
        {
          numero_item: 1,
          codigo_item: 'SERV_TRANSP',
          descricao: 'Serviço de Transporte de Cargas',
          ncm: '00000000',
          cest: null,
          cfop_origem: String(ide.CFOP || '5353'),
          unidade_medida: 'UN',
          quantidade_comercial: 1,
          valor_unitario: parseFloat(vPrest.vTPrest) || 0,
          valor_bruto: parseFloat(vPrest.vTPrest) || 0,
          valor_desconto: 0,
          cst_icms: String(imp.CST || '00'),
          valor_bc_icms: parseFloat(imp.vBC) || 0,
          aliquota_icms: parseFloat(imp.pICMS) || 0,
          valor_icms: parseFloat(imp.vICMS) || 0,
          cst_pis: '70',
          valor_bc_pis: 0,
          aliquota_pis: 0,
          valor_pis: 0,
          cst_cofins: '70',
          valor_bc_cofins: 0,
          aliquota_cofins: 0,
          valor_cofins: 0
        }
      ]
    };
  }

  /**
   * Parser para NFS-e (Padrão ABRASF)
   */
  parseNFSe(xmlObj) {
    const comp = xmlObj.CompNfse?.Nfse?.InfNfse || xmlObj.ConsultarNfseResposta?.ListaNfse?.CompNfse?.Nfse?.InfNfse || {};
    const num = comp.Numero || '0';
    const emit = comp.PrestadorServico || {};
    const dest = comp.TomadorServico || {};
    const serv = comp.Servico || {};
    const val = serv.Valores || {};

    return {
      modelo: '00', // Mod 00 para NFS-e no SPED ou Bloco A
      serie: '1',
      numero: parseInt(num, 10),
      chave_acesso: String(comp.CodigoVerificacao || `${num}NFSE`).padEnd(44, '0'),
      data_emissao: comp.DataEmissao ? comp.DataEmissao.substring(0, 10) : new Date().toISOString().substring(0, 10),
      data_entrada_saida: comp.DataEmissao ? comp.DataEmissao.substring(0, 10) : new Date().toISOString().substring(0, 10),
      natureza_operacao: 'Prestação de Serviços',
      tipo_operacao_sefaz: 'SAIDA',
      indicador_pagamento: '0',
      indicador_frete: '9',
      emitente: {
        cnpj_cpf: String(emit.IdentificacaoPrestador?.Cnpj || '').replace(/\D/g, ''),
        razao_social: String(emit.RazaoSocial || ''),
        inscricao_estadual: '',
        uf: '',
        codigo_municipio_ibge: String(serv.MunicipioIncidencia || '')
      },
      destinatario: {
        cnpj_cpf: String(dest.IdentificacaoTomador?.CpfCnpj?.Cnpj || dest.IdentificacaoTomador?.CpfCnpj?.Cpf || '').replace(/\D/g, ''),
        razao_social: String(dest.RazaoSocial || ''),
        inscricao_estadual: '',
        uf: '',
        codigo_municipio_ibge: ''
      },
      totais: {
        valor_produtos: parseFloat(val.ValorServicos) || 0,
        valor_desconto: parseFloat(val.DescontoIncondicionado) || 0,
        valor_frete: 0,
        valor_seguro: 0,
        valor_outras_despesas: 0,
        valor_total_documento: parseFloat(val.ValorLiquidoNfse || val.ValorServicos) || 0,
        valor_bc_icms: 0,
        valor_icms: 0,
        valor_bc_icms_st: 0,
        valor_icms_st: 0,
        valor_ipi: 0,
        valor_pis: parseFloat(val.ValorPis) || 0,
        valor_cofins: parseFloat(val.ValorCofins) || 0
      },
      itens: [
        {
          numero_item: 1,
          codigo_item: String(serv.ItemListaServico || 'SERV01'),
          descricao: String(serv.Discriminacao || 'Serviços Prestados'),
          ncm: '00000000',
          cest: null,
          cfop_origem: '0000',
          unidade_medida: 'UN',
          quantidade_comercial: 1,
          valor_unitario: parseFloat(val.ValorServicos) || 0,
          valor_bruto: parseFloat(val.ValorServicos) || 0,
          valor_desconto: parseFloat(val.DescontoIncondicionado) || 0,
          cst_icms: '90',
          valor_bc_icms: 0,
          aliquota_icms: 0,
          valor_icms: 0,
          cst_pis: '01',
          valor_bc_pis: parseFloat(val.BaseCalculo || val.ValorServicos) || 0,
          aliquota_pis: parseFloat(val.AliquotaPis) || 0.65,
          valor_pis: parseFloat(val.ValorPis) || 0,
          cst_cofins: '01',
          valor_bc_cofins: parseFloat(val.BaseCalculo || val.ValorServicos) || 0,
          aliquota_cofins: parseFloat(val.AliquotaCofins) || 3.0,
          valor_cofins: parseFloat(val.ValorCofins) || 0
        }
      ]
    };
  }
}
