/**
 * Portal do Contador - Aplicação Principal
 * Gerenciamento de estado, renderização dinâmica, eventos e interatividade.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Estado global da aplicação
  const state = {
    currentNFe: null,
    theme: localStorage.getItem('portal_theme') || 'dark',
    activeTab: 'tab-itens',
    itemFilterQuery: ''
  };

  // Elementos do DOM
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const fileDropZone = document.getElementById('fileDropZone');
  const fileInput = document.getElementById('fileInput');
  const parsingLoader = document.getElementById('parsingLoader');
  const nfResultsArea = document.getElementById('nfResultsArea');
  const initialHeroArea = document.getElementById('initialHeroArea');
  
  // Botões de Amostra
  const btnSampleComercio = document.getElementById('btnSampleComercio');
  const btnSampleIndustria = document.getElementById('btnSampleIndustria');
  const btnSampleSimples = document.getElementById('btnSampleSimples');

  // Inicializa tema
  applyTheme(state.theme);

  // Configurações de Eventos
  initEventListeners();

  // Aplica tema claro/escuro
  function applyTheme(theme) {
    state.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('portal_theme', theme);
    if (themeToggleBtn) {
      themeToggleBtn.innerHTML = theme === 'dark' 
        ? '<span>🌙 Modo Escuro</span><small style="color:var(--text-dim)">Trocar</small>' 
        : '<span>☀️ Modo Claro</span><small style="color:var(--text-dim)">Trocar</small>';
    }
  }

  // Toast Notification Flutuante
  function showToast(message, type = 'info') {
    const existing = document.getElementById('app-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'app-toast';
    toast.style.position = 'fixed';
    toast.style.bottom = '24px';
    toast.style.right = '24px';
    toast.style.padding = '12px 20px';
    toast.style.background = type === 'success' ? '#059669' : (type === 'warning' ? '#d97706' : '#4f46e5');
    toast.style.color = '#ffffff';
    toast.style.borderRadius = '8px';
    toast.style.fontSize = '0.85rem';
    toast.style.fontWeight = '600';
    toast.style.boxShadow = '0 6px 20px rgba(0,0,0,0.3)';
    toast.style.zIndex = '99999';
    toast.style.display = 'flex';
    toast.style.alignItems = 'center';
    toast.style.gap = '8px';
    toast.style.animation = 'fadeIn 0.2s ease';
    toast.innerHTML = `<span>${type === 'success' ? '✓' : 'ℹ'}</span> ${message}`;

    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  // Inicializa ouvintes de eventos
  function initEventListeners() {
    // Alternância de Tema
    if (themeToggleBtn) {
      themeToggleBtn.addEventListener('click', () => {
        applyTheme(state.theme === 'dark' ? 'light' : 'dark');
      });
    }

    // Drag and Drop e Input de Arquivos
    if (fileDropZone && fileInput) {
      fileDropZone.addEventListener('click', () => fileInput.click());

      ['dragenter', 'dragover'].forEach(eventName => {
        fileDropZone.addEventListener(eventName, (e) => {
          e.preventDefault();
          e.stopPropagation();
          fileDropZone.classList.add('dragover');
        });
      });

      ['dragleave', 'drop'].forEach(eventName => {
        fileDropZone.addEventListener(eventName, (e) => {
          e.preventDefault();
          e.stopPropagation();
          fileDropZone.classList.remove('dragover');
        });
      });

      fileDropZone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files && files.length > 0) {
          handleIncomingFile(files[0]);
        }
      });

      fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files.length > 0) {
          handleIncomingFile(e.target.files[0]);
        }
      });
    }

    // Botões de Amostras
    if (btnSampleComercio) {
      btnSampleComercio.addEventListener('click', (e) => {
        e.stopPropagation();
        loadSampleData(SampleNFeData.sampleXML_Comercio, 'NF-e Comercial (Alimentos & Varejo)');
      });
    }

    if (btnSampleIndustria) {
      btnSampleIndustria.addEventListener('click', (e) => {
        e.stopPropagation();
        loadSampleData(SampleNFeData.sampleXML_Industria, 'NF-e Industrial (Metalúrgica c/ IPI e ST)');
      });
    }

    if (btnSampleSimples) {
      btnSampleSimples.addEventListener('click', (e) => {
        e.stopPropagation();
        loadSampleData(SampleNFeData.sampleXML_Simples, 'NF-e Simples Nacional (Comércio & Escritório)');
      });
    }
  }

  // Carrega Amostra Pré-definida
  function loadSampleData(xmlString, label) {
    showLoader(true);
    setTimeout(() => {
      try {
        const parsed = NFeXMLParser.parseXML(xmlString);
        state.currentNFe = parsed;
        renderNFeResults(parsed);
        showToast(`${label} carregada com sucesso!`, 'success');
      } catch (err) {
        showToast('Erro ao carregar amostra: ' + err.message, 'warning');
      } finally {
        showLoader(false);
      }
    }, 300);
  }

  // Trata arquivo de entrada (XML ou PDF)
  async function handleIncomingFile(file) {
    const fileName = file.name.toLowerCase();
    showLoader(true);

    try {
      if (fileName.endsWith('.xml')) {
        const text = await file.text();
        const parsed = NFeXMLParser.parseXML(text);
        state.currentNFe = parsed;
        renderNFeResults(parsed);
        showToast(`Arquivo XML "${file.name}" processado com sucesso!`, 'success');
      } else if (fileName.endsWith('.pdf')) {
        const buffer = await file.arrayBuffer();
        const parsed = await DanfePDFParser.parsePDF(buffer, file.name);
        state.currentNFe = parsed;
        renderNFeResults(parsed);
        showToast(`Documento DANFE em PDF "${file.name}" interpretado!`, 'success');
      } else {
        throw new Error('Formato não suportado. Por favor, envie um arquivo .XML ou .PDF de Nota Fiscal.');
      }
    } catch (err) {
      console.error(err);
      alert('Atenção: ' + (err.message || 'Falha ao processar arquivo.'));
      showToast('Falha no processamento: ' + err.message, 'warning');
    } finally {
      showLoader(false);
    }
  }

  function showLoader(isLoading) {
    if (parsingLoader) parsingLoader.style.display = isLoading ? 'flex' : 'none';
    if (fileDropZone) fileDropZone.style.opacity = isLoading ? '0.5' : '1';
  }

  // Renderização Completa dos Resultados
  function renderNFeResults(data) {
    if (!nfResultsArea) return;

    // Rola suavemente até os resultados
    nfResultsArea.style.display = 'flex';
    nfResultsArea.scrollIntoView({ behavior: 'smooth', block: 'start' });

    const emit = data.emitente || {};
    const dest = data.destinatario || {};
    const ide = data.ide || {};
    const totais = data.totais || {};
    const itens = data.itens || [];
    const transporte = data.transporte || {};
    const cobranca = data.cobranca || {};
    const auditAlerts = TaxHelpers.runConsistencyAudit(data);

    // Soma estimada de tributos
    const somaTributos = (totais.vICMS || 0) + (totais.vST || 0) + (totais.vIPI || 0) + (totais.vPIS || 0) + (totais.vCOFINS || 0);
    const percentTributos = totais.vNF > 0 ? (somaTributos / totais.vNF) * 100 : 0;

    nfResultsArea.innerHTML = `
      <!-- Cabeçalho Executivo da NF -->
      <div class="nf-header-card">
        <div class="nf-header-top">
          <div class="nf-title-group">
            <span class="doc-type-badge">${data.tipoDocumento}</span>
            <div class="nf-number-title">
              Nota Fiscal Nº ${ide.nNF || 'S/N'} <span style="font-size:0.9rem; color:var(--text-muted); font-weight:500;">(Série ${ide.serie || '1'})</span>
            </div>
            <span class="format-badge ${data.formatoOrigem === 'XML' ? 'xml' : 'pdf'}">
              Origem: ${data.formatoOrigem}
            </span>
          </div>

          <div style="display:flex; gap:10px; align-items:center;">
            <div class="nf-status-badge">
              <span>●</span> ${data.protocolo ? (data.protocolo.xMotivo || 'Autorizada SEFAZ') : 'Status: Concluído'}
            </div>
            <button class="header-btn btn-secondary" id="btnNovaLeitura" title="Carregar outro documento">
              🔄 Nova Nota
            </button>
          </div>
        </div>

        <!-- Chave de Acesso -->
        <div class="chave-box">
          <div class="chave-info">
            <span class="chave-label">Chave de Acesso (44 Dígitos)</span>
            <span class="chave-code" id="chaveCodeDisplay">${TaxHelpers.formatChave(data.chaveAcesso)}</span>
          </div>
          <div class="chave-actions">
            <button class="header-btn btn-secondary" id="btnCopiarChave" style="padding: 6px 12px; font-size:0.8rem;">
              📋 Copiar Chave
            </button>
            <a href="https://www.nfe.fazenda.gov.br/portal/consultaRecaptcha.aspx?tipoConsulta=completa&tipoConteudo=XbSeqxE8pl8=" target="_blank" class="header-btn btn-secondary" style="padding: 6px 12px; font-size:0.8rem; text-decoration:none;">
              🔗 Consultar SEFAZ
            </a>
          </div>
        </div>

        <!-- Metadados Rápidos -->
        <div style="display:flex; flex-wrap:wrap; gap:20px; font-size:0.85rem; color:var(--text-muted); padding-top:6px; border-top:1px solid var(--border-subtle);">
          <div><strong>Emissão:</strong> ${TaxHelpers.formatDate(ide.dhEmi)}</div>
          <div><strong>Natureza da Operação:</strong> ${ide.natOp || '-'}</div>
          <div><strong>Tipo:</strong> ${ide.tpNF === '0' ? '0 - Entrada' : '1 - Saída'}</div>
          ${data.protocolo?.nProt ? `<div><strong>Protocolo:</strong> <span style="font-family:var(--font-mono)">${data.protocolo.nProt}</span></div>` : ''}
        </div>
      </div>

      <!-- Barra de Ações de Exportação Rápida -->
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; background:var(--bg-card); padding:14px 20px; border-radius:var(--radius-md); border:1px solid var(--border-subtle);">
        <div style="font-size:0.85rem; font-weight:600; color:var(--text-muted);">
          📊 Ações Rápidas de Exportação e Relatório:
        </div>
        <div style="display:flex; gap:10px; flex-wrap:wrap;">
          <button class="header-btn btn-emerald" id="btnExportCSV">
            📥 Baixar Itens em Excel (CSV)
          </button>
          <button class="header-btn btn-secondary" id="btnExportJSON">
            💻 Exportar JSON Estruturado
          </button>
          <button class="header-btn btn-secondary" id="btnPrintReport">
            🖨️ Imprimir Resumo
          </button>
        </div>
      </div>

      <!-- Grid de KPIs Tributários e Financeiros -->
      <div class="kpi-grid">
        <div class="kpi-card highlight">
          <div class="kpi-header">
            <span class="kpi-title">Valor Total da NF</span>
            <span class="kpi-icon">💵</span>
          </div>
          <div class="kpi-value" style="color:#818cf8">${TaxHelpers.formatCurrency(totais.vNF)}</div>
          <div class="kpi-subtext">Valor líquido final do documento</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-header">
            <span class="kpi-title">Total dos Produtos</span>
            <span class="kpi-icon">📦</span>
          </div>
          <div class="kpi-value">${TaxHelpers.formatCurrency(totais.vProd)}</div>
          <div class="kpi-subtext">${itens.length} produto(s) listado(s)</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-header">
            <span class="kpi-title">Carga Fiscal Total</span>
            <span class="kpi-icon">⚖️</span>
          </div>
          <div class="kpi-value" style="color:#34d399">${TaxHelpers.formatCurrency(somaTributos)}</div>
          <div class="kpi-subtext">${TaxHelpers.formatPercent(percentTributos)} do total da nota</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-header">
            <span class="kpi-title">ICMS Próprio</span>
            <span class="kpi-icon">🛡️</span>
          </div>
          <div class="kpi-value">${TaxHelpers.formatCurrency(totais.vICMS)}</div>
          <div class="kpi-subtext">Base: ${TaxHelpers.formatCurrency(totais.vBC)}</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-header">
            <span class="kpi-title">ICMS ST</span>
            <span class="kpi-icon">🏷️</span>
          </div>
          <div class="kpi-value">${TaxHelpers.formatCurrency(totais.vST)}</div>
          <div class="kpi-subtext">Base ST: ${TaxHelpers.formatCurrency(totais.vBCST)}</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-header">
            <span class="kpi-title">PIS & COFINS</span>
            <span class="kpi-icon">📈</span>
          </div>
          <div class="kpi-value">${TaxHelpers.formatCurrency((totais.vPIS || 0) + (totais.vCOFINS || 0))}</div>
          <div class="kpi-subtext">PIS: ${TaxHelpers.formatCurrency(totais.vPIS)} | COFINS: ${TaxHelpers.formatCurrency(totais.vCOFINS)}</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-header">
            <span class="kpi-title">IPI / Indústria</span>
            <span class="kpi-icon">🏭</span>
          </div>
          <div class="kpi-value">${TaxHelpers.formatCurrency(totais.vIPI)}</div>
          <div class="kpi-subtext">Imposto sobre Prod. Industrializados</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-header">
            <span class="kpi-title">Frete / Despesas</span>
            <span class="kpi-icon">🚚</span>
          </div>
          <div class="kpi-value">${TaxHelpers.formatCurrency((totais.vFrete || 0) + (totais.vSeg || 0) + (totais.vOutro || 0))}</div>
          <div class="kpi-subtext">Desc: ${TaxHelpers.formatCurrency(totais.vDesc)} | Frete: ${TaxHelpers.formatCurrency(totais.vFrete)}</div>
        </div>
      </div>

      <!-- Emitente e Destinatário Lado a Lado -->
      <div class="parties-grid">
        <!-- Emitente -->
        <div class="party-card">
          <div class="party-header">
            <div class="party-tag">
              <span>🏢</span> Emitente / Vendedor
            </div>
            <span class="format-badge" style="border-color:rgba(79, 70, 229, 0.4); color:#a5b4fc">
              ${emit.crtDesc || 'Regime Tributário'}
            </span>
          </div>

          <div>
            <div class="party-name">${emit.razaoSocial || 'Razão Social não informada'}</div>
            ${emit.nomeFantasia ? `<div class="party-fantasy">${emit.nomeFantasia}</div>` : ''}
          </div>

          <div class="info-rows">
            <div class="info-row">
              <span class="info-label">CNPJ / CPF:</span>
              <span class="info-val mono">${TaxHelpers.formatDocument(emit.cnpjCpf)}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Inscrição Estadual:</span>
              <span class="info-val mono">${emit.ie || 'Isento / Não inf.'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Endereço:</span>
              <span class="info-val">${[emit.logradouro, emit.numero, emit.complemento].filter(Boolean).join(', ') || '-'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Bairro / Cidade:</span>
              <span class="info-val">${[emit.bairro, emit.municipio, emit.uf].filter(Boolean).join(' - ') || '-'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">CEP / Contato:</span>
              <span class="info-val mono">${TaxHelpers.formatCEP(emit.cep)} ${emit.telefone ? `• ${emit.telefone}` : ''}</span>
            </div>
          </div>
        </div>

        <!-- Destinatário -->
        <div class="party-card">
          <div class="party-header">
            <div class="party-tag">
              <span>👤</span> Destinatário / Comprador
            </div>
            <span class="format-badge">
              ${dest.indIEDest === '1' ? 'Contribuinte ICMS' : (dest.indIEDest === '9' ? 'Não Contribuinte' : 'Cliente')}
            </span>
          </div>

          <div>
            <div class="party-name">${dest.razaoSocial || 'Destinatário não informado / Consumidor Final'}</div>
            ${dest.email ? `<div class="party-fantasy">${dest.email}</div>` : ''}
          </div>

          <div class="info-rows">
            <div class="info-row">
              <span class="info-label">CNPJ / CPF:</span>
              <span class="info-val mono">${TaxHelpers.formatDocument(dest.cnpjCpf)}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Inscrição Estadual:</span>
              <span class="info-val mono">${dest.ie || 'Não informada / Isento'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Endereço:</span>
              <span class="info-val">${[dest.logradouro, dest.numero, dest.complemento].filter(Boolean).join(', ') || '-'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Bairro / Cidade:</span>
              <span class="info-val">${[dest.bairro, dest.municipio, dest.uf].filter(Boolean).join(' - ') || '-'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">CEP / Contato:</span>
              <span class="info-val mono">${TaxHelpers.formatCEP(dest.cep)} ${dest.telefone ? `• ${dest.telefone}` : ''}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Abas de Detalhamento Especializado -->
      <div class="tabs-container">
        <div class="tabs-nav">
          <button class="tab-btn active" data-tab="tab-itens">
            📦 Itens & Mercadorias (${itens.length})
          </button>
          <button class="tab-btn" data-tab="tab-tributos">
            ⚖️ Tributos & Alíquotas Detalhadas
          </button>
          <button class="tab-btn" data-tab="tab-cobranca">
            💳 Cobrança & Faturas (${cobranca.duplicatas?.length || 0})
          </button>
          <button class="tab-btn" data-tab="tab-transporte">
            🚚 Transporte & Carga
          </button>
          <button class="tab-btn" data-tab="tab-adicionais">
            📝 Observações Fiscais
          </button>
          <button class="tab-btn" data-tab="tab-auditoria">
            🔍 Auditoria Contábil Automática (${auditAlerts.length})
          </button>
        </div>

        <div class="tab-content">
          <!-- Aba 1: Itens / Mercadorias -->
          <div class="tab-pane active" id="tab-itens">
            <div class="items-toolbar">
              <div class="search-input-box">
                <span>🔍</span>
                <input type="text" id="itemsSearchInput" placeholder="Filtrar por nome, código, CFOP ou NCM...">
              </div>
              <div style="font-size:0.8rem; color:var(--text-dim)">
                Exibindo <span id="itemsCountDisplay">${itens.length}</span> item(ns)
              </div>
            </div>

            <div class="table-responsive">
              <table class="modern-table" id="itemsTable">
                <thead>
                  <tr>
                    <th style="width:48px;">#</th>
                    <th>Descrição do Item</th>
                    <th>NCM</th>
                    <th>CFOP</th>
                    <th>UN</th>
                    <th style="text-align:right;">Qtd</th>
                    <th style="text-align:right;">Vl. Unitário</th>
                    <th style="text-align:right;">Total Item</th>
                    <th style="text-align:right;">ICMS / CST</th>
                  </tr>
                </thead>
                <tbody id="itemsTableBody">
                  ${renderItemsTableRows(itens)}
                </tbody>
              </table>
            </div>
          </div>

          <!-- Aba 2: Tributos Detalhados -->
          <div class="tab-pane" id="tab-tributos">
            <div style="display:flex; flex-direction:column; gap:20px;">
              <h3 style="font-size:1.05rem; font-weight:700;">Quadro de Apuração Fiscal do Documento</h3>
              <div class="table-responsive">
                <table class="modern-table">
                  <thead>
                    <tr>
                      <th>Tributo / Esfera</th>
                      <th>Base de Cálculo</th>
                      <th>Alíquota Média</th>
                      <th>Valor Apurado</th>
                      <th>Classificação / Observações</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>ICMS Próprio</strong> (Estadual)</td>
                      <td style="font-family:var(--font-mono)">${TaxHelpers.formatCurrency(totais.vBC)}</td>
                      <td>${totais.vBC > 0 ? TaxHelpers.formatPercent((totais.vICMS / totais.vBC) * 100) : '-'}</td>
                      <td style="font-family:var(--font-mono); font-weight:700; color:#818cf8">${TaxHelpers.formatCurrency(totais.vICMS)}</td>
                      <td>Operação padrão tributada</td>
                    </tr>
                    <tr>
                      <td><strong>ICMS Substituição Tributária (ST)</strong></td>
                      <td style="font-family:var(--font-mono)">${TaxHelpers.formatCurrency(totais.vBCST)}</td>
                      <td>-</td>
                      <td style="font-family:var(--font-mono); font-weight:700;">${TaxHelpers.formatCurrency(totais.vST)}</td>
                      <td>Retenção na fonte cadeia posterior</td>
                    </tr>
                    <tr>
                      <td><strong>IPI - Imposto sobre Prod. Industrializados</strong></td>
                      <td style="font-family:var(--font-mono)">${TaxHelpers.formatCurrency(totais.vProd)}</td>
                      <td>-</td>
                      <td style="font-family:var(--font-mono); font-weight:700;">${TaxHelpers.formatCurrency(totais.vIPI)}</td>
                      <td>Incidência em produção ou importação</td>
                    </tr>
                    <tr>
                      <td><strong>PIS - Prog. Integração Social</strong></td>
                      <td style="font-family:var(--font-mono)">${TaxHelpers.formatCurrency(totais.vProd)}</td>
                      <td>${totais.vProd > 0 ? TaxHelpers.formatPercent((totais.vPIS / totais.vProd) * 100) : '-'}</td>
                      <td style="font-family:var(--font-mono); font-weight:700;">${TaxHelpers.formatCurrency(totais.vPIS)}</td>
                      <td>Federal Faturamento</td>
                    </tr>
                    <tr>
                      <td><strong>COFINS - Financ. Seguridade Social</strong></td>
                      <td style="font-family:var(--font-mono)">${TaxHelpers.formatCurrency(totais.vProd)}</td>
                      <td>${totais.vProd > 0 ? TaxHelpers.formatPercent((totais.vCOFINS / totais.vProd) * 100) : '-'}</td>
                      <td style="font-family:var(--font-mono); font-weight:700;">${TaxHelpers.formatCurrency(totais.vCOFINS)}</td>
                      <td>Federal Faturamento</td>
                    </tr>
                    ${totais.vISS ? `
                    <tr>
                      <td><strong>ISSQN (Serviços)</strong></td>
                      <td style="font-family:var(--font-mono)">${TaxHelpers.formatCurrency(totais.vProd)}</td>
                      <td>-</td>
                      <td style="font-family:var(--font-mono); font-weight:700;">${TaxHelpers.formatCurrency(totais.vISS)}</td>
                      <td>Competência Municipal</td>
                    </tr>` : ''}
                    <tr style="background:var(--bg-surface-elevated); font-weight:700;">
                      <td>TOTAL TRIBUTOS ESTIMADOS</td>
                      <td>-</td>
                      <td>${TaxHelpers.formatPercent(percentTributos)}</td>
                      <td style="font-family:var(--font-mono); color:#34d399; font-size:1.05rem;">${TaxHelpers.formatCurrency(somaTributos)}</td>
                      <td>Soma das alíquotas apuradas no documento</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- Aba 3: Cobrança e Faturas -->
          <div class="tab-pane" id="tab-cobranca">
            <div style="display:flex; flex-direction:column; gap:20px;">
              <h3 style="font-size:1.05rem; font-weight:700;">Condições Comerciais e Parcelas</h3>
              
              ${cobranca.fatura ? `
              <div style="background:var(--bg-surface); padding:16px; border-radius:var(--radius-md); border:1px solid var(--border-subtle); display:flex; gap:24px; flex-wrap:wrap;">
                <div><strong>Fatura:</strong> Nº ${cobranca.fatura.nFat || '-'}</div>
                <div><strong>Valor Original:</strong> ${TaxHelpers.formatCurrency(cobranca.fatura.vOrig)}</div>
                <div><strong>Desconto Comercial:</strong> ${TaxHelpers.formatCurrency(cobranca.fatura.vDesc)}</div>
                <div><strong>Valor Líquido Faturado:</strong> <strong style="color:#818cf8">${TaxHelpers.formatCurrency(cobranca.fatura.vLiq)}</strong></div>
              </div>` : ''}

              ${cobranca.duplicatas && cobranca.duplicatas.length > 0 ? `
              <div class="table-responsive">
                <table class="modern-table">
                  <thead>
                    <tr>
                      <th>Parcela / Duplicata</th>
                      <th>Data de Vencimento</th>
                      <th style="text-align:right;">Valor da Duplicata</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${cobranca.duplicatas.map(dup => `
                      <tr>
                        <td><strong>Duplicata Nº ${dup.nDup || '-'}</strong></td>
                        <td>${TaxHelpers.formatDate(dup.dVenc)}</td>
                        <td style="text-align:right; font-family:var(--font-mono); font-weight:700;">${TaxHelpers.formatCurrency(dup.vDup)}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>` : `<p style="color:var(--text-muted)">Nenhuma duplicata a prazo informada. Pagamento à vista ou direto no caixa.</p>`}
            </div>
          </div>

          <!-- Aba 4: Transporte -->
          <div class="tab-pane" id="tab-transporte">
            <div style="display:flex; flex-direction:column; gap:20px;">
              <div style="background:var(--bg-surface); padding:16px; border-radius:var(--radius-md); border:1px solid var(--border-subtle);">
                <strong>Modalidade de Frete:</strong> ${TaxHelpers.modFreteDescriptions[transporte.modFrete] || 'Não especificada'}
              </div>

              ${transporte.transportadora ? `
              <div class="party-card">
                <h4 style="font-weight:700; margin-bottom:12px;">Dados da Transportadora</h4>
                <div class="info-rows">
                  <div class="info-row">
                    <span class="info-label">Nome / Razão:</span>
                    <span class="info-val">${transporte.transportadora.xNome || '-'}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">CNPJ / CPF:</span>
                    <span class="info-val mono">${TaxHelpers.formatDocument(transporte.transportadora.cnpjCpf)}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Inscrição Estadual:</span>
                    <span class="info-val mono">${transporte.transportadora.ie || '-'}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Município / UF:</span>
                    <span class="info-val">${transporte.transportadora.xMun || '-'} / ${transporte.transportadora.uf || '-'}</span>
                  </div>
                </div>
              </div>` : '<p style="color:var(--text-muted)">Sem registro de transportadora terceira.</p>'}

              ${transporte.volume ? `
              <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:12px;">
                <div class="kpi-card">
                  <span class="kpi-title">Volumes</span>
                  <span class="kpi-value">${transporte.volume.qVol || '0'}</span>
                  <span class="kpi-subtext">${transporte.volume.esp || 'Espécie'}</span>
                </div>
                <div class="kpi-card">
                  <span class="kpi-title">Peso Líquido</span>
                  <span class="kpi-value">${TaxHelpers.formatQuantity(transporte.volume.pesoL)} kg</span>
                </div>
                <div class="kpi-card">
                  <span class="kpi-title">Peso Bruto</span>
                  <span class="kpi-value">${TaxHelpers.formatQuantity(transporte.volume.pesoB)} kg</span>
                </div>
              </div>` : ''}
            </div>
          </div>

          <!-- Aba 5: Informações Adicionais -->
          <div class="tab-pane" id="tab-adicionais">
            <div style="display:flex; flex-direction:column; gap:16px;">
              ${data.infoAdicional?.infAdFisco ? `
              <div style="background:var(--bg-surface); padding:18px; border-radius:var(--radius-md); border:1px solid var(--border-subtle);">
                <h4 style="font-weight:700; color:#818cf8; margin-bottom:8px;">Informações Adicionais de Interesse do Fisco</h4>
                <p style="font-size:0.9rem; line-height:1.6; color:var(--text-main); font-family:var(--font-mono); white-space:pre-wrap;">${data.infoAdicional.infAdFisco}</p>
              </div>` : ''}

              <div style="background:var(--bg-surface); padding:18px; border-radius:var(--radius-md); border:1px solid var(--border-subtle);">
                <h4 style="font-weight:700; color:#34d399; margin-bottom:8px;">Informações Complementares do Contribuinte</h4>
                <p style="font-size:0.9rem; line-height:1.6; color:var(--text-main); font-family:var(--font-mono); white-space:pre-wrap;">${data.infoAdicional?.infCpl || 'Nenhuma informação complementar adicional inserida pelo emitente.'}</p>
              </div>
            </div>
          </div>

          <!-- Aba 6: Auditoria Contábil -->
          <div class="tab-pane" id="tab-auditoria">
            <div class="audit-cards-grid">
              ${auditAlerts.map(alert => `
                <div class="audit-card ${alert.type}">
                  <span class="audit-icon">${alert.type === 'success' ? '✅' : (alert.type === 'warning' ? '⚠️' : 'ℹ️')}</span>
                  <div>
                    <div class="audit-title">${alert.title}</div>
                    <div class="audit-desc">${alert.desc}</div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;

    // Conecta ouvintes dinâmicos das abas e botões da nota
    attachNFeDynamicEvents(data);
  }

  // Gera linhas HTML para a tabela de itens
  function renderItemsTableRows(itens, filterText = '') {
    const query = filterText.toLowerCase().trim();
    const filtered = query 
      ? itens.filter(it => 
          (it.xProd && it.xProd.toLowerCase().includes(query)) ||
          (it.cProd && it.cProd.toLowerCase().includes(query)) ||
          (it.cfop && it.cfop.includes(query)) ||
          (it.ncm && it.ncm.includes(query))
        )
      : itens;

    if (filtered.length === 0) {
      return `<tr><td colspan="9" style="text-align:center; padding:30px; color:var(--text-dim)">Nenhum produto encontrado com o filtro "${filterText}".</td></tr>`;
    }

    return filtered.map(item => {
      const cfopDesc = TaxHelpers.cfopDescriptions[item.cfop] || 'CFOP de Operação Fiscal';
      const cst = item.icms?.cst || item.icms?.csosn || '00';
      const cstDesc = TaxHelpers.cstIcmsDescriptions[cst] || TaxHelpers.csosnDescriptions[cst] || 'Tributação do ICMS';

      return `
        <tr>
          <td style="color:var(--text-dim); font-family:var(--font-mono)">${item.nItem}</td>
          <td>
            <div class="item-desc-cell">
              <span class="item-name">${item.xProd || 'Mercadoria'}</span>
              <span class="item-code">Cód: ${item.cProd || '-'} ${item.cEAN ? `| EAN: ${item.cEAN}` : ''}</span>
            </div>
          </td>
          <td style="font-family:var(--font-mono); color:var(--text-muted)">${item.ncm || '-'}</td>
          <td>
            <span class="tag-cfop" title="${cfopDesc}">${item.cfop || '-'}</span>
          </td>
          <td style="color:var(--text-muted)">${item.uCom || 'UN'}</td>
          <td style="text-align:right; font-family:var(--font-mono)">${TaxHelpers.formatQuantity(item.qCom)}</td>
          <td style="text-align:right; font-family:var(--font-mono)">${TaxHelpers.formatCurrency(item.vUnCom)}</td>
          <td style="text-align:right; font-family:var(--font-mono); font-weight:700; color:#818cf8">${TaxHelpers.formatCurrency(item.vProd)}</td>
          <td style="text-align:right;">
            <span class="tag-cst" title="${cstDesc}">CST ${cst}</span>
            ${item.icms?.vICMS > 0 ? `<div style="font-size:0.75rem; color:#34d399; font-family:var(--font-mono)">${TaxHelpers.formatCurrency(item.icms.vICMS)} (${TaxHelpers.formatPercent(item.icms.pICMS)})</div>` : ''}
          </td>
        </tr>
      `;
    }).join('');
  }

  // Anexa eventos aos elementos gerados no resultado da nota
  function attachNFeDynamicEvents(data) {
    // 1. Troca de Abas
    const tabButtons = nfResultsArea.querySelectorAll('.tab-btn');
    const tabPanes = nfResultsArea.querySelectorAll('.tab-pane');

    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        tabButtons.forEach(b => b.classList.remove('active'));
        tabPanes.forEach(p => p.classList.remove('active'));

        btn.classList.add('active');
        const targetId = btn.getAttribute('data-tab');
        const targetPane = document.getElementById(targetId);
        if (targetPane) targetPane.classList.add('active');
      });
    });

    // 2. Filtro de Busca em Itens
    const searchInput = document.getElementById('itemsSearchInput');
    const itemsTableBody = document.getElementById('itemsTableBody');
    const itemsCountDisplay = document.getElementById('itemsCountDisplay');

    if (searchInput && itemsTableBody) {
      searchInput.addEventListener('input', (e) => {
        const val = e.target.value;
        itemsTableBody.innerHTML = renderItemsTableRows(data.itens || [], val);
        if (itemsCountDisplay) {
          const count = itemsTableBody.querySelectorAll('tr').length;
          itemsCountDisplay.textContent = count;
        }
      });
    }

    // 3. Copiar Chave de Acesso
    const btnCopiarChave = document.getElementById('btnCopiarChave');
    if (btnCopiarChave) {
      btnCopiarChave.addEventListener('click', () => {
        ExportUtils.copyToClipboard(data.chaveAcesso, () => {
          showToast('Chave de Acesso copiada para a área de transferência!', 'success');
        });
      });
    }

    // 4. Exportar CSV / Excel
    const btnExportCSV = document.getElementById('btnExportCSV');
    if (btnExportCSV) {
      btnExportCSV.addEventListener('click', () => {
        ExportUtils.exportItemsToCSV(data);
        showToast('Planilha com os itens gerada e pronta para download!', 'success');
      });
    }

    // 5. Exportar JSON
    const btnExportJSON = document.getElementById('btnExportJSON');
    if (btnExportJSON) {
      btnExportJSON.addEventListener('click', () => {
        ExportUtils.exportToJSON(data);
        showToast('Arquivo JSON com os campos da nota exportado!', 'success');
      });
    }

    // 6. Imprimir
    const btnPrintReport = document.getElementById('btnPrintReport');
    if (btnPrintReport) {
      btnPrintReport.addEventListener('click', () => {
        ExportUtils.printReport();
      });
    }

    // 7. Nova Leitura (Limpa resultado e volta para topo)
    const btnNovaLeitura = document.getElementById('btnNovaLeitura');
    if (btnNovaLeitura) {
      btnNovaLeitura.addEventListener('click', () => {
        nfResultsArea.style.display = 'none';
        nfResultsArea.innerHTML = '';
        state.currentNFe = null;
        window.scrollTo({ top: 0, behavior: 'smooth' });
        if (fileInput) fileInput.value = '';
      });
    }
  }

});
