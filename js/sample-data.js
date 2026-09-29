/**
 * Portal do Contador - Dados de Exemplo para Demonstração Imediata
 * Contém XMLs reais e estruturados de NF-e brasileira para testes instantâneos.
 */

const SampleNFeData = (() => {

  // Exemplo 1: NF-e Comercial Completa (ICMS, PIS, COFINS, Duplicatas, Transportadora)
  // Chave calculada com DV válido:
  // UF 35 (SP), 2609, CNPJ 12.345.678/0001-95, Mod 55, Serie 001, nNF 000045892, tpEmis 1, cNF 78451296 -> DV calculado
  const sampleXML_Comercio = `<?xml version="1.0" encoding="UTF-8"?>
<nfeProc versao="4.00" xmlns="http://www.portalfiscal.inf.br/nfe">
  <NFe>
    <infNFe Id="NFe35260912345678000195550010000458921784512966" versao="4.00">
      <ide>
        <cUF>35</cUF>
        <cNF>78451296</cNF>
        <natOp>VENDA DE MERCADORIA ADQUIRIDA DE TERCEIROS</natOp>
        <mod>55</mod>
        <serie>1</serie>
        <nNF>45892</nNF>
        <dhEmi>2026-09-28T14:35:20-03:00</dhEmi>
        <dhSaiEnt>2026-09-28T16:00:00-03:00</dhSaiEnt>
        <tpNF>1</tpNF>
        <idDest>1</idDest>
        <cMunFG>3550308</cMunFG>
        <tpImp>1</tpImp>
        <tpEmis>1</tpEmis>
        <cDV>6</cDV>
        <tpAmb>1</tpAmb>
        <finNFe>1</finNFe>
        <indFinal>0</indFinal>
        <indPres>1</indPres>
        <procEmi>0</procEmi>
        <verProc>ERP Contábil Pro v4.2</verProc>
      </ide>
      <emit>
        <CNPJ>12345678000195</CNPJ>
        <xNome>DISTRIBUIDORA BRASILEIRA DE ALIMENTOS LTDA</xNome>
        <xFant>BRASIL ALIMENTOS DISTRIBUIÇÃO</xFant>
        <enderEmit>
          <xLgr>AVENIDA PAULISTA</xLgr>
          <nro>1578</nro>
          <xCpl>ANDAR 14 CONJ 142</xCpl>
          <xBairro>BELA VISTA</xBairro>
          <cMun>3550308</cMun>
          <xMun>SAO PAULO</xMun>
          <UF>SP</UF>
          <CEP>01310200</CEP>
          <cPais>1058</cPais>
          <xPais>BRASIL</xPais>
          <fone>1133334444</fone>
        </enderEmit>
        <IE>112233445566</IE>
        <CRT>3</CRT>
      </emit>
      <dest>
        <CNPJ>98765432000188</CNPJ>
        <xNome>SUPERMERCADOS PAULISTA DO NORTE S.A.</xNome>
        <enderDest>
          <xLgr>RUA VOLUNTARIOS DA PATRIA</xLgr>
          <nro>2450</nro>
          <xBairro>SANTANA</xBairro>
          <cMun>3550308</cMun>
          <xMun>SAO PAULO</xMun>
          <UF>SP</UF>
          <CEP>02010400</CEP>
          <cPais>1058</cPais>
          <xPais>BRASIL</xPais>
          <fone>1129998888</fone>
        </enderDest>
        <indIEDest>1</indIEDest>
        <IE>998877665544</IE>
        <email>fiscal@superpaulistanorte.com.br</email>
      </dest>
      <det nItem="1">
        <prod>
          <cProd>ALIM-001</cProd>
          <cEAN>7891000100101</cEAN>
          <xProd>AZEITE DE OLIVA EXTRA VIRGEM 500ML VIDRO PREMIUM</xProd>
          <NCM>15091000</NCM>
          <CFOP>5102</CFOP>
          <uCom>UN</uCom>
          <qCom>120.0000</qCom>
          <vUnCom>38.5000</vUnCom>
          <vProd>4620.00</vProd>
          <cEANTrib>7891000100101</cEANTrib>
          <uTrib>UN</uTrib>
          <qTrib>120.0000</qTrib>
          <vUnTrib>38.5000</vUnTrib>
          <vDesc>120.00</vDesc>
          <indTot>1</indTot>
        </prod>
        <imposto>
          <vTotTrib>850.40</vTotTrib>
          <ICMS>
            <ICMS00>
              <orig>0</orig>
              <CST>00</CST>
              <modBC>3</modBC>
              <vBC>4500.00</vBC>
              <pICMS>18.00</pICMS>
              <vICMS>810.00</vICMS>
            </ICMS00>
          </ICMS>
          <PIS>
            <PISAliq>
              <CST>01</CST>
              <vBC>4500.00</vBC>
              <pPIS>1.65</pPIS>
              <vPIS>74.25</vPIS>
            </PISAliq>
          </PIS>
          <COFINS>
            <COFINSAliq>
              <CST>01</CST>
              <vBC>4500.00</vBC>
              <pCOFINS>7.60</pCOFINS>
              <vCOFINS>342.00</vCOFINS>
            </COFINSAliq>
          </COFINS>
        </imposto>
      </det>
      <det nItem="2">
        <prod>
          <cProd>ALIM-002</cProd>
          <cEAN>7891000200202</cEAN>
          <xProd>CAFÉ ESPECIAL 100% ARABICA TORRADO E MOÍDO 500G</xProd>
          <NCM>09012100</NCM>
          <CFOP>5102</CFOP>
          <uCom>PCT</uCom>
          <qCom>200.0000</qCom>
          <vUnCom>22.0000</vUnCom>
          <vProd>4400.00</vProd>
          <cEANTrib>7891000200202</cEANTrib>
          <uTrib>PCT</uTrib>
          <qTrib>200.0000</qTrib>
          <vUnTrib>22.0000</vUnTrib>
          <vDesc>0.00</vDesc>
          <indTot>1</indTot>
        </prod>
        <imposto>
          <vTotTrib>780.00</vTotTrib>
          <ICMS>
            <ICMS00>
              <orig>0</orig>
              <CST>00</CST>
              <modBC>3</modBC>
              <vBC>4400.00</vBC>
              <pICMS>18.00</pICMS>
              <vICMS>792.00</vICMS>
            </ICMS00>
          </ICMS>
          <PIS>
            <PISAliq>
              <CST>01</CST>
              <vBC>4400.00</vBC>
              <pPIS>1.65</pPIS>
              <vPIS>72.60</vPIS>
            </PISAliq>
          </PIS>
          <COFINS>
            <COFINSAliq>
              <CST>01</CST>
              <vBC>4400.00</vBC>
              <pCOFINS>7.60</pCOFINS>
              <vCOFINS>334.40</vCOFINS>
            </COFINSAliq>
          </COFINS>
        </imposto>
      </det>
      <det nItem="3">
        <prod>
          <cProd>ALIM-003</cProd>
          <cEAN>7891000300303</cEAN>
          <xProd>MASSA ARTESANAL ITALIANA FETTUCCINE 500G</xProd>
          <NCM>19021900</NCM>
          <CFOP>5102</CFOP>
          <uCom>CX</uCom>
          <qCom>50.0000</qCom>
          <vUnCom>19.6000</vUnCom>
          <vProd>980.00</vProd>
          <cEANTrib>7891000300303</cEANTrib>
          <uTrib>CX</uTrib>
          <qTrib>50.0000</qTrib>
          <vUnTrib>19.6000</vUnTrib>
          <vDesc>0.00</vDesc>
          <indTot>1</indTot>
        </prod>
        <imposto>
          <vTotTrib>145.00</vTotTrib>
          <ICMS>
            <ICMS00>
              <orig>0</orig>
              <CST>00</CST>
              <modBC>3</modBC>
              <vBC>980.00</vBC>
              <pICMS>12.00</pICMS>
              <vICMS>117.60</vICMS>
            </ICMS00>
          </ICMS>
          <PIS>
            <PISAliq>
              <CST>01</CST>
              <vBC>980.00</vBC>
              <pPIS>1.65</pPIS>
              <vPIS>16.17</vPIS>
            </PISAliq>
          </PIS>
          <COFINS>
            <COFINSAliq>
              <CST>01</CST>
              <vBC>980.00</vBC>
              <pCOFINS>7.60</pCOFINS>
              <vCOFINS>74.48</vCOFINS>
            </COFINSAliq>
          </COFINS>
        </imposto>
      </det>
      <total>
        <ICMSTot>
          <vBC>9880.00</vBC>
          <vICMS>1719.60</vICMS>
          <vICMSDeson>0.00</vICMSDeson>
          <vFCPUFDest>0.00</vFCPUFDest>
          <vICMSUFDest>0.00</vICMSUFDest>
          <vICMSUFRemet>0.00</vICMSUFRemet>
          <vFCP>0.00</vFCP>
          <vBCST>0.00</vBCST>
          <vST>0.00</vST>
          <vFCPST>0.00</vFCPST>
          <vFCPSTRet>0.00</vFCPSTRet>
          <vProd>10000.00</vProd>
          <vFrete>150.00</vFrete>
          <vSeg>30.00</vSeg>
          <vDesc>120.00</vDesc>
          <vII>0.00</vII>
          <vIPI>0.00</vIPI>
          <vIPIDevol>0.00</vIPIDevol>
          <vPIS>163.02</vPIS>
          <vCOFINS>750.88</vCOFINS>
          <vOutro>0.00</vOutro>
          <vNF>10060.00</vNF>
          <vTotTrib>1775.40</vTotTrib>
        </ICMSTot>
      </total>
      <transp>
        <modFrete>0</modFrete>
        <transporta>
          <CNPJ>55667788000122</CNPJ>
          <xNome>LOGISTICA EXPRESSA RODOVIARIO PAULISTA LTDA</xNome>
          <IE>114477889900</IE>
          <xEnder>RODOVIA ANHANGUERA KM 22</xEnder>
          <xMun>SAO PAULO</xMun>
          <UF>SP</UF>
        </transporta>
        <veicTransp>
          <placa>BRA2E19</placa>
          <UF>SP</UF>
          <RNTC>12345678</RNTC>
        </veicTransp>
        <vol>
          <qVol>370</qVol>
          <esp>VOLUMES</esp>
          <marca>DIVERSAS</marca>
          <pesoL>385.500</pesoL>
          <pesoB>410.200</pesoB>
        </vol>
      </transp>
      <cobr>
        <fat>
          <nFat>45892</nFat>
          <vOrig>10060.00</vOrig>
          <vDesc>0.00</vDesc>
          <vLiq>10060.00</vLiq>
        </fat>
        <dup>
          <nDup>001</nDup>
          <dVenc>2026-10-28</dVenc>
          <vDup>5030.00</vDup>
        </dup>
        <dup>
          <nDup>002</nDup>
          <dVenc>2026-11-28</dVenc>
          <vDup>5030.00</vDup>
        </dup>
      </cobr>
      <pag>
        <detPag>
          <tPag>15</tPag>
          <vPag>10060.00</vPag>
        </detPag>
      </pag>
      <infAdic>
        <infAdFisco>ICMS RECOLHIDO NA FORMA DA LEGISLACAO VIGENTE.</infAdFisco>
        <infCpl>PEDIDO DE COMPRA N. 88412 - CONDICAO DE PAGAMENTO: 30/60 DIAS BOLETO BANCARIO. VALOR APROXIMADO DOS TRIBUTOS FEDERAIS R$ 913,90 (9,08%), ESTADUAIS R$ 861,50 (8,56%). FONTE: IBPT.</infCpl>
      </infAdic>
    </infNFe>
  </NFe>
  <protNFe versao="4.00">
    <infProt>
      <tpAmb>1</tpAmb>
      <verAplic>SP_NFE_PL_009_V4</verAplic>
      <chNFe>35260912345678000195550010000458921784512966</chNFe>
      <dhRecbto>2026-09-28T14:35:22-03:00</dhRecbto>
      <nProt>135260089541289</nProt>
      <digVal>zO7hF0rM3g6uG8j2kL9mOp1QrSt=</digVal>
      <cStat>100</cStat>
      <xMotivo>Autorizado o uso da NF-e</xMotivo>
    </infProt>
  </protNFe>
</nfeProc>`;

  // Exemplo 2: NF-e Industrial Interestadual com IPI e ICMS-ST
  const sampleXML_Industria = `<?xml version="1.0" encoding="UTF-8"?>
<nfeProc versao="4.00" xmlns="http://www.portalfiscal.inf.br/nfe">
  <NFe>
    <infNFe Id="NFe31260933445566000177550020000128451845120369" versao="4.00">
      <ide>
        <cUF>31</cUF>
        <cNF>84512036</cNF>
        <natOp>VENDA DE PRODUCAO DO ESTABELECIMENTO C/ SUBSTITUICAO TRIBUTARIA</natOp>
        <mod>55</mod>
        <serie>2</serie>
        <nNF>12845</nNF>
        <dhEmi>2026-09-27T10:15:00-03:00</dhEmi>
        <tpNF>1</tpNF>
        <idDest>2</idDest>
        <cMunFG>3106200</cMunFG>
        <tpImp>1</tpImp>
        <tpEmis>1</tpEmis>
        <cDV>9</cDV>
        <tpAmb>1</tpAmb>
        <finNFe>1</finNFe>
        <indFinal>0</indFinal>
        <indPres>9</indPres>
        <procEmi>0</procEmi>
        <verProc>Metalurgica ERP v9</verProc>
      </ide>
      <emit>
        <CNPJ>33445566000177</CNPJ>
        <xNome>METALURGICA E AUTOPECAS MINEIRA INDUSTRIA S.A.</xNome>
        <xFant>MINEIRA AUTOPECAS</xFant>
        <enderEmit>
          <xLgr>AVENIDA DOS ANDRADAS</xLgr>
          <nro>3000</nro>
          <xBairro>SANTA EFIGENIA</xBairro>
          <cMun>3106200</cMun>
          <xMun>BELO HORIZONTE</xMun>
          <UF>MG</UF>
          <CEP>30260070</CEP>
          <fone>3132221100</fone>
        </enderEmit>
        <IE>0623344550012</IE>
        <CRT>3</CRT>
      </emit>
      <dest>
        <CNPJ>44556677000199</CNPJ>
        <xNome>CENTRO DE REPAROS AUTOMOTIVOS CARIOCA LTDA</xNome>
        <enderDest>
          <xLgr>AVENIDA BRASIL</xLgr>
          <nro>12500</nro>
          <xBairro>PENHA</xBairro>
          <cMun>3304557</cMun>
          <xMun>RIO DE JANEIRO</xMun>
          <UF>RJ</UF>
          <CEP>21012350</CEP>
          <fone>2125557788</fone>
        </enderDest>
        <indIEDest>1</indIEDest>
        <IE>87654321</IE>
        <email>compras@reparoscarioca.com.br</email>
      </dest>
      <det nItem="1">
        <prod>
          <cProd>DISC-VENT-01</cProd>
          <cEAN>7898877660011</cEAN>
          <xProd>DISCO DE FREIO VENTILADO DIANTEIRO REFORÇADO</xProd>
          <NCM>87083090</NCM>
          <CEST>0100100</CEST>
          <CFOP>6401</CFOP>
          <uCom>PC</uCom>
          <qCom>40.0000</qCom>
          <vUnCom>185.0000</vUnCom>
          <vProd>7400.00</vProd>
          <uTrib>PC</uTrib>
          <qTrib>40.0000</qTrib>
          <vUnTrib>185.0000</vUnTrib>
          <indTot>1</indTot>
        </prod>
        <imposto>
          <vTotTrib>2140.00</vTotTrib>
          <ICMS>
            <ICMS10>
              <orig>0</orig>
              <CST>10</CST>
              <modBC>3</modBC>
              <vBC>7400.00</vBC>
              <pICMS>12.00</pICMS>
              <vICMS>888.00</vICMS>
              <modBCST>4</modBCST>
              <pMVAST>45.00</pMVAST>
              <vBCST>11266.50</vBCST>
              <pICMSST>18.00</pICMSST>
              <vICMSST>1140.00</vICMSST>
            </ICMS10>
          </ICMS>
          <IPI>
            <cEnq>999</cEnq>
            <IPITrib>
              <CST>50</CST>
              <vBC>7400.00</vBC>
              <pIPI>5.00</pIPI>
              <vIPI>370.00</vIPI>
            </IPITrib>
          </IPI>
          <PIS>
            <PISAliq>
              <CST>01</CST>
              <vBC>7400.00</vBC>
              <pPIS>1.65</pPIS>
              <vPIS>122.10</vPIS>
            </PISAliq>
          </PIS>
          <COFINS>
            <COFINSAliq>
              <CST>01</CST>
              <vBC>7400.00</vBC>
              <pCOFINS>7.60</pCOFINS>
              <vCOFINS>562.40</vCOFINS>
            </COFINSAliq>
          </COFINS>
        </imposto>
      </det>
      <total>
        <ICMSTot>
          <vBC>7400.00</vBC>
          <vICMS>888.00</vICMS>
          <vICMSDeson>0.00</vICMSDeson>
          <vBCST>11266.50</vBCST>
          <vST>1140.00</vST>
          <vProd>7400.00</vProd>
          <vFrete>200.00</vFrete>
          <vSeg>0.00</vSeg>
          <vDesc>0.00</vDesc>
          <vII>0.00</vII>
          <vIPI>370.00</vIPI>
          <vIPIDevol>0.00</vIPIDevol>
          <vPIS>122.10</vPIS>
          <vCOFINS>562.40</vCOFINS>
          <vOutro>0.00</vOutro>
          <vNF>9110.00</vNF>
          <vTotTrib>2140.00</vTotTrib>
        </ICMSTot>
      </total>
      <transp>
        <modFrete>1</modFrete>
        <vol>
          <qVol>40</qVol>
          <esp>CAIXAS</esp>
          <pesoL>240.000</pesoL>
          <pesoB>255.000</pesoB>
        </vol>
      </transp>
      <cobr>
        <fat>
          <nFat>12845</nFat>
          <vOrig>9110.00</vOrig>
          <vLiq>9110.00</vLiq>
        </fat>
        <dup>
          <nDup>01</nDup>
          <dVenc>2026-10-27</dVenc>
          <vDup>9110.00</vDup>
        </dup>
      </cobr>
      <pag>
        <detPag>
          <tPag>17</tPag>
          <vPag>9110.00</vPag>
        </detPag>
      </pag>
      <infAdic>
        <infAdFisco>ICMS RETIDO POR SUBSTITUICAO TRIBUTARIA CONFORME PROTOCOLO ICMS 41/2008.</infAdFisco>
        <infCpl>PAGAMENTO VIA PIX CHAVE CNPJ 33445566000177. PRODUTO DESTINADO A REVENDA/APLICACAO AUTOMOTIVA.</infCpl>
      </infAdic>
    </infNFe>
  </NFe>
  <protNFe versao="4.00">
    <infProt>
      <tpAmb>1</tpAmb>
      <verAplic>MG_NFE_V4_0</verAplic>
      <chNFe>31260933445566000177550020000128451845120369</chNFe>
      <dhRecbto>2026-09-27T10:15:05-03:00</dhRecbto>
      <nProt>131260077884411</nProt>
      <digVal>jK9L0mNoP1qRsTuVwXyZ1234567=</digVal>
      <cStat>100</cStat>
      <xMotivo>Autorizado o uso da NF-e</xMotivo>
    </infProt>
  </protNFe>
</nfeProc>`;

  // Exemplo 3: Simples Nacional (CSOSN 101/102 com permissão de crédito de ICMS)
  const sampleXML_Simples = `<?xml version="1.0" encoding="UTF-8"?>
<nfeProc versao="4.00" xmlns="http://www.portalfiscal.inf.br/nfe">
  <NFe>
    <infNFe Id="NFe41260977889900000155550010000032901998877662" versao="4.00">
      <ide>
        <cUF>41</cUF>
        <cNF>99887766</cNF>
        <natOp>VENDA DE MERCADORIAS SIMPLES NACIONAL</natOp>
        <mod>55</mod>
        <serie>1</serie>
        <nNF>3290</nNF>
        <dhEmi>2026-09-26T09:00:00-03:00</dhEmi>
        <tpNF>1</tpNF>
        <idDest>1</idDest>
        <cMunFG>4106902</cMunFG>
        <tpImp>1</tpImp>
        <tpEmis>1</tpEmis>
        <cDV>2</cDV>
        <tpAmb>1</tpAmb>
        <finNFe>1</finNFe>
        <indFinal>1</indFinal>
        <indPres>2</indPres>
        <procEmi>0</procEmi>
        <verProc>Emissor Simples v2.0</verProc>
      </ide>
      <emit>
        <CNPJ>77889900000155</CNPJ>
        <xNome>PAPELARIA E INFORMATICA CURITIBA ME</xNome>
        <xFant>CURITIBA OFFICE TECH</xFant>
        <enderEmit>
          <xLgr>RUA XV DE NOVEMBRO</xLgr>
          <nro>800</nro>
          <xBairro>CENTRO</xBairro>
          <cMun>4106902</cMun>
          <xMun>CURITIBA</xMun>
          <UF>PR</UF>
          <CEP>80020310</CEP>
          <fone>4130304040</fone>
        </enderEmit>
        <IE>9012345678</IE>
        <CRT>1</CRT>
      </emit>
      <dest>
        <CPF>12345678909</CPF>
        <xNome>MARCOS SILVA PEREIRA</xNome>
        <enderDest>
          <xLgr>RUA MARECHAL DEODORO</xLgr>
          <nro>450</nro>
          <xBairro>ALTO DA GLORIA</xBairro>
          <cMun>4106902</cMun>
          <xMun>CURITIBA</xMun>
          <UF>PR</UF>
          <CEP>80030000</CEP>
        </enderDest>
        <indIEDest>9</indIEDest>
      </dest>
      <det nItem="1">
        <prod>
          <cProd>INF-019</cProd>
          <xProd>CADEIRA ERGONOMICA PRESIDENTE COM APOIO DE BRACO 3D</xProd>
          <NCM>94013090</NCM>
          <CFOP>5102</CFOP>
          <uCom>UN</uCom>
          <qCom>2.0000</qCom>
          <vUnCom>890.0000</vUnCom>
          <vProd>1780.00</vProd>
          <uTrib>UN</uTrib>
          <qTrib>2.0000</qTrib>
          <vUnTrib>890.0000</vUnTrib>
          <indTot>1</indTot>
        </prod>
        <imposto>
          <vTotTrib>295.00</vTotTrib>
          <ICMS>
            <ICMSSN101>
              <orig>0</orig>
              <CSOSN>101</CSOSN>
              <pCredSN>2.82</pCredSN>
              <vCredICMSSN>50.20</vCredICMSSN>
            </ICMSSN101>
          </ICMS>
          <PIS>
            <PISNT>
              <CST>07</CST>
            </PISNT>
          </PIS>
          <COFINS>
            <COFINSNT>
              <CST>07</CST>
            </COFINSNT>
          </COFINS>
        </imposto>
      </det>
      <total>
        <ICMSTot>
          <vBC>0.00</vBC>
          <vICMS>0.00</vICMS>
          <vICMSDeson>0.00</vICMSDeson>
          <vBCST>0.00</vBCST>
          <vST>0.00</vST>
          <vProd>1780.00</vProd>
          <vFrete>0.00</vFrete>
          <vSeg>0.00</vSeg>
          <vDesc>0.00</vDesc>
          <vII>0.00</vII>
          <vIPI>0.00</vIPI>
          <vPIS>0.00</vPIS>
          <vCOFINS>0.00</vCOFINS>
          <vOutro>0.00</vOutro>
          <vNF>1780.00</vNF>
          <vTotTrib>295.00</vTotTrib>
        </ICMSTot>
      </total>
      <transp>
        <modFrete>9</modFrete>
      </transp>
      <pag>
        <detPag>
          <tPag>03</tPag>
          <vPag>1780.00</vPag>
        </detPag>
      </pag>
      <infAdic>
        <infCpl>DOCUMENTO EMITIDO POR ME OU EPP OPTANTE PELO SIMPLES NACIONAL. NAO GERA DIREITO A CREDITO FISCAL DE IPI. PERMITE O APROVEITAMENTO DO CREDITO DE ICMS NO VALOR DE R$ 50,20 CORRESPONDENTE A ALIQUOTA DE 2,82% NOS TERMOS DO ART. 23 DA LC 123/2006.</infCpl>
      </infAdic>
    </infNFe>
  </NFe>
  <protNFe versao="4.00">
    <infProt>
      <tpAmb>1</tpAmb>
      <chNFe>41260977889900000155550010000032901998877662</chNFe>
      <dhRecbto>2026-09-26T09:00:03-03:00</dhRecbto>
      <nProt>141260011223344</nProt>
      <cStat>100</cStat>
      <xMotivo>Autorizado o uso da NF-e</xMotivo>
    </infProt>
  </protNFe>
</nfeProc>`;

  return {
    sampleXML_Comercio,
    sampleXML_Industria,
    sampleXML_Simples
  };
})();

// Export globally
window.SampleNFeData = SampleNFeData;
