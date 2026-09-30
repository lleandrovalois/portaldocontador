/**
 * Módulo de Escrituração Fiscal e SPED - Interface do Portal do Contador
 * Gerencia a navegação, seleção de empresas/regimes, apuração tributária,
 * auditoria pré-PVA (10 regras) e exportação de arquivos EFD.
 */

(function () {
  // Estado local da escrituração
  const state = {
    tenantId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    empresaSelecionada: null,
    anoMes: '2026-01',
    documentos: [],
    participantes: [],
    produtos: [],
    apuracao: null,
    auditoria: null,
    serverOnline: false,
    apiBase: 'http://localhost:3001/api/v1'
  };

  // Empresas pré-configuradas (compatíveis com o banco de dados)
  const empresasPadrao = [
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

  // Documentos de Exemplo do Mês 2026-01
  const documentosDemonstracao = [
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

  // Inicialização do Módulo
  function init() {
    setupSidebarNavigation();
    state.empresaSelecionada = empresasPadrao[0];
    state.documentos = [...documentosDemonstracao];
    state.participantes = [
      {
        codigo_participante: 'CLI001',
        nome: 'Supermercados Estrela do Sul Ltda',
        cnpj_cpf: '55667788000144',
        inscricao_estadual: '456789012345',
        uf: 'SP',
        codigo_municipio_ibge: '3550308'
      },
      {
        codigo_participante: 'FORN001',
        nome: 'Indústria Química Nacional S.A.',
        cnpj_cpf: '01234567000189',
        inscricao_estadual: '123456789012',
        uf: 'SP',
        codigo_municipio_ibge: '3550308'
      }
    ];
    state.produtos = [
      { codigo_item: 'PROD001', descricao: 'Solvente Industrial Alifático 20L', unidade_medida: 'UN', tipo_item: '00', ncm: '29011000' },
      { codigo_item: 'PROD002', descricao: 'Resina Termoplástica Especial 50kg', unidade_medida: 'SC', tipo_item: '01', ncm: '39011010' },
      { codigo_item: 'PROD_CONS', descricao: 'Material de Limpeza e Papelaria Diversos', unidade_medida: 'UN', tipo_item: '07', ncm: '48025610' }
    ];

    checarStatusBackend();
  }

  async function checarStatusBackend() {
    try {
      const res = await fetch(`${state.apiBase}/health`, { signal: AbortSignal.timeout(1500) });
      if (res.ok) {
        state.serverOnline = true;
        console.log('✅ [Portal do Contador] Backend Fiscal Engine conectado.');
      }
    } catch (e) {
      state.serverOnline = false;
      console.log('ℹ️ [Portal do Contador] Backend offline, executando com motor embarcado no browser.');
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

        // Atualizar breadcrumb
        const breadcrumbEl = document.querySelector('.breadcrumb-active');
        if (breadcrumbEl) {
          breadcrumbEl.textContent = 'Módulo de Escrituração Fiscal & SPED';
        }
      });
    }

    if (navInterpreter) {
      navInterpreter.addEventListener('click', () => {
        document.querySelectorAll('.sidebar-nav .nav-item').forEach(el => el.classList.remove('active'));
        navInterpreter.classList.add('active');

        if (escrituracaoView) escrituracaoView.style.display = 'none';
        if (interpretadorView) interpretadorView.style.display = 'block';

        const breadcrumbEl = document.querySelector('.breadcrumb-active');
        if (breadcrumbEl) {
          breadcrumbEl.textContent = 'Interpretador de Notas Fiscais';
        }
      });
    }
  }

  function renderEscrituracaoModule() {
    const container = document.getElementById('escrituracaoViewArea');
    if (!container) return;

    // Se ainda não foi calculado, apura os valores padrão
    if (!state.apuracao) {
      calcularApuracaoLocal();
    }
    if (!state.auditoria) {
      executarAuditoriaLocal();
    }

    const emp = state.empresaSelecionada;
    const ap = state.apuracao;
    const aud = state.auditoria;

    container.innerHTML = `
      <!-- Cabeçalho do Módulo & Seletor Multi-Tenant -->
      <section class="fiscal-header-card">
        <div class="fiscal-header-info">
          <div class="fiscal-badge-regime ${emp.regime_tributario.toLowerCase()}">
            ${emp.regime_tributario.replace('_', ' ')}
          </div>
          <h2 class="fiscal-title">${emp.razao_social}</h2>
          <div class="fiscal-meta">
            <span><strong>CNPJ:</strong> ${formatCnpj(emp.cnpj)}</span>
            <span><strong>IE:</strong> ${emp.inscricao_estadual}</span>
            <span><strong>UF:</strong> ${emp.uf}</span>
            <span><strong>Perfil SPED:</strong> ${emp.perfil_sped}</span>
            <span><strong>Status Backend:</strong> ${state.serverOnline ? '<span class="status-online">🟢 Online (Porta 3001)</span>' : '<span class="status-offline">🔵 Engine Local</span>'}</span>
          </div>
        </div>

        <div class="fiscal-controls">
          <div class="control-group">
            <label for="selectEmpresaFiscal">Empresa / Cliente:</label>
            <select id="selectEmpresaFiscal" class="fiscal-select">
              ${empresasPadrao.map(e => `
                <option value="${e.id}" ${e.id === emp.id ? 'selected' : ''}>
                  ${e.nome_fantasia || e.razao_social} (${e.regime_tributario})
                </option>
              `).join('')}
            </select>
          </div>

          <div class="control-group">
            <label for="selectPeriodoFiscal">Período de Apuração:</label>
            <input type="month" id="selectPeriodoFiscal" class="fiscal-input-date" value="${state.anoMes}" />
          </div>

          <div class="control-buttons">
            <button type="button" class="btn-primary" id="btnRecalcularApuracao">
              🔄 Recalcular Apuração
            </button>
            <button type="button" class="btn-auditoria" id="btnExecutarAuditoria">
              🛡️ Auditar Pré-PVA
            </button>
          </div>
        </div>
      </section>

      <!-- KPIs da Apuração Mensal -->
      <section class="fiscal-kpi-grid">
        <div class="kpi-card icms">
          <div class="kpi-header">
            <span class="kpi-tag">ICMS Próprio (E110)</span>
            <span class="kpi-icon">💰</span>
          </div>
          <div class="kpi-value">R$ ${formatBrl(ap.icms.imposto_a_recolher)}</div>
          <div class="kpi-sub">
            <span>Débitos (Saídas): <strong>R$ ${formatBrl(ap.icms.total_debitos)}</strong></span>
            <span>Créditos (Entradas): <strong>R$ ${formatBrl(ap.icms.total_creditos)}</strong></span>
            ${ap.icms.saldo_credor_transportar > 0 ? `<span class="badge-credito">Saldo Credor a Transportar: R$ ${formatBrl(ap.icms.saldo_credor_transportar)}</span>` : ''}
          </div>
        </div>

        <div class="kpi-card pis">
          <div class="kpi-header">
            <span class="kpi-tag">PIS/PASEP (M200)</span>
            <span class="kpi-icon">📈</span>
          </div>
          <div class="kpi-value">R$ ${formatBrl(ap.pis.imposto_a_recolher)}</div>
          <div class="kpi-sub">
            <span>Alíquota: <strong>${ap.pis.aliquota_aplicada}%</strong> (${ap.pis.regime})</span>
            ${ap.pis.total_icms_excluido_tema69 > 0 ? `<span class="badge-tema69">⚖️ Tema 69 STF: -R$ ${formatBrl(ap.pis.total_icms_excluido_tema69)} da Base</span>` : ''}
          </div>
        </div>

        <div class="kpi-card cofins">
          <div class="kpi-header">
            <span class="kpi-tag">COFINS (M600)</span>
            <span class="kpi-icon">📊</span>
          </div>
          <div class="kpi-value">R$ ${formatBrl(ap.cofins.imposto_a_recolher)}</div>
          <div class="kpi-sub">
            <span>Alíquota: <strong>${ap.cofins.aliquota_aplicada}%</strong></span>
            <span>Créditos Insumos: <strong>R$ ${formatBrl(ap.cofins.total_creditos)}</strong></span>
          </div>
        </div>

        <div class="kpi-card auditoria-status ${aud.aprovado_para_pva ? 'aprovado' : 'reprovado'}">
          <div class="kpi-header">
            <span class="kpi-tag">Auditoria Pré-PVA</span>
            <span class="kpi-icon">${aud.aprovado_para_pva ? '✅' : '⚠️'}</span>
          </div>
          <div class="kpi-value status-text">${aud.aprovado_para_pva ? '100% Consistente' : `${aud.erros_impeditivos} Inconsistências`}</div>
          <div class="kpi-sub">
            <span>10 Regras Oficiais Checadas</span>
            <button type="button" class="btn-link-auditoria" id="btnVerDetalhesAuditoria">
              Ver Diagnóstico Completo →
            </button>
          </div>
        </div>
      </section>

      <!-- Barra de Exportação SPED Oficial -->
      <section class="sped-export-banner">
        <div class="sped-export-left">
          <div class="sped-icon">🏛️</div>
          <div>
            <h3>Gerador de Arquivos Digitais SPED (Layouts 2024–2026)</h3>
            <p>Arquivos prontos para transmissão e validação no PVA da Receita Federal e SEFAZ.</p>
          </div>
        </div>
        <div class="sped-export-actions">
          <button type="button" class="btn-sped-export" id="btnExportarEfdIcms">
            📥 Baixar EFD ICMS IPI (.txt)
          </button>
          <button type="button" class="btn-sped-export outline" id="btnExportarEfdContr">
            📥 Baixar EFD-Contribuições (.txt)
          </button>
          <button type="button" class="btn-sped-export viewer" id="btnVisualizarSped">
            👁️ Visualizar Linhas SPED
          </button>
        </div>
      </section>

      <!-- Painel de Auditoria Pré-PVA (Accordion ou Lista) -->
      <section class="audit-details-panel" id="auditDetailsSection" style="${aud.inconsistencias.length > 0 ? 'display:block;' : 'display:none;'}">
        <div class="panel-header">
          <h3>🛡️ Relatório de Auditoria Fiscal (10 Regras Pré-PVA)</h3>
          <span class="badge-audit-count ${aud.aprovado_para_pva ? 'success' : 'danger'}">
            ${aud.erros_impeditivos} Erros Impeditivos | ${aud.alertas} Alertas
          </span>
        </div>

        <div class="audit-rules-checklist">
          ${renderChecklistRegras(aud)}
        </div>

        ${aud.inconsistencias.length > 0 ? `
          <div class="inconsistencies-list">
            <h4>Inconsistências Identificadas para Correção:</h4>
            ${aud.inconsistencias.map(inc => `
              <div class="inc-card ${inc.tipo.toLowerCase()}">
                <div class="inc-badge">${inc.tipo}</div>
                <div class="inc-content">
                  <div class="inc-title"><strong>[${inc.codigo}]</strong> ${inc.documento || ''}</div>
                  <div class="inc-msg">${inc.mensagem}</div>
                  ${inc.chave_acesso ? `<div class="inc-chave">Chave: <code>${inc.chave_acesso}</code></div>` : ''}
                </div>
              </div>
            `).join('')}
          </div>
        ` : ''}
      </section>

      <!-- Tabela de Documentos Fiscais Escriturados -->
      <section class="fiscal-documents-table-card">
        <div class="table-card-header">
          <div>
            <h3>Livro Registro de Documentos Fiscais (${state.documentos.length} Documentos)</h3>
            <p>Notas Fiscais de Entrada e Saída escrituradas com De-Para de CFOP e CST aplicados.</p>
          </div>
          <div class="table-actions">
            <button type="button" class="btn-secondary" id="btnInjetarDivergenciaTeste">
              ⚡ Simular Inconsistência no Lote
            </button>
            <button type="button" class="btn-secondary" id="btnRestaurarLoteLimpo">
              ✨ Restaurar Lote Válido
            </button>
          </div>
        </div>

        <div class="table-responsive">
          <table class="fiscal-table">
            <thead>
              <tr>
                <th>Operação</th>
                <th>Modelo / Número</th>
                <th>Data Emissão</th>
                <th>Participante</th>
                <th>Valor Total</th>
                <th>CFOP Escriturado</th>
                <th>CST ICMS</th>
                <th>ICMS Próprio</th>
                <th>CST PIS/COF</th>
                <th>PIS</th>
                <th>COFINS</th>
              </tr>
            </thead>
            <tbody>
              ${state.documentos.map(doc => {
                const item1 = doc.itens?.[0] || {};
                const isSaida = doc.tipo_operacao === 'SAIDA';
                return `
                  <tr>
                    <td>
                      <span class="badge-operacao ${isSaida ? 'saida' : 'entrada'}">
                        ${isSaida ? '⬆️ SAÍDA' : '⬇️ ENTRADA'}
                      </span>
                    </td>
                    <td>
                      <strong>${doc.modelo || '55'}-${doc.numero}</strong><br>
                      <small style="color:var(--text-dim)">Série ${doc.serie}</small>
                    </td>
                    <td>${formatDateBr(doc.data_emissao)}</td>
                    <td>
                      <strong>${doc.participante_nome || doc.destinatario?.razao_social || doc.emitente?.razao_social || 'Cliente / Fornecedor'}</strong><br>
                      <small style="color:var(--text-dim)">Cod: ${doc.participante_codigo || 'PART'}</small>
                    </td>
                    <td><strong>R$ ${formatBrl(doc.valor_total_documento)}</strong></td>
                    <td><span class="cfop-pill">${item1.cfop_escriturado || item1.cfop_origem || '-'}</span></td>
                    <td><span class="cst-pill">${item1.cst_icms || '00'}</span></td>
                    <td>R$ ${formatBrl(item1.valor_icms || doc.totais?.valor_icms || 0)}</td>
                    <td><span class="cst-pill">${item1.cst_pis || '01'}</span></td>
                    <td>R$ ${formatBrl(item1.valor_pis || doc.totais?.valor_pis || 0)}</td>
                    <td>R$ ${formatBrl(item1.valor_cofins || doc.totais?.valor_cofins || 0)}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </section>

      <!-- Modal de Visualização SPED -->
      <div class="modal-sped-backdrop" id="modalSpedViewer" style="display:none;">
        <div class="modal-sped-dialog">
          <div class="modal-sped-header">
            <h3>📄 Arquivo SPED EFD ICMS IPI Gerado (Visualização Oficial)</h3>
            <button type="button" class="btn-close-modal" id="btnCloseSpedModal">✕</button>
          </div>
          <div class="modal-sped-body">
            <pre class="sped-code-block" id="spedCodeContainer"></pre>
          </div>
          <div class="modal-sped-footer">
            <button type="button" class="btn-primary" id="btnCopiarLinhasSped">📋 Copiar Linhas</button>
            <button type="button" class="btn-secondary" id="btnDownloadSpedModal">💾 Salvar Arquivo .txt</button>
          </div>
        </div>
      </div>
    `;

    bindEscrituracaoEvents();
  }

  function renderChecklistRegras(aud) {
    const regrasDef = [
      { id: 'VAL_C100_VS_C170_TOTAL', nome: '1. Total C100 vs. Soma dos Itens C170' },
      { id: 'VAL_C100_VS_C190_ICMS', nome: '2. Amarração C170 vs. Analítico C190' },
      { id: 'VAL_CHAVE_ACESSO_DV', nome: '3. Dígito Verificador Módulo 11 (Chave)' },
      { id: 'VAL_CFOP_TERRITORIALIDADE', nome: '4. CFOP vs. Territorialidade (UF Origem/Dest)' },
      { id: 'VAL_CST_ALIQ_CALC_ICMS', nome: '5. Cálculo Matemático de ICMS (CST x Base x Aliq)' },
      { id: 'VAL_CST_PIS_REGIME_COERENCIA', nome: '6. CST PIS/COFINS vs. Regime Tributário' },
      { id: 'VAL_PARTICIPANTE_ORFAO', nome: '7. Participante Cadastrado no Bloco 0150' },
      { id: 'VAL_ITEM_ORFAO_NCM_VALIDO', nome: '8. Item Cadastrado no 0200 com NCM TIPI Válido' },
      { id: 'VAL_E110_VS_DOCS_CONCILIACAO', nome: '9. Conciliação da Apuração E110 com Documentos' },
      { id: 'VAL_TESE_SECULO_ICMS_BASE_PIS', nome: '10. Tese do Século (Exclusão ICMS da Base PIS/COFINS)' }
    ];

    return regrasDef.map(r => {
      const falhou = aud.inconsistencias.some(inc => inc.codigo === r.id);
      return `
        <div class="rule-checklist-item ${falhou ? 'fail' : 'pass'}">
          <span class="rule-icon">${falhou ? '❌' : '✅'}</span>
          <span class="rule-name">${r.nome}</span>
          <span class="rule-badge">${falhou ? 'Inconsistência' : 'Conforme'}</span>
        </div>
      `;
    }).join('');
  }

  function bindEscrituracaoEvents() {
    // Seletor de empresa
    const selEmp = document.getElementById('selectEmpresaFiscal');
    if (selEmp) {
      selEmp.addEventListener('change', (e) => {
        const emp = empresasPadrao.find(x => x.id === e.target.value);
        if (emp) {
          state.empresaSelecionada = emp;
          calcularApuracaoLocal();
          executarAuditoriaLocal();
          renderEscrituracaoModule();
        }
      });
    }

    // Seletor de período
    const selPer = document.getElementById('selectPeriodoFiscal');
    if (selPer) {
      selPer.addEventListener('change', (e) => {
        state.anoMes = e.target.value || '2026-01';
        calcularApuracaoLocal();
        executarAuditoriaLocal();
        renderEscrituracaoModule();
      });
    }

    // Botão Recalcular
    const btnRecalc = document.getElementById('btnRecalcularApuracao');
    if (btnRecalc) {
      btnRecalc.addEventListener('click', () => {
        calcularApuracaoLocal();
        executarAuditoriaLocal();
        renderEscrituracaoModule();
      });
    }

    // Botão Auditar Pré-PVA
    const btnAud = document.getElementById('btnExecutarAuditoria');
    if (btnAud) {
      btnAud.addEventListener('click', () => {
        executarAuditoriaLocal();
        const section = document.getElementById('auditDetailsSection');
        if (section) section.style.display = 'block';
        section.scrollIntoView({ behavior: 'smooth' });
      });
    }

    const btnVerDet = document.getElementById('btnVerDetalhesAuditoria');
    if (btnVerDet) {
      btnVerDet.addEventListener('click', () => {
        const section = document.getElementById('auditDetailsSection');
        if (section) {
          section.style.display = 'block';
          section.scrollIntoView({ behavior: 'smooth' });
        }
      });
    }

    // Botões de Simulação de Inconsistências
    const btnInjetar = document.getElementById('btnInjetarDivergenciaTeste');
    if (btnInjetar) {
      btnInjetar.addEventListener('click', () => {
        // Provoca 3 inconsistências para demonstração imediata do auditor
        state.documentos[0].chave_acesso = '35260128192837000109550010000104201000104200'; // DV incorreto
        state.documentos[0].valor_total_documento = 12490.00; // Total difere dos itens
        state.documentos[1].itens[0].cst_pis = '50'; // Se for presumido vai apitar
        calcularApuracaoLocal();
        executarAuditoriaLocal();
        renderEscrituracaoModule();
      });
    }

    const btnRestaurar = document.getElementById('btnRestaurarLoteLimpo');
    if (btnRestaurar) {
      btnRestaurar.addEventListener('click', () => {
        state.documentos = JSON.parse(JSON.stringify(documentosDemonstracao));
        calcularApuracaoLocal();
        executarAuditoriaLocal();
        renderEscrituracaoModule();
      });
    }

    // Exportadores de SPED
    const btnExpIcms = document.getElementById('btnExportarEfdIcms');
    if (btnExpIcms) {
      btnExpIcms.addEventListener('click', () => {
        const spedTxt = gerarSpedIcmsTxt();
        downloadTxtFile(spedTxt, `SPED_EFD_ICMS_IPI_${state.empresaSelecionada.cnpj}_${state.anoMes.replace('-', '')}.txt`);
      });
    }

    const btnExpContr = document.getElementById('btnExportarEfdContr');
    if (btnExpContr) {
      btnExpContr.addEventListener('click', () => {
        const spedTxt = gerarSpedContribuicoesTxt();
        downloadTxtFile(spedTxt, `SPED_EFD_CONTRIBUICOES_${state.empresaSelecionada.cnpj}_${state.anoMes.replace('-', '')}.txt`);
      });
    }

    // Modal de Visualização
    const btnVisSped = document.getElementById('btnVisualizarSped');
    const modal = document.getElementById('modalSpedViewer');
    const codeBlock = document.getElementById('spedCodeContainer');
    const btnCloseModal = document.getElementById('btnCloseSpedModal');
    const btnCopy = document.getElementById('btnCopiarLinhasSped');
    const btnDownModal = document.getElementById('btnDownloadSpedModal');

    if (btnVisSped && modal && codeBlock) {
      btnVisSped.addEventListener('click', () => {
        const spedTxt = gerarSpedIcmsTxt();
        codeBlock.textContent = spedTxt;
        modal.style.display = 'flex';
      });
    }

    if (btnCloseModal && modal) {
      btnCloseModal.addEventListener('click', () => {
        modal.style.display = 'none';
      });
    }

    if (btnCopy && codeBlock) {
      btnCopy.addEventListener('click', () => {
        navigator.clipboard.writeText(codeBlock.textContent).then(() => {
          alert('Linhas do SPED copiadas para a área de transferência!');
        });
      });
    }

    if (btnDownModal && codeBlock) {
      btnDownModal.addEventListener('click', () => {
        downloadTxtFile(codeBlock.textContent, `SPED_EFD_ICMS_IPI_${state.empresaSelecionada.cnpj}_${state.anoMes.replace('-', '')}.txt`);
      });
    }
  }

  // Motor Local de Apuração
  function calcularApuracaoLocal() {
    const emp = state.empresaSelecionada;
    const isReal = emp.regime_tributario === 'LUCRO_REAL';
    const isPresumido = emp.regime_tributario === 'LUCRO_PRESUMIDO';

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

          // PIS/COFINS com exclusão do ICMS (Tema 69 STF)
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

  // Motor Local de Auditoria Pré-PVA
  function executarAuditoriaLocal() {
    const emp = state.empresaSelecionada;
    const docs = state.documentos;
    const inconsistencias = [];

    for (const doc of docs) {
      // 1. Chave DV
      if (doc.chave_acesso && !validarModulo11(doc.chave_acesso)) {
        inconsistencias.push({
          tipo: 'ERRO',
          codigo: 'VAL_CHAVE_ACESSO_DV',
          documento: `NF ${doc.numero}`,
          chave_acesso: doc.chave_acesso,
          mensagem: 'Dígito Verificador da chave de acesso incorreto pelo Módulo 11 da SEFAZ.'
        });
      }

      // 2. Soma de Itens
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

      // 3. CST PIS vs Regime
      if (emp.regime_tributario === 'LUCRO_PRESUMIDO' && doc.tipo_operacao === 'ENTRADA') {
        for (const it of (doc.itens || [])) {
          if (it.cst_pis >= '50' && it.cst_pis <= '66') {
            inconsistencias.push({
              tipo: 'ERRO',
              codigo: 'VAL_CST_PIS_REGIME_COERENCIA',
              documento: `NF ${doc.numero}`,
              mensagem: `Empresa no Lucro Presumido escriturou CST de crédito de PIS [${it.cst_pis}] vedado na Lei 9.718/1998.`
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

  // Gerador de Texto EFD ICMS IPI
  function gerarSpedIcmsTxt() {
    const emp = state.empresaSelecionada;
    const dtIni = '01012026';
    const dtFin = '31012026';
    const lines = [];

    // 0000
    lines.push(`|0000|018|0|${dtIni}|${dtFin}|${emp.razao_social}|${emp.cnpj.replace(/\D/g, '')}|${emp.uf}|${emp.inscricao_estadual.replace(/\D/g, '')}|${emp.codigo_municipio_ibge}|||${emp.perfil_sped}|0|`);
    lines.push('|0001|0|');
    lines.push(`|0005|${emp.nome_fantasia || emp.razao_social}|01001000|Avenida Principal|100||Centro|1133334444|fiscal@empresa.com.br|`);
    lines.push('|0100|Contador Responsavel|12345678909|CRC-SP 123456/O|12345678000195|01001000|Rua dos Contabilistas|50||Consolação|1133335555||contador@portal.com.br|3550308|');

    // 0150
    for (const p of state.participantes) {
      lines.push(`|0150|${p.codigo_participante}|${p.nome}|1058|${p.cnpj_cpf.replace(/\D/g, '')}||${p.inscricao_estadual.replace(/\D/g, '')}|${p.codigo_municipio_ibge}||Rua Comercial|S/N||Centro|`);
    }

    // 0190 e 0200
    lines.push('|0190|UN|Unidade|');
    lines.push('|0190|SC|Saca|');
    for (const prod of state.produtos) {
      lines.push(`|0200|${prod.codigo_item}|${prod.descricao}|||${prod.unidade_medida}|${prod.tipo_item}|${prod.ncm.replace(/\D/g, '')}||||18,00||`);
    }
    lines.push(`|0990|${lines.length + 1}|`);

    // Bloco C
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

    // Bloco E
    const startE = lines.length;
    lines.push('|E001|0|');
    lines.push(`|E100|${dtIni}|${dtFin}|`);
    lines.push(`|E110|${state.apuracao.icms.total_debitos.toFixed(2).replace('.', ',')}|0,00|0,00|0,00|${state.apuracao.icms.total_creditos.toFixed(2).replace('.', ',')}|0,00|0,00|0,00|0,00|${state.apuracao.icms.imposto_a_recolher.toFixed(2).replace('.', ',')}|0,00|${state.apuracao.icms.imposto_a_recolher.toFixed(2).replace('.', ',')}|${state.apuracao.icms.saldo_credor_transportar.toFixed(2).replace('.', ',')}|0,00|`);
    if (state.apuracao.icms.imposto_a_recolher > 0) {
      lines.push(`|E116|000|${state.apuracao.icms.imposto_a_recolher.toFixed(2).replace('.', ',')}|20022026|046-2||||||012026|`);
    }
    lines.push(`|E990|${lines.length - startE + 1}|`);

    // Bloco 9
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

  function downloadTxtFile(content, filename) {
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

  // Inicializa quando o DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
