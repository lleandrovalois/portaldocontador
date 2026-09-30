/**
 * Portal do Contador - Módulo de Escrituração Fiscal e SPED
 * Versão 2.0: Interface Reestruturada em Abas, Alimentação por Upload de Lotes XML,
 * Lançamento Manual, Apuração Interativa, Auditoria Pré-PVA e Exportação SPED.
 */

(function () {
  // Chave do localStorage para persistência autônoma no navegador
  const STORAGE_KEY = 'portal_contador_fiscal_store_v2';

  // Estado Geral da Escrituração
  const state = {
    tenantId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    activeTab: 'tab-dashboard', // 'tab-dashboard', 'tab-documentos', 'tab-auditoria', 'tab-sped', 'tab-depara'
    empresaSelecionada: null,
    anoMes: '2026-01',
    empresas: [],
    documentos: [],
    participantes: [],
    produtos: [],
    regrasDePara: [],
    apuracao: null,
    auditoria: null,
    serverOnline: false,
    filtroOperacao: 'TODOS',
    termoBusca: '',
    apiBase: 'http://localhost:3001/api/v1'
  };

  // Empresas Padrão Iniciais
  const defaultEmpresas = [
    {
      id: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22',
      tenant_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      razao_social: 'Comércio Distribuidor Paulistano Ltda',
      nome_fantasia: 'Distribuidora Paulistano',
      cnpj: '28192837000109',
      inscricao_estadual: '112233445566',
      codigo_municipio_ibge: '3550308',
      uf: 'SP',
      regime_tributario: 'LUCRO_REAL',
      perfil_sped: 'A'
    },
    {
      id: 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380c33',
      tenant_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      razao_social: 'Varejo Bom Preço Alimentos Eireli',
      nome_fantasia: 'Supermercado Bom Preço',
      cnpj: '98765432000188',
      inscricao_estadual: '998877665544',
      codigo_municipio_ibge: '3550308',
      uf: 'SP',
      regime_tributario: 'LUCRO_PRESUMIDO',
      perfil_sped: 'A'
    },
    {
      id: 'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380d44',
      tenant_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      razao_social: 'Padaria & Confeitaria Sabor Ltda ME',
      nome_fantasia: 'Sabor da Vila',
      cnpj: '44556677000122',
      inscricao_estadual: '334455667788',
      codigo_municipio_ibge: '3550308',
      uf: 'SP',
      regime_tributario: 'SIMPLES_NACIONAL',
      perfil_sped: 'B'
    }
  ];

  // Documentos Iniciais de Demonstração
  const defaultDocs = [
    {
      id: 'doc-saida-01',
      numero: 10420,
      serie: '1',
      modelo: '55',
      chave_acesso: '35260128192837000109550010000104201000104204',
      tipo_operacao: 'SAIDA',
      tipo_emissao: 'PROPRIA',
      situacao_documento: '00',
      data_emissao: '2026-01-12',
      natureza_operacao: 'Venda de Produção do Estabelecimento',
      participante_codigo: 'CLI001',
      participante_nome: 'Supermercados Estrela do Sul Ltda',
      valor_total_documento: 12500.00,
      totais: {
        valor_produtos: 12500.00,
        valor_desconto: 0.00,
        valor_frete: 0.00,
        valor_seguro: 0.00,
        valor_outras_despesas: 0.00,
        valor_total_documento: 12500.00,
        valor_bc_icms: 12500.00,
        valor_icms: 2250.00,
        valor_pis: 206.25,
        valor_cofins: 950.00
      },
      itens: [
        {
          numero_item: 1,
          codigo_item: 'PROD001',
          descricao: 'Solvente Industrial Alifático 20L',
          ncm: '29011000',
          unidade_medida: 'UN',
          quantidade_comercial: 50,
          valor_unitario: 250.00,
          valor_bruto: 12500.00,
          valor_desconto: 0,
          cfop_origem: '5102',
          cfop_escriturado: '5102',
          cst_icms: '00',
          valor_bc_icms: 12500.00,
          aliquota_icms: 18.00,
          valor_icms: 2250.00,
          cst_pis: '01',
          valor_bc_pis: 12500.00,
          aliquota_pis: 1.65,
          valor_pis: 206.25,
          cst_cofins: '01',
          valor_bc_cofins: 12500.00,
          aliquota_cofins: 7.60,
          valor_cofins: 950.00
        }
      ]
    },
    {
      id: 'doc-entrada-01',
      numero: 8840,
      serie: '1',
      modelo: '55',
      chave_acesso: '35260101234567000189550010000088401000008842',
      tipo_operacao: 'ENTRADA',
      tipo_emissao: 'TERCEIROS',
      situacao_documento: '00',
      data_emissao: '2026-01-08',
      natureza_operacao: 'Compra de Insumo Industrial',
      participante_codigo: 'FORN001',
      participante_nome: 'Indústria Química Nacional S.A.',
      valor_total_documento: 6000.00,
      totais: {
        valor_produtos: 6000.00,
        valor_desconto: 0.00,
        valor_frete: 0.00,
        valor_seguro: 0.00,
        valor_outras_despesas: 0.00,
        valor_total_documento: 6000.00,
        valor_bc_icms: 6000.00,
        valor_icms: 1080.00,
        valor_pis: 99.00,
        valor_cofins: 456.00
      },
      itens: [
        {
          numero_item: 1,
          codigo_item: 'PROD002',
          descricao: 'Resina Termoplástica Especial 50kg',
          ncm: '39011010',
          unidade_medida: 'SC',
          quantidade_comercial: 40,
          valor_unitario: 150.00,
          valor_bruto: 6000.00,
          valor_desconto: 0,
          destinacao_item: 'INSUMO',
          credita_icms: true,
          credita_pis_cofins: true,
          cfop_origem: '5101',
          cfop_escriturado: '1101',
          cst_icms: '00',
          valor_bc_icms: 6000.00,
          aliquota_icms: 18.00,
          valor_icms: 1080.00,
          cst_pis: '50',
          valor_bc_pis: 6000.00,
          aliquota_pis: 1.65,
          valor_pis: 99.00,
          cst_cofins: '50',
          valor_bc_cofins: 6000.00,
          aliquota_cofins: 7.60,
          valor_cofins: 456.00
        }
      ]
    },
    {
      id: 'doc-entrada-02',
      numero: 5510,
      serie: '1',
      modelo: '55',
      chave_acesso: '35260101234567000189550010000055101000005517',
      tipo_operacao: 'ENTRADA',
      tipo_emissao: 'TERCEIROS',
      situacao_documento: '00',
      data_emissao: '2026-01-20',
      natureza_operacao: 'Compra de Material para Escritório',
      participante_codigo: 'FORN001',
      participante_nome: 'Indústria Química Nacional S.A.',
      valor_total_documento: 800.00,
      totais: {
        valor_produtos: 800.00,
        valor_desconto: 0.00,
        valor_frete: 0.00,
        valor_seguro: 0.00,
        valor_outras_despesas: 0.00,
        valor_total_documento: 800.00,
        valor_bc_icms: 0.00,
        valor_icms: 0.00,
        valor_pis: 0.00,
        valor_cofins: 0.00
      },
      itens: [
        {
          numero_item: 1,
          codigo_item: 'PROD_CONS',
          descricao: 'Material de Limpeza e Papelaria Diversos',
          ncm: '48025610',
          unidade_medida: 'UN',
          quantidade_comercial: 1,
          valor_unitario: 800.00,
          valor_bruto: 800.00,
          valor_desconto: 0,
          destinacao_item: 'USO_CONSUMO',
          credita_icms: false,
          credita_pis_cofins: false,
          cfop_origem: '5102',
          cfop_escriturado: '1556',
          cst_icms: '90',
          valor_bc_icms: 0.00,
          aliquota_icms: 0.00,
          valor_icms: 0.00,
          cst_pis: '70',
          valor_bc_pis: 0.00,
          aliquota_pis: 0.00,
          valor_pis: 0.00,
          cst_cofins: '70',
          valor_bc_cofins: 0.00,
          aliquota_cofins: 0.00,
          valor_cofins: 0.00
        }
      ]
    }
  ];

  // 1. Inicialização do Módulo
  function init() {
    loadFromLocalStorage();
    setupSidebarNavigation();
    checarStatusBackend();
  }

  function loadFromLocalStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        state.empresas = parsed.empresas && parsed.empresas.length > 0 ? parsed.empresas : defaultEmpresas;
        state.documentos = parsed.documentos && parsed.documentos.length > 0 ? parsed.documentos : defaultDocs;
        state.anoMes = parsed.anoMes || '2026-01';
        state.empresaSelecionada = state.empresas.find(e => e.id === parsed.selectedEmpresaId) || state.empresas[0];
      } else {
        state.empresas = [...defaultEmpresas];
        state.documentos = [...defaultDocs];
        state.empresaSelecionada = state.empresas[0];
      }
    } catch (e) {
      console.warn('Erro ao carregar do localStorage:', e);
      state.empresas = [...defaultEmpresas];
      state.documentos = [...defaultDocs];
      state.empresaSelecionada = state.empresas[0];
    }

    state.participantes = [
      { codigo_participante: 'CLI001', nome: 'Supermercados Estrela do Sul Ltda', cnpj_cpf: '55667788000144', uf: 'SP', codigo_municipio_ibge: '3550308', inscricao_estadual: '456789012345' },
      { codigo_participante: 'FORN001', nome: 'Indústria Química Nacional S.A.', cnpj_cpf: '01234567000189', uf: 'SP', codigo_municipio_ibge: '3550308', inscricao_estadual: '123456789012' }
    ];
    state.produtos = [
      { codigo_item: 'PROD001', descricao: 'Solvente Industrial Alifático 20L', unidade_medida: 'UN', tipo_item: '00', ncm: '29011000' },
      { codigo_item: 'PROD002', descricao: 'Resina Termoplástica Especial 50kg', unidade_medida: 'SC', tipo_item: '01', ncm: '39011010' },
      { codigo_item: 'PROD_CONS', descricao: 'Material de Limpeza e Papelaria Diversos', unidade_medida: 'UN', tipo_item: '07', ncm: '48025610' }
    ];
  }

  function saveToLocalStorage() {
    try {
      const payload = {
        empresas: state.empresas,
        documentos: state.documentos,
        selectedEmpresaId: state.empresaSelecionada ? state.empresaSelecionada.id : null,
        anoMes: state.anoMes
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      console.warn('Erro ao salvar no localStorage:', e);
    }
  }

  async function checarStatusBackend() {
    try {
      const res = await fetch(`${state.apiBase}/health`, { signal: AbortSignal.timeout(1200) });
      if (res.ok) {
        state.serverOnline = true;
      }
    } catch (e) {
      state.serverOnline = false;
    }
  }

  function setupSidebarNavigation() {
    const navInterpreter = document.getElementById('navItemInterpreter');
    const navEscrituracao = document.getElementById('navItemEscrituracao');
    const interpretadorView = document.getElementById('interpretadorViewArea');
    const escrituracaoView = document.getElementById('escrituracaoViewArea');

    if (navEscrituracao) {
      navEscrituracao.addEventListener('click', () => {
        document.querySelectorAll('.sidebar-nav .nav-item').forEach(el => el.classList.remove('active'));
        navEscrituracao.classList.add('active');

        if (interpretadorView) interpretadorView.style.display = 'none';
        if (escrituracaoView) {
          escrituracaoView.style.display = 'block';
          renderEscrituracaoModule();
        }

        const breadcrumbEl = document.querySelector('.breadcrumb-active');
        if (breadcrumbEl) breadcrumbEl.textContent = 'Módulo de Escrituração Fiscal & SPED';
      });
    }

    if (navInterpreter) {
      navInterpreter.addEventListener('click', () => {
        document.querySelectorAll('.sidebar-nav .nav-item').forEach(el => el.classList.remove('active'));
        navInterpreter.classList.add('active');

        if (escrituracaoView) escrituracaoView.style.display = 'none';
        if (interpretadorView) interpretadorView.style.display = 'block';

        const breadcrumbEl = document.querySelector('.breadcrumb-active');
        if (breadcrumbEl) breadcrumbEl.textContent = 'Interpretador de Notas Fiscais';
      });
    }
  }

  // 2. Renderização Central do Módulo
  function renderEscrituracaoModule() {
    const container = document.getElementById('escrituracaoViewArea');
    if (!container) return;

    calcularApuracao();
    executarAuditoria();

    const emp = state.empresaSelecionada || state.empresas[0];
    const ap = state.apuracao;
    const aud = state.auditoria;

    container.innerHTML = `
      <!-- Workspace Header -->
      <section class="fiscal-header-workspace">
        <div class="workspace-brand">
          <div class="company-avatar">${emp.razao_social.charAt(0)}</div>
          <div class="company-details">
            <div class="company-headline">
              <h2>${emp.nome_fantasia || emp.razao_social}</h2>
              <span class="regime-badge ${emp.regime_tributario.toLowerCase()}">
                ${emp.regime_tributario.replace('_', ' ')}
              </span>
            </div>
            <div class="company-meta-tags">
              <span><strong>CNPJ:</strong> ${formatCnpj(emp.cnpj)}</span>
              <span><strong>IE:</strong> ${emp.inscricao_estadual}</span>
              <span><strong>UF:</strong> ${emp.uf}</span>
              <span><strong>Perfil SPED:</strong> ${emp.perfil_sped}</span>
              <span><strong>Ambiente:</strong> ${state.serverOnline ? '<span class="status-badge online">● API Online</span>' : '<span class="status-badge offline">● Motor Web Local</span>'}</span>
            </div>
          </div>
        </div>

        <div class="workspace-actions">
          <div class="select-field-box">
            <label>Empresa Ativa</label>
            <div class="empresa-select-row">
              <select id="selectEmpresaFiscal" class="form-select-sm">
                ${state.empresas.map(e => `
                  <option value="${e.id}" ${e.id === emp.id ? 'selected' : ''}>
                    ${e.nome_fantasia || e.razao_social} (${e.regime_tributario})
                  </option>
                `).join('')}
              </select>
              <button type="button" class="btn-icon-add" id="btnOpenNovaEmpresaModal" title="Cadastrar Nova Empresa">+</button>
            </div>
          </div>

          <div class="select-field-box">
            <label>Período Fiscal</label>
            <div class="periodo-navigator">
              <button type="button" class="btn-nav-mes" id="btnMesAnterior">◀</button>
              <input type="month" id="inputPeriodoFiscal" value="${state.anoMes}" class="form-input-month" />
              <button type="button" class="btn-nav-mes" id="btnMesPosterior">▶</button>
            </div>
          </div>
        </div>
      </section>

      <!-- Barra de Abas (Sub-Nav Moderna) -->
      <nav class="fiscal-tabs-bar">
        <button type="button" class="tab-btn ${state.activeTab === 'tab-dashboard' ? 'active' : ''}" data-tab="tab-dashboard">
          📊 Visão Geral & Apuração
        </button>
        <button type="button" class="tab-btn ${state.activeTab === 'tab-documentos' ? 'active' : ''}" data-tab="tab-documentos">
          📥 Ingestão & Lançamentos <span class="tab-counter">${state.documentos.length}</span>
        </button>
        <button type="button" class="tab-btn ${state.activeTab === 'tab-auditoria' ? 'active' : ''}" data-tab="tab-auditoria">
          🛡️ Auditoria Pré-PVA ${aud.aprovado_para_pva ? '<span class="tab-badge-ok">✓ 100%</span>' : `<span class="tab-badge-err">${aud.erros_impeditivos}</span>`}
        </button>
        <button type="button" class="tab-btn ${state.activeTab === 'tab-sped' ? 'active' : ''}" data-tab="tab-sped">
          🏛️ Exportador SPED
        </button>
        <button type="button" class="tab-btn ${state.activeTab === 'tab-depara' ? 'active' : ''}" data-tab="tab-depara">
          ⚙️ Regras De-Para
        </button>
      </nav>

      <!-- Conteúdo da Aba 1: Dashboard & Apuração -->
      <div class="tab-content-area ${state.activeTab === 'tab-dashboard' ? 'show' : ''}" id="tab-dashboard">
        ${renderTabDashboard(emp, ap, aud)}
      </div>

      <!-- Conteúdo da Aba 2: Ingestão de Documentos (Alimentar o Sistema) -->
      <div class="tab-content-area ${state.activeTab === 'tab-documentos' ? 'show' : ''}" id="tab-documentos">
        ${renderTabDocumentos(emp)}
      </div>

      <!-- Conteúdo da Aba 3: Auditoria Pré-PVA -->
      <div class="tab-content-area ${state.activeTab === 'tab-auditoria' ? 'show' : ''}" id="tab-auditoria">
        ${renderTabAuditoria(aud)}
      </div>

      <!-- Conteúdo da Aba 4: Exportação SPED -->
      <div class="tab-content-area ${state.activeTab === 'tab-sped' ? 'show' : ''}" id="tab-sped">
        ${renderTabSped(emp, ap)}
      </div>

      <!-- Conteúdo da Aba 5: Regras De-Para -->
      <div class="tab-content-area ${state.activeTab === 'tab-depara' ? 'show' : ''}" id="tab-depara">
        ${renderTabDePara()}
      </div>

      <!-- Modal: Novo Lançamento Manual de Documento -->
      <div class="fiscal-modal-backdrop" id="modalNovoDocumento" style="display:none;">
        <div class="fiscal-modal-box">
          <div class="modal-box-header">
            <h3>📝 Novo Lançamento Manual de Nota Fiscal</h3>
            <button type="button" class="btn-close-box" id="btnCloseNovoDocModal">✕</button>
          </div>
          <form id="formNovoDocumento" class="modal-box-body">
            <div class="form-grid-2">
              <div class="form-group">
                <label>Tipo de Operação</label>
                <select id="docNewTipo" class="form-input" required>
                  <option value="ENTRADA">⬇️ Entrada (Compra / Fornecedor)</option>
                  <option value="SAIDA">⬆️ Saída (Venda / Cliente)</option>
                </select>
              </div>
              <div class="form-group">
                <label>Destinação do Item</label>
                <select id="docNewDestinacao" class="form-input">
                  <option value="REVENDA">Revenda de Mercadorias (com crédito)</option>
                  <option value="INSUMO">Insumo / Matéria-Prima (com crédito)</option>
                  <option value="USO_CONSUMO">Material de Uso e Consumo (sem crédito)</option>
                  <option value="ATIVO_IMOBILIZADO">Ativo Imobilizado (CIAP - Bloco G)</option>
                </select>
              </div>
            </div>

            <div class="form-grid-3">
              <div class="form-group">
                <label>Número da NF</label>
                <input type="number" id="docNewNumero" class="form-input" placeholder="Ex: 10450" required />
              </div>
              <div class="form-group">
                <label>Série</label>
                <input type="text" id="docNewSerie" class="form-input" value="1" required />
              </div>
              <div class="form-group">
                <label>Data de Emissão</label>
                <input type="date" id="docNewData" class="form-input" value="${state.anoMes}-15" required />
              </div>
            </div>

            <div class="form-group">
              <label>Nome do Participante (Cliente ou Fornecedor)</label>
              <input type="text" id="docNewPartNome" class="form-input" placeholder="Razão Social / Nome Fantasia" required />
            </div>

            <div class="form-grid-2">
              <div class="form-group">
                <label>CNPJ / CPF do Participante</label>
                <input type="text" id="docNewPartDoc" class="form-input" placeholder="Apenas números" required />
              </div>
              <div class="form-group">
                <label>UF do Participante</label>
                <select id="docNewPartUf" class="form-input">
                  <option value="SP" selected>SP - São Paulo</option>
                  <option value="RJ">RJ - Rio de Janeiro</option>
                  <option value="MG">MG - Minas Gerais</option>
                  <option value="PR">PR - Paraná</option>
                  <option value="RS">RS - Rio Grande do Sul</option>
                  <option value="SC">SC - Santa Catarina</option>
                  <option value="BA">BA - Bahia</option>
                </select>
              </div>
            </div>

            <div class="form-grid-3">
              <div class="form-group">
                <label>Valor Total dos Produtos (R$)</label>
                <input type="number" step="0.01" id="docNewValorTotal" class="form-input" placeholder="0.00" required />
              </div>
              <div class="form-group">
                <label>CFOP</label>
                <input type="text" id="docNewCfop" class="form-input" placeholder="Ex: 5102 ou 1102" required />
              </div>
              <div class="form-group">
                <label>Alíquota ICMS (%)</label>
                <input type="number" step="0.01" id="docNewAliqIcms" class="form-input" value="18.00" />
              </div>
            </div>

            <div class="modal-box-footer">
              <button type="button" class="btn-secondary" id="btnCancelNovoDoc">Cancelar</button>
              <button type="submit" class="btn-primary">Salvar e Escriturar</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Modal: Cadastrar Nova Empresa / Cliente -->
      <div class="fiscal-modal-backdrop" id="modalNovaEmpresa" style="display:none;">
        <div class="fiscal-modal-box">
          <div class="modal-box-header">
            <h3>🏢 Cadastrar Novo Cliente do Escritório</h3>
            <button type="button" class="btn-close-box" id="btnCloseNovaEmpresaModal">✕</button>
          </div>
          <form id="formNovaEmpresa" class="modal-box-body">
            <div class="form-group">
              <label>Razão Social</label>
              <input type="text" id="empNewRazao" class="form-input" placeholder="Ex: Empresa Modelo Distribuidora Ltda" required />
            </div>
            <div class="form-grid-2">
              <div class="form-group">
                <label>Nome Fantasia</label>
                <input type="text" id="empNewFantasia" class="form-input" placeholder="Ex: Distribuidora Modelo" />
              </div>
              <div class="form-group">
                <label>CNPJ</label>
                <input type="text" id="empNewCnpj" class="form-input" placeholder="14 dígitos" required />
              </div>
            </div>
            <div class="form-grid-3">
              <div class="form-group">
                <label>Inscrição Estadual</label>
                <input type="text" id="empNewIE" class="form-input" placeholder="Somente números" required />
              </div>
              <div class="form-group">
                <label>UF</label>
                <select id="empNewUf" class="form-input">
                  <option value="SP" selected>SP</option>
                  <option value="RJ">RJ</option>
                  <option value="MG">MG</option>
                  <option value="PR">PR</option>
                  <option value="SC">SC</option>
                  <option value="RS">RS</option>
                </select>
              </div>
              <div class="form-group">
                <label>Regime Tributário</label>
                <select id="empNewRegime" class="form-input">
                  <option value="LUCRO_REAL">Lucro Real (Não-Cumulativo)</option>
                  <option value="LUCRO_PRESUMIDO">Lucro Presumido (Cumulativo)</option>
                  <option value="SIMPLES_NACIONAL">Simples Nacional</option>
                </select>
              </div>
            </div>
            <div class="modal-box-footer">
              <button type="button" class="btn-secondary" id="btnCancelNovaEmp">Cancelar</button>
              <button type="submit" class="btn-primary">Criar Empresa</button>
            </div>
          </form>
        </div>
      </div>
    `;

    bindTabEvents();
    bindActionEvents();
  }

  // 3. Renderizadores de Cada Aba

  function renderTabDashboard(emp, ap, aud) {
    return `
      <!-- Cartões Principais de Apuração -->
      <div class="dashboard-cards-grid">
        <!-- Card ICMS -->
        <div class="dash-card icms-card">
          <div class="dash-card-header">
            <span class="tax-badge icms">ICMS Próprio</span>
            <span class="reg-indicator">Registro E110</span>
          </div>
          <div class="dash-card-main-val">R$ ${formatBrl(ap.icms.imposto_a_recolher)}</div>
          <span class="dash-card-sublabel">${ap.icms.saldo_credor_transportar > 0 ? 'Saldo Credor a Transportar' : 'Imposto Líquido a Recolher'}</span>
          
          <div class="tax-breakdown-bar">
            <div class="bar-item debit" style="width: 60%;" title="Débitos pelas Saídas"></div>
            <div class="bar-item credit" style="width: 40%;" title="Créditos pelas Entradas"></div>
          </div>

          <div class="tax-details-row">
            <div><span>Débitos (Saídas):</span><strong>R$ ${formatBrl(ap.icms.total_debitos)}</strong></div>
            <div><span>Créditos (Entradas):</span><strong>R$ ${formatBrl(ap.icms.total_creditos)}</strong></div>
          </div>
          ${ap.icms.saldo_credor_transportar > 0 ? `
            <div class="highlight-credit-pill">💰 Saldo Credor Mês Seguinte: R$ ${formatBrl(ap.icms.saldo_credor_transportar)}</div>
          ` : ''}
        </div>

        <!-- Card PIS -->
        <div class="dash-card pis-card">
          <div class="dash-card-header">
            <span class="tax-badge pis">PIS / PASEP</span>
            <span class="reg-indicator">Registro M200</span>
          </div>
          <div class="dash-card-main-val">R$ ${formatBrl(ap.pis.imposto_a_recolher)}</div>
          <span class="dash-card-sublabel">Alíquota: ${ap.pis.aliquota_aplicada}% (${ap.pis.regime})</span>
          
          <div class="tax-details-row">
            <div><span>Débitos:</span><strong>R$ ${formatBrl(ap.pis.total_debitos)}</strong></div>
            <div><span>Créditos Insumos:</span><strong>R$ ${formatBrl(ap.pis.total_creditos)}</strong></div>
          </div>

          ${ap.pis.total_icms_excluido_tema69 > 0 ? `
            <div class="highlight-tema69-pill">
              ⚖️ <strong>Tema 69 STF:</strong> -R$ ${formatBrl(ap.pis.total_icms_excluido_tema69)} ICMS abatido da base
            </div>
          ` : ''}
        </div>

        <!-- Card COFINS -->
        <div class="dash-card cofins-card">
          <div class="dash-card-header">
            <span class="tax-badge cofins">COFINS</span>
            <span class="reg-indicator">Registro M600</span>
          </div>
          <div class="dash-card-main-val">R$ ${formatBrl(ap.cofins.imposto_a_recolher)}</div>
          <span class="dash-card-sublabel">Alíquota: ${ap.cofins.aliquota_aplicada}% (${ap.pis.regime})</span>

          <div class="tax-details-row">
            <div><span>Débitos:</span><strong>R$ ${formatBrl(ap.cofins.total_debitos)}</strong></div>
            <div><span>Créditos Insumos:</span><strong>R$ ${formatBrl(ap.cofins.total_creditos)}</strong></div>
          </div>
        </div>

        <!-- Card Auditoria Rápida -->
        <div class="dash-card audit-summary-card ${aud.aprovado_para_pva ? 'audit-pass' : 'audit-warn'}">
          <div class="dash-card-header">
            <span class="tax-badge audit">Auditoria PVA</span>
            <span class="reg-indicator">Guia EFD v3.1.6</span>
          </div>
          <div class="audit-score-gauge">
            <div class="score-circle ${aud.aprovado_para_pva ? 'perfect' : 'warning'}">
              ${aud.aprovado_para_pva ? '100%' : '80%'}
            </div>
            <div class="score-text">
              <h4>${aud.aprovado_para_pva ? 'Pronto para o PVA' : 'Requer Atenção'}</h4>
              <p>${aud.erros_impeditivos} erros impeditivos encontrados</p>
            </div>
          </div>
          <button type="button" class="btn-dash-action" id="btnGoAuditTab">
            Inspecionar 10 Regras →
          </button>
        </div>
      </div>

      <!-- Resumo Rápido da Movimentação -->
      <div class="dashboard-secondary-grid">
        <div class="summary-box">
          <h4>📌 Resumo Executivo da Escrituração</h4>
          <div class="summary-list">
            <div class="summary-item">
              <span>Notas de Saída Faturadas:</span>
              <strong>${state.documentos.filter(d => d.tipo_operacao === 'SAIDA').length} notas (R$ ${formatBrl(state.documentos.filter(d => d.tipo_operacao === 'SAIDA').reduce((s, d) => s + d.valor_total_documento, 0))})</strong>
            </div>
            <div class="summary-item">
              <span>Notas de Entrada Escrituradas:</span>
              <strong>${state.documentos.filter(d => d.tipo_operacao === 'ENTRADA').length} notas (R$ ${formatBrl(state.documentos.filter(d => d.tipo_operacao === 'ENTRADA').reduce((s, d) => s + d.valor_total_documento, 0))})</strong>
            </div>
            <div class="summary-item">
              <span>Créditos Tributários Apropriados:</span>
              <strong style="color:var(--accent-emerald)">R$ ${formatBrl(ap.icms.total_creditos)} de ICMS + R$ ${formatBrl(ap.pis.total_creditos + ap.cofins.total_creditos)} de PIS/COFINS</strong>
            </div>
          </div>
        </div>

        <div class="quick-feed-box">
          <h4>🚀 Como Alimentar Novos Dados?</h4>
          <p>Você pode alimentar o sistema de 3 formas:</p>
          <div class="feed-options-row">
            <button type="button" class="feed-btn" id="btnFeedXml">
              📂 Arrastar e Soltar XMLs
            </button>
            <button type="button" class="feed-btn secondary" id="btnFeedManual">
              ➕ Lançar Nota Avulsa
            </button>
          </div>
        </div>
      </div>
    `;
  }

  function renderTabDocumentos(emp) {
    const docsFiltrados = state.documentos.filter(d => {
      if (state.filtroOperacao !== 'TODOS' && d.tipo_operacao !== state.filtroOperacao) return false;
      if (state.termoBusca) {
        const termo = state.termoBusca.toLowerCase();
        const numStr = String(d.numero);
        const partStr = (d.participante_nome || '').toLowerCase();
        const chvStr = (d.chave_acesso || '').toLowerCase();
        return numStr.includes(termo) || partStr.includes(termo) || chvStr.includes(termo);
      }
      return true;
    });

    return `
      <!-- Zona de Ingestão de XMLs em Lote -->
      <section class="ingestion-dropzone-card" id="fiscalDropZoneCard">
        <input type="file" id="fiscalBatchFileInput" multiple accept=".xml" style="display:none;" />
        <div class="dropzone-content">
          <div class="drop-icon">📥</div>
          <div class="drop-text">
            <h3>Solte aqui seus XMLs de Notas Fiscais (NF-e, CT-e, NFS-e)</h3>
            <p>Selecione um ou múltiplos arquivos para importar instantaneamente com resolução De-Para automática.</p>
          </div>
          <div class="dropzone-options">
            <label>Destinação Padrão:</label>
            <select id="selectDestinacaoBatch" class="form-select-sm">
              <option value="REVENDA">Revenda de Mercadorias</option>
              <option value="INSUMO">Insumos Industriais</option>
              <option value="USO_CONSUMO">Uso e Consumo</option>
              <option value="ATIVO_IMOBILIZADO">Ativo Imobilizado</option>
            </select>
            <button type="button" class="btn-primary" id="btnBrowseXmlBatch">
              Selecionar XMLs do PC
            </button>
          </div>
        </div>
      </section>

      <!-- Barra de Controle da Tabela de Documentos -->
      <div class="docs-table-toolbar">
        <div class="toolbar-left">
          <div class="filter-pills-group">
            <button type="button" class="filter-pill ${state.filtroOperacao === 'TODOS' ? 'active' : ''}" data-filter="TODOS">
              Todos (${state.documentos.length})
            </button>
            <button type="button" class="filter-pill ${state.filtroOperacao === 'SAIDA' ? 'active' : ''}" data-filter="SAIDA">
              Saídas / Vendas (${state.documentos.filter(d => d.tipo_operacao === 'SAIDA').length})
            </button>
            <button type="button" class="filter-pill ${state.filtroOperacao === 'ENTRADA' ? 'active' : ''}" data-filter="ENTRADA">
              Entradas / Compras (${state.documentos.filter(d => d.tipo_operacao === 'ENTRADA').length})
            </button>
          </div>

          <div class="search-input-box">
            <input type="text" id="inputBuscaDoc" placeholder="Buscar por número, participante ou chave..." value="${state.termoBusca}" />
          </div>
        </div>

        <div class="toolbar-right">
          <button type="button" class="btn-primary" id="btnOpenNovoDocModal">
            ➕ Novo Lançamento Manual
          </button>
          <button type="button" class="btn-secondary" id="btnLimparDocumentos" title="Limpar documentos desta empresa">
            🗑️ Limpar Lote
          </button>
        </div>
      </div>

      <!-- Tabela Reativa de Documentos -->
      <div class="fiscal-table-container">
        <table class="fiscal-modern-table">
          <thead>
            <tr>
              <th>Operação</th>
              <th>Documento</th>
              <th>Emissão</th>
              <th>Participante</th>
              <th>Valor Total</th>
              <th>CFOP Escrit.</th>
              <th>CST ICMS</th>
              <th>ICMS Próprio</th>
              <th>PIS / COFINS</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            ${docsFiltrados.length === 0 ? `
              <tr>
                <td colspan="10" class="empty-table-cell">
                  Nenhum documento fiscal encontrado com os filtros selecionados.
                  Arraste arquivos XML acima ou faça um lançamento manual.
                </td>
              </tr>
            ` : docsFiltrados.map(d => {
              const item1 = d.itens?.[0] || {};
              const isSaida = d.tipo_operacao === 'SAIDA';
              return `
                <tr>
                  <td>
                    <span class="badge-op-tag ${isSaida ? 'saida' : 'entrada'}">
                      ${isSaida ? '⬆️ SAÍDA' : '⬇️ ENTRADA'}
                    </span>
                  </td>
                  <td>
                    <strong>NF-e ${d.numero}</strong><br>
                    <small style="color:var(--text-dim)">Série ${d.serie} • Mod ${d.modelo || '55'}</small>
                  </td>
                  <td>${formatDateBr(d.data_emissao)}</td>
                  <td>
                    <span class="part-name-cell" title="${d.participante_nome}">${d.participante_nome || 'Cliente / Fornecedor'}</span><br>
                    <small style="color:var(--text-dim)">Cód: ${d.participante_codigo || '0150'}</small>
                  </td>
                  <td><strong>R$ ${formatBrl(d.valor_total_documento)}</strong></td>
                  <td><span class="pill-code cfop">${item1.cfop_escriturado || item1.cfop_origem || '-'}</span></td>
                  <td><span class="pill-code cst">${item1.cst_icms || '00'}</span></td>
                  <td>R$ ${formatBrl(item1.valor_icms || d.totais?.valor_icms || 0)}</td>
                  <td>
                    <small>PIS: R$ ${formatBrl(item1.valor_pis || d.totais?.valor_pis || 0)}</small><br>
                    <small>COF: R$ ${formatBrl(item1.valor_cofins || d.totais?.valor_cofins || 0)}</small>
                  </td>
                  <td>
                    <button type="button" class="btn-table-del" data-delete-id="${d.id}" title="Excluir Documento">✕</button>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  function renderTabAuditoria(aud) {
    const regrasDef = [
      { id: 'VAL_C100_VS_C170_TOTAL', nome: '1. Total C100 vs. Soma dos Itens C170', desc: 'Conferência de soma de produtos, frete, seguro, IPI e descontos.' },
      { id: 'VAL_C100_VS_C190_ICMS', nome: '2. Amarração C170 vs. Analítico C190', desc: 'Consistência de CST, CFOP e alíquotas agrupadas.' },
      { id: 'VAL_CHAVE_ACESSO_DV', nome: '3. Dígito Verificador da Chave de Acesso', desc: 'Cálculo e conferência algorítmica do Módulo 11 da SEFAZ.' },
      { id: 'VAL_CFOP_TERRITORIALIDADE', nome: '4. Territorialidade de CFOP vs. UFs', desc: 'Cruzamento de UF de emitente e destinatário (interna vs interestadual).' },
      { id: 'VAL_CST_ALIQ_CALC_ICMS', nome: '5. Cálculo de ICMS (Base x Alíquota)', desc: 'Validação de precisão decimal e bloqueio de base em CSTs isentos.' },
      { id: 'VAL_CST_PIS_REGIME_COERENCIA', nome: '6. CST PIS/COFINS vs. Regime Tributário', desc: 'Bloqueio de CSTs de crédito 50-66 no Lucro Presumido (Lei 9.718).' },
      { id: 'VAL_PARTICIPANTE_ORFAO', nome: '7. Participantes Cadastrados (Bloco 0150)', desc: 'Garante que todo cliente/fornecedor exista no cadastro de entidades.' },
      { id: 'VAL_ITEM_ORFAO_NCM_VALIDO', nome: '8. Validade de NCM e Item (Bloco 0200)', desc: 'Conferência de 8 dígitos numéricos válidos da TIPI.' },
      { id: 'VAL_E110_VS_DOCS_CONCILIACAO', nome: '9. Conciliação E110 vs. Documentos', desc: 'Conferência entre o livro de fechamento e as notas fiscais do mês.' },
      { id: 'VAL_TESE_SECULO_ICMS_BASE_PIS', nome: '10. Tese do Século (Tema 69 STF)', desc: 'Alerta sobre oportunidade de exclusão do ICMS na base de PIS/COFINS.' }
    ];

    return `
      <div class="audit-workspace-view">
        <div class="audit-banner-hero ${aud.aprovado_para_pva ? 'hero-pass' : 'hero-warn'}">
          <div class="hero-status-badge">${aud.aprovado_para_pva ? '✅ CONFORME' : '⚠️ ATENÇÃO'}</div>
          <h2>${aud.aprovado_para_pva ? 'Lote Aprovado com Sucesso para Importação no PVA' : 'Identificadas Inconsistências que Impedem a Transmissão'}</h2>
          <p>${aud.aprovado_para_pva ? 'Todos os registros fiscais atendem integralmente aos requisitos do Guia Prático da EFD.' : 'Corrija os pontos listados abaixo para evitar rejeição no PVA da Receita Federal.'}</p>
        </div>

        <div class="audit-checklist-grid">
          ${regrasDef.map(r => {
            const falhou = aud.inconsistencias.some(inc => inc.codigo === r.id);
            return `
              <div class="audit-rule-card ${falhou ? 'fail' : 'pass'}">
                <div class="rule-card-top">
                  <span class="rule-icon-box">${falhou ? '❌' : '✓'}</span>
                  <div class="rule-titles">
                    <h4>${r.nome}</h4>
                    <p>${r.desc}</p>
                  </div>
                </div>
                <div class="rule-card-status">
                  ${falhou ? '<span class="status-pill err">Inconsistente</span>' : '<span class="status-pill ok">Validado</span>'}
                </div>
              </div>
            `;
          }).join('')}
        </div>

        ${aud.inconsistencias.length > 0 ? `
          <div class="audit-issues-panel">
            <h3>Detalhes das Divergências Encontradas (${aud.inconsistencias.length})</h3>
            <div class="issues-list">
              ${aud.inconsistencias.map(inc => `
                <div class="issue-item-row ${inc.tipo.toLowerCase()}">
                  <div class="issue-type-badge">${inc.tipo}</div>
                  <div class="issue-text-col">
                    <strong>[${inc.codigo}] ${inc.documento || ''}</strong>
                    <p>${inc.mensagem}</p>
                    ${inc.chave_acesso ? `<code>Chave: ${inc.chave_acesso}</code>` : ''}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }

  function renderTabSped(emp, ap) {
    return `
      <div class="sped-workspace-view">
        <div class="sped-cards-row">
          <div class="sped-type-box">
            <div class="sped-type-header">
              <span class="sped-badge">EFD ICMS IPI</span>
              <h4>SPED Fiscal Geral</h4>
            </div>
            <p>Escrituração de mercadorias, apuração de ICMS e IPI (Blocos 0, C, D, E e 9).</p>
            <div class="sped-btn-row">
              <button type="button" class="btn-primary" id="btnDownloadEfdIcmsTab">
                📥 Baixar Arquivo .txt
              </button>
              <button type="button" class="btn-secondary" id="btnViewEfdIcmsTab">
                👁️ Ver Linhas
              </button>
            </div>
          </div>

          <div class="sped-type-box">
            <div class="sped-type-header">
              <span class="sped-badge contr">EFD-Contribuições</span>
              <h4>PIS / COFINS</h4>
            </div>
            <p>Escrituração das contribuições não-cumulativas e cumulativas (Blocos 0, A, C, M e 9).</p>
            <div class="sped-btn-row">
              <button type="button" class="btn-primary" id="btnDownloadEfdContrTab">
                📥 Baixar Arquivo .txt
              </button>
              <button type="button" class="btn-secondary" id="btnViewEfdContrTab">
                👁️ Ver Linhas
              </button>
            </div>
          </div>
        </div>

        <!-- Visualizador de Código SPED Embutido -->
        <div class="sped-embedded-viewer-box" id="spedEmbeddedBox" style="display:none;">
          <div class="viewer-top-bar">
            <h4 id="spedViewerTitle">📄 Prévia do Arquivo SPED</h4>
            <div class="viewer-actions">
              <button type="button" class="btn-sm" id="btnCopySpedCode">📋 Copiar Linhas</button>
              <button type="button" class="btn-sm secondary" id="btnCloseSpedViewer">✕ Fechar</button>
            </div>
          </div>
          <pre class="sped-code-block" id="spedEmbeddedCode"></pre>
        </div>
      </div>
    `;
  }

  function renderTabDePara() {
    return `
      <div class="depara-workspace-view">
        <div class="depara-hero-card">
          <div>
            <h3>⚙️ Regras Fiscais de Conversão "De-Para"</h3>
            <p>Configure a amarração de CFOPs e CSTs do fornecedor para a escrituração do seu cliente.</p>
          </div>
        </div>

        <div class="depara-table-box">
          <table class="fiscal-modern-table">
            <thead>
              <tr>
                <th>CFOP Fornecedor (Saída)</th>
                <th>Destinação do Cliente</th>
                <th>CFOP Escriturado (Entrada)</th>
                <th>CST ICMS</th>
                <th>CST PIS/COF</th>
                <th>Apropria Crédito?</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>5.102 / 6.102</code> (Venda mercadoria)</td>
                <td><span class="dest-badge revenda">REVENDA</span></td>
                <td><code>1.102 / 2.102</code></td>
                <td>00</td>
                <td>50</td>
                <td><span class="status-pill ok">Sim (ICMS e PIS/COFINS)</span></td>
              </tr>
              <tr>
                <td><code>5.101 / 6.101</code> (Venda produção)</td>
                <td><span class="dest-badge insumo">INSUMO</span></td>
                <td><code>1.101 / 2.101</code></td>
                <td>00</td>
                <td>50</td>
                <td><span class="status-pill ok">Sim (ICMS e PIS/COFINS)</span></td>
              </tr>
              <tr>
                <td><code>5.405 / 6.403</code> (Venda com ST)</td>
                <td><span class="dest-badge revenda">REVENDA</span></td>
                <td><code>1.403 / 2.403</code></td>
                <td>60</td>
                <td>70</td>
                <td><span class="status-pill err">Sem Crédito Próprio</span></td>
              </tr>
              <tr>
                <td><code>5.102 / 6.102</code> (Venda mercadoria)</td>
                <td><span class="dest-badge consumo">USO_CONSUMO</span></td>
                <td><code>1.556 / 2.556</code></td>
                <td>90</td>
                <td>70</td>
                <td><span class="status-pill err">Sem Crédito (Vedado)</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  // 4. Tratamento de Eventos e Ações Interativas

  function bindTabEvents() {
    document.querySelectorAll('.fiscal-tabs-bar .tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tabId = btn.getAttribute('data-tab');
        state.activeTab = tabId;
        document.querySelectorAll('.fiscal-tabs-bar .tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        document.querySelectorAll('.tab-content-area').forEach(tc => tc.classList.remove('show'));
        const target = document.getElementById(tabId);
        if (target) target.classList.add('show');
      });
    });

    // Seletor de Empresa
    const selEmp = document.getElementById('selectEmpresaFiscal');
    if (selEmp) {
      selEmp.addEventListener('change', (e) => {
        const found = state.empresas.find(x => x.id === e.target.value);
        if (found) {
          state.empresaSelecionada = found;
          saveToLocalStorage();
          renderEscrituracaoModule();
        }
      });
    }

    // Seletor de Período
    const inputPer = document.getElementById('inputPeriodoFiscal');
    if (inputPer) {
      inputPer.addEventListener('change', (e) => {
        state.anoMes = e.target.value || '2026-01';
        saveToLocalStorage();
        renderEscrituracaoModule();
      });
    }

    const btnMesAnt = document.getElementById('btnMesAnterior');
    if (btnMesAnt) {
      btnMesAnt.addEventListener('click', () => {
        state.anoMes = calcularMesRelativo(state.anoMes, -1);
        saveToLocalStorage();
        renderEscrituracaoModule();
      });
    }

    const btnMesPost = document.getElementById('btnMesPosterior');
    if (btnMesPost) {
      btnMesPost.addEventListener('click', () => {
        state.anoMes = calcularMesRelativo(state.anoMes, 1);
        saveToLocalStorage();
        renderEscrituracaoModule();
      });
    }

    const btnGoAudit = document.getElementById('btnGoAuditTab');
    if (btnGoAudit) {
      btnGoAudit.addEventListener('click', () => {
        const tabAud = document.querySelector('.tab-btn[data-tab="tab-auditoria"]');
        if (tabAud) tabAud.click();
      });
    }

    const btnFeedXml = document.getElementById('btnFeedXml');
    if (btnFeedXml) {
      btnFeedXml.addEventListener('click', () => {
        const tabDocs = document.querySelector('.tab-btn[data-tab="tab-documentos"]');
        if (tabDocs) tabDocs.click();
      });
    }

    const btnFeedManual = document.getElementById('btnFeedManual');
    if (btnFeedManual) {
      btnFeedManual.addEventListener('click', () => {
        const modal = document.getElementById('modalNovoDocumento');
        if (modal) modal.style.display = 'flex';
      });
    }
  }

  function bindActionEvents() {
    // Dropzone de XMLs
    const dropCard = document.getElementById('fiscalDropZoneCard');
    const fileInput = document.getElementById('fiscalBatchFileInput');
    const btnBrowse = document.getElementById('btnBrowseXmlBatch');

    if (btnBrowse && fileInput) {
      btnBrowse.addEventListener('click', () => fileInput.click());
    }

    if (fileInput) {
      fileInput.addEventListener('change', (e) => {
        handleXmlFilesList(e.target.files);
      });
    }

    if (dropCard) {
      dropCard.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropCard.classList.add('dragover');
      });
      dropCard.addEventListener('dragleave', () => {
        dropCard.classList.remove('dragover');
      });
      dropCard.addEventListener('drop', (e) => {
        e.preventDefault();
        dropCard.classList.remove('dragover');
        if (e.dataTransfer && e.dataTransfer.files) {
          handleXmlFilesList(e.dataTransfer.files);
        }
      });
    }

    // Filtros de Documentos
    document.querySelectorAll('.filter-pills-group .filter-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        state.filtroOperacao = btn.getAttribute('data-filter');
        renderEscrituracaoModule();
      });
    });

    const searchInput = document.getElementById('inputBuscaDoc');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        state.termoBusca = e.target.value;
        renderEscrituracaoModule();
      });
    }

    // Modal Novo Documento
    const btnOpenDoc = document.getElementById('btnOpenNovoDocModal');
    const modalDoc = document.getElementById('modalNovoDocumento');
    const btnCloseDoc = document.getElementById('btnCloseNovoDocModal');
    const btnCancelDoc = document.getElementById('btnCancelNovoDoc');
    const formNovoDoc = document.getElementById('formNovoDocumento');

    if (btnOpenDoc && modalDoc) {
      btnOpenDoc.addEventListener('click', () => modalDoc.style.display = 'flex');
    }
    if (btnCloseDoc && modalDoc) {
      btnCloseDoc.addEventListener('click', () => modalDoc.style.display = 'none');
    }
    if (btnCancelDoc && modalDoc) {
      btnCancelDoc.addEventListener('click', () => modalDoc.style.display = 'none');
    }

    if (formNovoDoc) {
      formNovoDoc.addEventListener('submit', (e) => {
        e.preventDefault();
        criarDocumentoManual();
      });
    }

    // Modal Nova Empresa
    const btnOpenEmp = document.getElementById('btnOpenNovaEmpresaModal');
    const modalEmp = document.getElementById('modalNovaEmpresa');
    const btnCloseEmp = document.getElementById('btnCloseNovaEmpresaModal');
    const btnCancelEmp = document.getElementById('btnCancelNovaEmp');
    const formNovaEmp = document.getElementById('formNovaEmpresa');

    if (btnOpenEmp && modalEmp) {
      btnOpenEmp.addEventListener('click', () => modalEmp.style.display = 'flex');
    }
    if (btnCloseEmp && modalEmp) {
      btnCloseEmp.addEventListener('click', () => modalEmp.style.display = 'none');
    }
    if (btnCancelEmp && modalEmp) {
      btnCancelEmp.addEventListener('click', () => modalEmp.style.display = 'none');
    }

    if (formNovaEmp) {
      formNovaEmp.addEventListener('submit', (e) => {
        e.preventDefault();
        criarEmpresaManual();
      });
    }

    // Exclusão de Documento
    document.querySelectorAll('[data-delete-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-delete-id');
        if (confirm('Deseja realmente remover esta nota fiscal da escrituração?')) {
          state.documentos = state.documentos.filter(d => d.id !== id);
          saveToLocalStorage();
          renderEscrituracaoModule();
        }
      });
    });

    // Limpar Lote
    const btnLimpar = document.getElementById('btnLimparDocumentos');
    if (btnLimpar) {
      btnLimpar.addEventListener('click', () => {
        if (confirm('Deseja limpar todos os documentos escriturados no período atual?')) {
          state.documentos = [];
          saveToLocalStorage();
          renderEscrituracaoModule();
        }
      });
    }

    // Botões SPED
    const btnExpIcms = document.getElementById('btnDownloadEfdIcmsTab');
    if (btnExpIcms) {
      btnExpIcms.addEventListener('click', () => {
        const txt = gerarSpedIcmsTxt();
        downloadFile(txt, `SPED_EFD_ICMS_IPI_${state.empresaSelecionada.cnpj}_${state.anoMes.replace('-', '')}.txt`);
      });
    }

    const btnExpContr = document.getElementById('btnDownloadEfdContrTab');
    if (btnExpContr) {
      btnExpContr.addEventListener('click', () => {
        const txt = gerarSpedContribuicoesTxt();
        downloadFile(txt, `SPED_EFD_CONTRIBUICOES_${state.empresaSelecionada.cnpj}_${state.anoMes.replace('-', '')}.txt`);
      });
    }

    const btnViewIcms = document.getElementById('btnViewEfdIcmsTab');
    const btnViewContr = document.getElementById('btnViewEfdContrTab');
    const embedBox = document.getElementById('spedEmbeddedBox');
    const embedCode = document.getElementById('spedEmbeddedCode');
    const embedTitle = document.getElementById('spedViewerTitle');
    const btnCloseSped = document.getElementById('btnCloseSpedViewer');
    const btnCopySped = document.getElementById('btnCopySpedCode');

    if (btnViewIcms && embedBox && embedCode) {
      btnViewIcms.addEventListener('click', () => {
        embedTitle.textContent = '📄 EFD ICMS IPI - Registros Fiscais Formatados';
        embedCode.textContent = gerarSpedIcmsTxt();
        embedBox.style.display = 'block';
        embedBox.scrollIntoView({ behavior: 'smooth' });
      });
    }

    if (btnViewContr && embedBox && embedCode) {
      btnViewContr.addEventListener('click', () => {
        embedTitle.textContent = '📄 EFD-Contribuições (PIS/COFINS) - Registros Formatados';
        embedCode.textContent = gerarSpedContribuicoesTxt();
        embedBox.style.display = 'block';
        embedBox.scrollIntoView({ behavior: 'smooth' });
      });
    }

    if (btnCloseSped && embedBox) {
      btnCloseSped.addEventListener('click', () => {
        embedBox.style.display = 'none';
      });
    }

    if (btnCopySped && embedCode) {
      btnCopySped.addEventListener('click', () => {
        navigator.clipboard.writeText(embedCode.textContent).then(() => {
          alert('Linhas copiadas para a área de transferência!');
        });
      });
    }
  }

  // 5. Ingestão de XMLs em Lote
  async function handleXmlFilesList(files) {
    if (!files || files.length === 0) return;

    const destinacao = document.getElementById('selectDestinacaoBatch')?.value || 'REVENDA';
    let importados = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.name.toLowerCase().endsWith('.xml')) continue;

      try {
        const text = await file.text();
        const parsed = window.NFeXMLParser ? window.NFeXMLParser.parseXML(text) : null;

        if (parsed) {
          const emp = state.empresaSelecionada;
          const cnpjEmpresa = emp.cnpj.replace(/\D/g, '');
          const cnpjEmitente = (parsed.emitente?.cnpjCpf || '').replace(/\D/g, '');
          const isSaida = cnpjEmitente === cnpjEmpresa;

          // Conversão de CFOP De-Para
          const rawCfop = parsed.itens?.[0]?.cfop || '5102';
          let cfopEscriturado = rawCfop;
          let creditaIcms = false;
          let creditaPis = emp.regime_tributario === 'LUCRO_REAL';

          if (!isSaida) {
            const isInterna = (parsed.emitente?.uf || emp.uf).toUpperCase() === emp.uf.toUpperCase();
            const prefixo = isInterna ? '1' : '2';
            if (destinacao === 'REVENDA') {
              cfopEscriturado = `${prefixo}102`;
              creditaIcms = emp.regime_tributario !== 'SIMPLES_NACIONAL';
            } else if (destinacao === 'INSUMO') {
              cfopEscriturado = `${prefixo}101`;
              creditaIcms = emp.regime_tributario !== 'SIMPLES_NACIONAL';
            } else {
              cfopEscriturado = `${prefixo}556`;
              creditaIcms = false;
              creditaPis = false;
            }
          }

          const docObj = {
            id: `xml-${Date.now()}-${i}`,
            numero: parseInt(parsed.numero || Math.floor(Math.random() * 10000), 10),
            serie: String(parsed.serie || '1'),
            modelo: String(parsed.modelo || '55'),
            chave_acesso: (parsed.chaveAcesso || '').replace(/\D/g, ''),
            tipo_operacao: isSaida ? 'SAIDA' : 'ENTRADA',
            tipo_emissao: isSaida ? 'PROPRIA' : 'TERCEIROS',
            situacao_documento: '00',
            data_emissao: parsed.dataEmissao ? parsed.dataEmissao.substring(0, 10) : `${state.anoMes}-10`,
            participante_codigo: `PART_${(parsed.destinatario?.cnpjCpf || parsed.emitente?.cnpjCpf || '000').slice(-6)}`,
            participante_nome: isSaida ? parsed.destinatario?.razaoSocial : parsed.emitente?.razaoSocial,
            valor_total_documento: parsed.totais?.vNF || 0,
            totais: {
              valor_produtos: parsed.totais?.vProd || 0,
              valor_desconto: parsed.totais?.vDesc || 0,
              valor_frete: parsed.totais?.vFrete || 0,
              valor_seguro: parsed.totais?.vSeg || 0,
              valor_outras_despesas: parsed.totais?.vOutro || 0,
              valor_total_documento: parsed.totais?.vNF || 0,
              valor_bc_icms: parsed.totais?.vBC || 0,
              valor_icms: parsed.totais?.vICMS || 0,
              valor_pis: parsed.totais?.vPIS || 0,
              valor_cofins: parsed.totais?.vCOFINS || 0
            },
            itens: (parsed.itens || []).map((it, idx) => ({
              numero_item: idx + 1,
              codigo_item: it.cProd || `ITEM_${idx + 1}`,
              descricao: it.xProd || 'Mercadoria',
              ncm: (it.ncm || '00000000').replace(/\D/g, '').padEnd(8, '0'),
              unidade_medida: it.uCom || 'UN',
              quantidade_comercial: it.qCom || 1,
              valor_unitario: it.vUnCom || 0,
              valor_bruto: it.vProd || 0,
              valor_desconto: it.vDesc || 0,
              destinacao_item: destinacao,
              credita_icms: creditaIcms,
              credita_pis_cofins: creditaPis,
              cfop_origem: it.cfop || rawCfop,
              cfop_escriturado: cfopEscriturado,
              cst_icms: it.icms?.cst || '00',
              valor_bc_icms: it.icms?.vBC || 0,
              aliquota_icms: it.icms?.pICMS || 18.00,
              valor_icms: it.icms?.vICMS || 0,
              cst_pis: isSaida ? '01' : (creditaPis ? '50' : '70'),
              valor_bc_pis: it.vProd || 0,
              aliquota_pis: 1.65,
              valor_pis: it.pis?.vPIS || 0,
              cst_cofins: isSaida ? '01' : (creditaPis ? '50' : '70'),
              valor_bc_cofins: it.vProd || 0,
              aliquota_cofins: 7.60,
              valor_cofins: it.cofins?.vCOFINS || 0
            }))
          };

          state.documentos.unshift(docObj);
          importados++;
        }
      } catch (err) {
        console.warn(`Erro no parsing de ${file.name}:`, err);
      }
    }

    if (importados > 0) {
      saveToLocalStorage();
      renderEscrituracaoModule();
      alert(`🎉 Sucesso! ${importados} arquivo(s) XML importado(s) e escriturado(s) com De-Para.`);
    } else {
      alert('Nenhum XML válido pôde ser importado. Certifique-se de que são arquivos NF-e/CT-e válidos.');
    }
  }

  // 6. Lançamento Manual de Documento
  function criarDocumentoManual() {
    const tipo = document.getElementById('docNewTipo').value;
    const destinacao = document.getElementById('docNewDestinacao').value;
    const numero = parseInt(document.getElementById('docNewNumero').value, 10);
    const serie = document.getElementById('docNewSerie').value || '1';
    const dataEmissao = document.getElementById('docNewData').value;
    const partNome = document.getElementById('docNewPartNome').value;
    const partDoc = document.getElementById('docNewPartDoc').value.replace(/\D/g, '');
    const partUf = document.getElementById('docNewPartUf').value;
    const vTotal = parseFloat(document.getElementById('docNewValorTotal').value) || 0;
    const cfop = document.getElementById('docNewCfop').value.replace(/\D/g, '');
    const aliqIcms = parseFloat(document.getElementById('docNewAliqIcms').value) || 18.00;

    const isSaida = tipo === 'SAIDA';
    const vIcms = Math.round((vTotal * (aliqIcms / 100)) * 100) / 100;
    const aliqPis = state.empresaSelecionada.regime_tributario === 'LUCRO_REAL' ? 1.65 : 0.65;
    const aliqCof = state.empresaSelecionada.regime_tributario === 'LUCRO_REAL' ? 7.60 : 3.00;
    const vPis = Math.round((vTotal * (aliqPis / 100)) * 100) / 100;
    const vCof = Math.round((vTotal * (aliqCof / 100)) * 100) / 100;

    const creditaIcms = !isSaida && ['REVENDA', 'INSUMO'].includes(destinacao) && state.empresaSelecionada.regime_tributario !== 'SIMPLES_NACIONAL';
    const creditaPis = !isSaida && ['REVENDA', 'INSUMO'].includes(destinacao) && state.empresaSelecionada.regime_tributario === 'LUCRO_REAL';

    // Gera chave fictícia válida com DV Modulo 11
    const baseChave = `35${dataEmissao.substring(2, 4)}${dataEmissao.substring(5, 7)}${state.empresaSelecionada.cnpj}55001${String(numero).padStart(9, '0')}100000001`;
    const chaveValida = gerarChaveComDv(baseChave.substring(0, 43));

    const novoDoc = {
      id: `manual-${Date.now()}`,
      numero,
      serie,
      modelo: '55',
      chave_acesso: chaveValida,
      tipo_operacao: tipo,
      tipo_emissao: isSaida ? 'PROPRIA' : 'TERCEIROS',
      situacao_documento: '00',
      data_emissao: dataEmissao,
      participante_codigo: `PART_${partDoc.slice(-4) || '99'}`,
      participante_nome: partNome,
      valor_total_documento: vTotal,
      totais: {
        valor_produtos: vTotal,
        valor_desconto: 0,
        valor_total_documento: vTotal,
        valor_bc_icms: vTotal,
        valor_icms: vIcms,
        valor_pis: vPis,
        valor_cofins: vCof
      },
      itens: [
        {
          numero_item: 1,
          codigo_item: 'ITEM_MANUAL',
          descricao: 'Mercadoria Lançada Manualmente',
          ncm: '29011000',
          unidade_medida: 'UN',
          quantidade_comercial: 1,
          valor_unitario: vTotal,
          valor_bruto: vTotal,
          valor_desconto: 0,
          destinacao_item: destinacao,
          credita_icms: creditaIcms,
          credita_pis_cofins: creditaPis,
          cfop_origem: cfop,
          cfop_escriturado: cfop,
          cst_icms: '00',
          valor_bc_icms: vTotal,
          aliquota_icms: aliqIcms,
          valor_icms: vIcms,
          cst_pis: isSaida ? '01' : (creditaPis ? '50' : '70'),
          valor_bc_pis: vTotal,
          aliquota_pis: aliqPis,
          valor_pis: vPis,
          cst_cofins: isSaida ? '01' : (creditaPis ? '50' : '70'),
          valor_bc_cofins: vTotal,
          aliquota_cofins: aliqCof,
          valor_cofins: vCof
        }
      ]
    };

    state.documentos.unshift(novoDoc);
    saveToLocalStorage();

    const modal = document.getElementById('modalNovoDocumento');
    if (modal) modal.style.display = 'none';

    renderEscrituracaoModule();
    alert(`Nota Fiscal ${numero} adicionada e escriturada com sucesso!`);
  }

  // 7. Cadastro de Nova Empresa
  function criarEmpresaManual() {
    const razao = document.getElementById('empNewRazao').value;
    const fantasia = document.getElementById('empNewFantasia').value || razao;
    const cnpj = document.getElementById('empNewCnpj').value.replace(/\D/g, '');
    const ie = document.getElementById('empNewIE').value.replace(/\D/g, '');
    const uf = document.getElementById('empNewUf').value;
    const regime = document.getElementById('empNewRegime').value;

    const nova = {
      id: `emp-${Date.now()}`,
      tenant_id: state.tenantId,
      razao_social: razao,
      nome_fantasia: fantasia,
      cnpj: cnpj.padEnd(14, '0'),
      inscricao_estadual: ie,
      codigo_municipio_ibge: '3550308',
      uf,
      regime_tributario: regime,
      perfil_sped: regime === 'SIMPLES_NACIONAL' ? 'B' : 'A'
    };

    state.empresas.push(nova);
    state.empresaSelecionada = nova;
    saveToLocalStorage();

    const modal = document.getElementById('modalNovaEmpresa');
    if (modal) modal.style.display = 'none';

    renderEscrituracaoModule();
    alert(`Empresa "${razao}" cadastrada com sucesso!`);
  }

  // 8. Motor de Apuração
  function calcularApuracao() {
    const emp = state.empresaSelecionada;
    const isReal = emp.regime_tributario === 'LUCRO_REAL';

    let debIcms = 0;
    let credIcms = 0;
    let debPis = 0;
    let credPis = 0;
    let debCofins = 0;
    let credCofins = 0;
    let icmsExcluido = 0;

    for (const doc of state.documentos) {
      const isSaida = doc.tipo_operacao === 'SAIDA';
      for (const it of (doc.itens || [])) {
        const vIcms = it.valor_icms || 0;
        const vBruto = it.valor_bruto || 0;

        if (isSaida) {
          debIcms += vIcms;

          // Tema 69 STF: Exclusão do ICMS da base de PIS/COFINS
          const basePis = Math.max(0, vBruto - vIcms);
          icmsExcluido += vIcms;
          const aliqPis = isReal ? 0.0165 : 0.0065;
          const aliqCof = isReal ? 0.0760 : 0.0300;

          debPis += basePis * aliqPis;
          debCofins += basePis * aliqCof;
        } else {
          if (it.credita_icms) {
            credIcms += vIcms;
          }
          if (isReal && it.credita_pis_cofins) {
            credPis += vBruto * 0.0165;
            credCofins += vBruto * 0.0760;
          }
        }
      }
    }

    debIcms = Math.round(debIcms * 100) / 100;
    credIcms = Math.round(credIcms * 100) / 100;
    debPis = Math.round(debPis * 100) / 100;
    credPis = Math.round(credPis * 100) / 100;
    debCofins = Math.round(debCofins * 100) / 100;
    credCofins = Math.round(credCofins * 100) / 100;

    const icmsRecolher = debIcms > credIcms ? debIcms - credIcms : 0;
    const icmsTransportar = credIcms > debIcms ? credIcms - debIcms : 0;

    state.apuracao = {
      icms: {
        total_debitos: debIcms,
        total_creditos: credIcms,
        saldo_credor_anterior: 0,
        imposto_a_recolher: icmsRecolher,
        saldo_credor_transportar: icmsTransportar
      },
      pis: {
        total_debitos: debPis,
        total_creditos: credPis,
        imposto_a_recolher: Math.max(0, debPis - credPis),
        aliquota_aplicada: isReal ? 1.65 : 0.65,
        regime: isReal ? 'Não-Cumulativo' : 'Cumulativo',
        total_icms_excluido_tema69: icmsExcluido
      },
      cofins: {
        total_debitos: debCofins,
        total_creditos: credCofins,
        imposto_a_recolher: Math.max(0, debCofins - credCofins),
        aliquota_aplicada: isReal ? 7.60 : 3.00
      }
    };
  }

  // 9. Motor de Auditoria
  function executarAuditoria() {
    const emp = state.empresaSelecionada;
    const inconsistencias = [];

    for (const doc of state.documentos) {
      if (doc.chave_acesso && !validarModulo11(doc.chave_acesso)) {
        inconsistencias.push({
          tipo: 'ERRO',
          codigo: 'VAL_CHAVE_ACESSO_DV',
          documento: `NF ${doc.numero}`,
          chave_acesso: doc.chave_acesso,
          mensagem: 'Dígito Verificador da chave de acesso incorreto pelo Módulo 11 da SEFAZ.'
        });
      }

      const somaItens = (doc.itens || []).reduce((acc, it) => acc + (it.valor_bruto || 0), 0);
      if (Math.abs(somaItens - (doc.valor_total_documento || 0)) > 0.05) {
        inconsistencias.push({
          tipo: 'ERRO',
          codigo: 'VAL_C100_VS_C170_TOTAL',
          documento: `NF ${doc.numero}`,
          chave_acesso: doc.chave_acesso,
          mensagem: `Total declarado (R$ ${formatBrl(doc.valor_total_documento)}) difere da soma dos itens (R$ ${formatBrl(somaItens)}).`
        });
      }

      if (emp.regime_tributario === 'LUCRO_PRESUMIDO' && doc.tipo_operacao === 'ENTRADA') {
        for (const it of (doc.itens || [])) {
          if (it.cst_pis >= '50' && it.cst_pis <= '66') {
            inconsistencias.push({
              tipo: 'ERRO',
              codigo: 'VAL_CST_PIS_REGIME_COERENCIA',
              documento: `NF ${doc.numero}`,
              mensagem: `Empresa no Lucro Presumido escriturou CST de crédito [${it.cst_pis}], vedado no regime cumulativo.`
            });
          }
        }
      }
    }

    const erros = inconsistencias.filter(i => i.tipo === 'ERRO').length;
    state.auditoria = {
      aprovado_para_pva: erros === 0,
      erros_impeditivos: erros,
      alertas: inconsistencias.filter(i => i.tipo === 'ALERTA').length,
      inconsistencias
    };
  }

  // 10. Utilitários e Geradores SPED
  function validarModulo11(chave) {
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

  function gerarChaveComDv(base43) {
    let soma = 0;
    let peso = 2;
    for (let i = base43.length - 1; i >= 0; i--) {
      soma += parseInt(base43.charAt(i), 10) * peso;
      peso = peso >= 9 ? 2 : peso + 1;
    }
    const resto = soma % 11;
    const dv = (resto === 0 || resto === 1) ? 0 : 11 - resto;
    return `${base43}${dv}`;
  }

  function gerarSpedIcmsTxt() {
    const emp = state.empresaSelecionada;
    const dtIni = '01012026';
    const dtFin = '31012026';
    const lines = [];

    lines.push(`|0000|018|0|${dtIni}|${dtFin}|${emp.razao_social}|${emp.cnpj.replace(/\D/g, '')}|${emp.uf}|${emp.inscricao_estadual.replace(/\D/g, '')}|${emp.codigo_municipio_ibge}|||${emp.perfil_sped}|0|`);
    lines.push('|0001|0|');
    lines.push(`|0005|${emp.nome_fantasia || emp.razao_social}|01001000|Avenida Principal|100||Centro|1133334444|fiscal@empresa.com.br|`);
    lines.push('|0100|Contador Responsavel|12345678909|CRC-SP 123456/O|12345678000195|01001000|Rua dos Contabilistas|50||Consolação|1133335555||contador@portal.com.br|3550308|');

    for (const p of state.participantes) {
      lines.push(`|0150|${p.codigo_participante}|${p.nome}|1058|${p.cnpj_cpf.replace(/\D/g, '')}||${p.inscricao_estadual.replace(/\D/g, '')}|${p.codigo_municipio_ibge}||Rua Comercial|S/N||Centro|`);
    }

    lines.push('|0190|UN|Unidade|');
    lines.push('|0190|SC|Saca|');
    for (const prod of state.produtos) {
      lines.push(`|0200|${prod.codigo_item}|${prod.descricao}|||${prod.unidade_medida}|${prod.tipo_item}|${prod.ncm.replace(/\D/g, '')}||||18,00||`);
    }
    lines.push(`|0990|${lines.length + 1}|`);

    const startC = lines.length;
    lines.push('|C001|0|');
    for (const doc of state.documentos) {
      const isSaida = doc.tipo_operacao === 'SAIDA';
      lines.push(`|C100|${isSaida ? '1' : '0'}|${isSaida ? '0' : '1'}|${doc.participante_codigo}|55|00|${doc.serie}|${doc.numero}|${doc.chave_acesso}|12012026|12012026|${doc.valor_total_documento.toFixed(2).replace('.', ',')}|0|0,00|0,00|${doc.valor_total_documento.toFixed(2).replace('.', ',')}|9|0,00|0,00|0,00|${(doc.totais?.valor_bc_icms || 0).toFixed(2).replace('.', ',')}|${(doc.totais?.valor_icms || 0).toFixed(2).replace('.', ',')}|0,00|0,00|0,00|${(doc.totais?.valor_pis || 0).toFixed(2).replace('.', ',')}|${(doc.totais?.valor_cofins || 0).toFixed(2).replace('.', ',')}|0,00|0,00|`);

      for (let i = 0; i < (doc.itens || []).length; i++) {
        const it = doc.itens[i];
        lines.push(`|C170|${i + 1}|${it.codigo_item}||${it.quantidade_comercial.toFixed(4).replace('.', ',')}|${it.unidade_medida}|${it.valor_bruto.toFixed(2).replace('.', ',')}|0,00|0|${it.cst_icms}|${it.cfop_escriturado}||${(it.valor_bc_icms || 0).toFixed(2).replace('.', ',')}|${(it.aliquota_icms || 0).toFixed(2).replace('.', ',')}|${(it.valor_icms || 0).toFixed(2).replace('.', ',')}|0,00|0,00|0,00|0|99|999|0,00|0,00|0,00|${it.cst_pis}|${(it.valor_bc_pis || 0).toFixed(2).replace('.', ',')}|${(it.aliquota_pis || 0).toFixed(2).replace('.', ',')}|${(it.valor_pis || 0).toFixed(2).replace('.', ',')}|${it.cst_cofins}|${(it.valor_bc_cofins || 0).toFixed(2).replace('.', ',')}|${(it.aliquota_cofins || 0).toFixed(2).replace('.', ',')}|${(it.valor_cofins || 0).toFixed(2).replace('.', ',')}||`);
        lines.push(`|C190|${it.cst_icms}|${it.cfop_escriturado}|${(it.aliquota_icms || 0).toFixed(2).replace('.', ',')}|${it.valor_bruto.toFixed(2).replace('.', ',')}|${(it.valor_bc_icms || 0).toFixed(2).replace('.', ',')}|${(it.valor_icms || 0).toFixed(2).replace('.', ',')}|0,00|0,00|0,00|0,00||`);
      }
    }
    lines.push(`|C990|${lines.length - startC + 1}|`);

    const startE = lines.length;
    lines.push('|E001|0|');
    lines.push(`|E100|${dtIni}|${dtFin}|`);
    lines.push(`|E110|${state.apuracao.icms.total_debitos.toFixed(2).replace('.', ',')}|0,00|0,00|0,00|${state.apuracao.icms.total_creditos.toFixed(2).replace('.', ',')}|0,00|0,00|0,00|0,00|${state.apuracao.icms.imposto_a_recolher.toFixed(2).replace('.', ',')}|0,00|${state.apuracao.icms.imposto_a_recolher.toFixed(2).replace('.', ',')}|${state.apuracao.icms.saldo_credor_transportar.toFixed(2).replace('.', ',')}|0,00|`);
    if (state.apuracao.icms.imposto_a_recolher > 0) {
      lines.push(`|E116|000|${state.apuracao.icms.imposto_a_recolher.toFixed(2).replace('.', ',')}|20022026|046-2||||||012026|`);
    }
    lines.push(`|E990|${lines.length - startE + 1}|`);

    const start9 = lines.length;
    lines.push('|9001|0|');
    const counts = new Map();
    for (const l of lines) {
      const reg = l.split('|')[1];
      counts.set(reg, (counts.get(reg) || 0) + 1);
    }
    for (const [r, c] of counts.entries()) {
      lines.push(`|9900|${r}|${c}|`);
    }
    const qtd9900 = counts.size + 3;
    lines.push(`|9900|9900|${qtd9900}|`);
    lines.push('|9900|9990|1|');
    lines.push('|9900|9999|1|');
    lines.push(`|9990|${qtd9900 + 2}|`);
    lines.push(`|9999|${lines.length + 1}|`);

    return lines.map(l => `${l}\r\n`).join('');
  }

  function gerarSpedContribuicoesTxt() {
    const emp = state.empresaSelecionada;
    const dtIni = '01012026';
    const dtFin = '31012026';
    const lines = [];

    lines.push(`|0000|006|0|${dtIni}|${dtFin}|${emp.razao_social}|${emp.cnpj.replace(/\D/g, '')}|${emp.uf}|${emp.codigo_municipio_ibge}||00|0|`);
    lines.push('|0001|0|');
    lines.push(`|0110|${emp.regime_tributario === 'LUCRO_REAL' ? '1' : '2'}|1|1|`);
    lines.push(`|0140|ESTAB01|${emp.razao_social}|${emp.cnpj.replace(/\D/g, '')}|${emp.uf}|${emp.inscricao_estadual.replace(/\D/g, '')}|${emp.codigo_municipio_ibge}||`);
    lines.push('|0990|5|');

    lines.push('|C001|0|');
    for (const doc of state.documentos) {
      lines.push(`|C100|${doc.tipo_operacao === 'SAIDA' ? '1' : '0'}|0|${doc.participante_codigo}|55|00|${doc.serie}|${doc.numero}|${doc.chave_acesso}|12012026|12012026|${doc.valor_total_documento.toFixed(2).replace('.', ',')}|0|0,00|0,00|${doc.valor_total_documento.toFixed(2).replace('.', ',')}|9|0,00|0,00|0,00|0,00|0,00|0,00|0,00|0,00|${(doc.totais?.valor_pis || 0).toFixed(2).replace('.', ',')}|${(doc.totais?.valor_cofins || 0).toFixed(2).replace('.', ',')}|0,00|0,00|`);
    }
    lines.push(`|C990|${state.documentos.length + 2}|`);

    lines.push('|M001|0|');
    lines.push(`|M200|${state.apuracao.pis.total_debitos.toFixed(2).replace('.', ',')}|0,00|0,00|${state.apuracao.pis.total_creditos.toFixed(2).replace('.', ',')}|0,00|0,00|0,00|${state.apuracao.pis.imposto_a_recolher.toFixed(2).replace('.', ',')}|`);
    lines.push(`|M600|${state.apuracao.cofins.total_debitos.toFixed(2).replace('.', ',')}|0,00|0,00|${state.apuracao.cofins.total_creditos.toFixed(2).replace('.', ',')}|0,00|0,00|0,00|${state.apuracao.cofins.imposto_a_recolher.toFixed(2).replace('.', ',')}|`);
    lines.push('|M990|4|');

    lines.push('|9001|0|');
    lines.push(`|9999|${lines.length + 2}|`);

    return lines.map(l => `${l}\r\n`).join('');
  }

  function downloadFile(content, filename) {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function calcularMesRelativo(anoMes, delta) {
    const [y, m] = anoMes.split('-').map(Number);
    const date = new Date(y, m - 1 + delta, 1);
    const ano = date.getFullYear();
    const mes = String(date.getMonth() + 1).padStart(2, '0');
    return `${ano}-${mes}`;
  }

  function formatBrl(val) {
    return (parseFloat(val) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function formatCnpj(cnpj) {
    const c = String(cnpj || '').replace(/\D/g, '');
    if (c.length !== 14) return cnpj;
    return `${c.slice(0, 2)}.${c.slice(2, 5)}.${c.slice(5, 8)}/${c.slice(8, 12)}-${c.slice(12, 14)}`;
  }

  function formatDateBr(isoDate) {
    if (!isoDate) return '';
    const parts = isoDate.substring(0, 10).split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return isoDate;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
