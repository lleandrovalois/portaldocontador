/**
 * Serviço de Resolução de "De-Para" Fiscal
 * Mapeia o CFOP e CST da ótica do Fornecedor (Saída) para a ótica do Destinatário (Entrada),
 * considerando a Territorialidade (Interna vs Interestadual), Destinação Econômica e Regime Tributário.
 */
export class DeParaService {
  constructor(dbPool = null) {
    this.dbPool = dbPool;
  }

  /**
   * Resolve o item de entrada com base nas regras cadastradas ou fallback legal
   */
  async resolveItemEntrada({
    tenantId,
    empresaId,
    participanteId = null,
    ncm = null,
    cfopFornecedor,
    ufFornecedor,
    ufEmpresa,
    destinacao = 'REVENDA',
    regimeTributario = 'LUCRO_PRESUMIDO'
  }) {
    // 1. Tentar regra customizada se houver banco disponível
    if (this.dbPool) {
      try {
        const custom = await this.buscarRegraCustomizada(
          tenantId,
          empresaId,
          participanteId,
          ncm,
          cfopFornecedor,
          destinacao
        );
        if (custom) return custom;
      } catch (err) {
        console.warn('⚠️ [DeParaService] Erro ao consultar regras customizadas:', err.message);
      }
    }

    // 2. Fallback Baseado nas Regras Fundamentais da Legislação Fiscal Brasileira
    const isInterna = String(ufFornecedor).toUpperCase() === String(ufEmpresa).toUpperCase();
    return this.aplicarMatrizPadrao(cfopFornecedor, isInterna, destinacao, regimeTributario);
  }

  /**
   * Consulta a tabela regras_fiscais_depara por ordem de especificidade:
   * 1. Participante + NCM
   * 2. NCM apenas
   * 3. Participante apenas
   * 4. Regra Geral da Empresa
   */
  async buscarRegraCustomizada(tenantId, empresaId, participanteId, ncm, cfop, destinacao) {
    const query = `
      SELECT cfop_escriturado, cst_icms_escriturado, cst_pis_escriturado, cst_cofins_escriturado,
             credita_icms, credita_ipi, credita_pis_cofins
      FROM regras_fiscais_depara
      WHERE tenant_id = $1 
        AND (empresa_id = $2 OR empresa_id IS NULL)
        AND cfop_origem = $3
        AND destinacao = $4
        AND (participante_id = $5 OR participante_id IS NULL)
        AND (ncm = $6 OR ncm IS NULL)
      ORDER BY 
        CASE WHEN participante_id IS NOT NULL AND ncm IS NOT NULL THEN 1
             WHEN ncm IS NOT NULL THEN 2
             WHEN participante_id IS NOT NULL THEN 3
             ELSE 4 END ASC
      LIMIT 1;
    `;
    const res = await this.dbPool.query(query, [tenantId, empresaId, cfop, destinacao, participanteId, ncm]);
    return res.rows[0] || null;
  }

  /**
   * Matriz Padrão de Conversão Fiscal (Conforme Convênios ICMS e Leis 10.637 / 10.833 / LC 123)
   */
  aplicarMatrizPadrao(cfopFornecedor, isInterna, destinacao, regime) {
    const prefixo = isInterna ? '1' : '2';
    const isST = ['5401', '5403', '5405', '6401', '6403', '6404'].includes(String(cfopFornecedor));

    let sufixoCfop = '102'; // Revenda
    let cstIcms = '00';
    let cstPisCofins = regime === 'LUCRO_REAL' ? '50' : '70';
    let creditaIcms = false;
    let creditaPisCofins = regime === 'LUCRO_REAL';

    switch (destinacao) {
      case 'REVENDA':
        sufixoCfop = isST ? '403' : '102';
        cstIcms = isST ? '60' : '00';
        creditaIcms = regime !== 'SIMPLES_NACIONAL';
        break;

      case 'INSUMO':
        sufixoCfop = isST ? '401' : '101';
        cstIcms = isST ? '10' : '00';
        creditaIcms = regime !== 'SIMPLES_NACIONAL';
        break;

      case 'USO_CONSUMO':
        sufixoCfop = isST ? '407' : '556';
        cstIcms = '90';
        cstPisCofins = '70'; // Operação de aquisição sem direito a crédito
        creditaIcms = false;
        creditaPisCofins = false;
        break;

      case 'ATIVO_IMOBILIZADO':
        sufixoCfop = isST ? '406' : '551';
        cstIcms = '90';      // Crédito apropriado via CIAP (Bloco G) em 1/48 avos
        cstPisCofins = regime === 'LUCRO_REAL' ? '73' : '70';
        creditaIcms = false; // Não credita no C170, e sim no Bloco G
        creditaPisCofins = false;
        break;

      default:
        sufixoCfop = '949';
        cstIcms = '90';
        cstPisCofins = '99';
        creditaIcms = false;
        creditaPisCofins = false;
        break;
    }

    if (regime === 'SIMPLES_NACIONAL') {
      cstIcms = isST ? '500' : '102';
      cstPisCofins = '99';
      creditaIcms = false;
      creditaPisCofins = false;
    }

    return {
      cfop_escriturado: `${prefixo}${sufixoCfop}`,
      cst_icms_escriturado: cstIcms,
      cst_pis_escriturado: cstPisCofins,
      cst_cofins_escriturado: cstPisCofins,
      credita_icms: creditaIcms,
      credita_ipi: false,
      credita_pis_cofins: creditaPisCofins
    };
  }
}
