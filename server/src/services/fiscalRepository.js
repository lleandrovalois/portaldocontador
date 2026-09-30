import { pool, isDbConnected } from '../db.js';

/**
 * Repositório Unificado de Escrituração Fiscal
 * Opera sobre PostgreSQL com fallback inteligente em memória para testes e desenvolvimento autônomo.
 */
export class FiscalRepository {
  constructor() {
    this.memoryStore = {
      tenants: [
        {
          id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
          razao_social: 'Escritório Contábil Alfa & Associados',
          nome_fantasia: 'Alfa Contabilidade',
          cnpj: '12345678000195'
        }
      ],
      empresas: [
        {
          id: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22',
          tenant_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
          razao_social: 'Minha Empresa Cliente Ltda',
          nome_fantasia: 'Minha Empresa',
          cnpj: '00000000000100',
          inscricao_estadual: 'ISENTO',
          codigo_municipio_ibge: '3550308',
          uf: 'SP',
          regime_tributario: 'LUCRO_PRESUMIDO',
          perfil_sped: 'A',
          ind_atividade: '0'
        }
      ],
      participantes: [],
      produtos: [],
      regrasDePara: [
        {
          id: 'r1',
          tenant_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
          empresa_id: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22',
          cfop_origem: '5102',
          destinacao: 'REVENDA',
          cfop_escriturado: '1102',
          cst_icms_escriturado: '00',
          cst_pis_escriturado: '50',
          cst_cofins_escriturado: '50',
          credita_icms: true,
          credita_ipi: false,
          credita_pis_cofins: true
        },
        {
          id: 'r2',
          tenant_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
          empresa_id: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22',
          cfop_origem: '6102',
          destinacao: 'REVENDA',
          cfop_escriturado: '2102',
          cst_icms_escriturado: '00',
          cst_pis_escriturado: '50',
          cst_cofins_escriturado: '50',
          credita_icms: true,
          credita_ipi: false,
          credita_pis_cofins: true
        }
      ],
      documentos: [],
      apuracoes: []
    };
  }

  async getEmpresas(tenantId) {
    if (isDbConnected()) {
      try {
        const res = await pool.query('SELECT * FROM empresas WHERE tenant_id = $1 ORDER BY razao_social', [tenantId]);
        return res.rows;
      } catch (e) {
        console.warn('DB error, using memory store:', e.message);
      }
    }
    return this.memoryStore.empresas.filter(e => e.tenant_id === tenantId);
  }

  async getEmpresaById(tenantId, empresaId) {
    if (isDbConnected()) {
      try {
        const res = await pool.query('SELECT * FROM empresas WHERE tenant_id = $1 AND id = $2', [tenantId, empresaId]);
        return res.rows[0] || null;
      } catch (e) {
        console.warn('DB error, using memory store:', e.message);
      }
    }
    return this.memoryStore.empresas.find(e => e.tenant_id === tenantId && e.id === empresaId) || null;
  }

  async getParticipantes(tenantId) {
    if (isDbConnected()) {
      try {
        const res = await pool.query('SELECT * FROM participantes WHERE tenant_id = $1', [tenantId]);
        return res.rows;
      } catch (e) {
        console.warn('DB error, using memory store:', e.message);
      }
    }
    return this.memoryStore.participantes.filter(p => p.tenant_id === tenantId);
  }

  async upsertParticipante(tenantId, participante) {
    if (isDbConnected()) {
      try {
        const query = `
          INSERT INTO participantes (tenant_id, codigo_participante, nome, cnpj_cpf, inscricao_estadual, codigo_municipio_ibge, uf, codigo_pais)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (tenant_id, codigo_participante) DO UPDATE SET
            nome = EXCLUDED.nome,
            inscricao_estadual = EXCLUDED.inscricao_estadual,
            uf = EXCLUDED.uf
          RETURNING *;
        `;
        const res = await pool.query(query, [
          tenantId,
          participante.codigo_participante,
          participante.nome,
          participante.cnpj_cpf,
          participante.inscricao_estadual,
          participante.codigo_municipio_ibge || '3550308',
          participante.uf || 'SP',
          participante.codigo_pais || '1058'
        ]);
        return res.rows[0];
      } catch (e) {
        console.warn('DB error, using memory store:', e.message);
      }
    }

    const idx = this.memoryStore.participantes.findIndex(
      p => p.tenant_id === tenantId && (p.codigo_participante === participante.codigo_participante || p.cnpj_cpf === participante.cnpj_cpf)
    );
    if (idx >= 0) {
      this.memoryStore.participantes[idx] = { ...this.memoryStore.participantes[idx], ...participante };
      return this.memoryStore.participantes[idx];
    }
    const novo = { id: `part-${Date.now()}`, tenant_id: tenantId, ...participante };
    this.memoryStore.participantes.push(novo);
    return novo;
  }

  async getProdutos(tenantId, empresaId) {
    if (isDbConnected()) {
      try {
        const res = await pool.query('SELECT * FROM produtos_servicos WHERE tenant_id = $1 AND empresa_id = $2', [tenantId, empresaId]);
        return res.rows;
      } catch (e) {
        console.warn('DB error, using memory store:', e.message);
      }
    }
    return this.memoryStore.produtos.filter(p => p.tenant_id === tenantId && p.empresa_id === empresaId);
  }

  async upsertProduto(tenantId, empresaId, produto) {
    if (isDbConnected()) {
      try {
        const query = `
          INSERT INTO produtos_servicos (tenant_id, empresa_id, codigo_item, descricao, unidade_medida, tipo_item, ncm, cest, codigo_barra_gtin)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          ON CONFLICT (tenant_id, empresa_id, codigo_item) DO UPDATE SET
            descricao = EXCLUDED.descricao,
            ncm = EXCLUDED.ncm
          RETURNING *;
        `;
        const res = await pool.query(query, [
          tenantId,
          empresaId,
          produto.codigo_item,
          produto.descricao,
          produto.unidade_medida || 'UN',
          produto.tipo_item || '00',
          produto.ncm || '00000000',
          produto.cest || null,
          produto.codigo_barra_gtin || null
        ]);
        return res.rows[0];
      } catch (e) {
        console.warn('DB error, using memory store:', e.message);
      }
    }

    const idx = this.memoryStore.produtos.findIndex(
      p => p.tenant_id === tenantId && p.empresa_id === empresaId && p.codigo_item === produto.codigo_item
    );
    if (idx >= 0) {
      this.memoryStore.produtos[idx] = { ...this.memoryStore.produtos[idx], ...produto };
      return this.memoryStore.produtos[idx];
    }
    const novo = { id: `prod-${Date.now()}`, tenant_id: tenantId, empresa_id: empresaId, ...produto };
    this.memoryStore.produtos.push(novo);
    return novo;
  }

  async salvarDocumento(tenantId, empresaId, documento) {
    const docCompleto = {
      id: documento.id || `doc-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      tenant_id: tenantId,
      empresa_id: empresaId,
      ...documento
    };

    if (isDbConnected()) {
      try {
        const qDoc = `
          INSERT INTO documentos_fiscais (
            id, tenant_id, empresa_id, participante_id, chave_acesso, modelo, serie, numero,
            tipo_operacao, tipo_emissao, situacao_documento, data_emissao, data_entrada_saida,
            natureza_operacao, indicador_pagamento, indicador_frete,
            valor_produtos, valor_desconto, valor_frete, valor_seguro, valor_outras_despesas, valor_total_documento,
            valor_bc_icms, valor_icms, valor_bc_icms_st, valor_icms_st, valor_ipi, valor_pis, valor_cofins
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
            $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29
          ) RETURNING *;
        `;
        const resDoc = await pool.query(qDoc, [
          docCompleto.id,
          tenantId,
          empresaId,
          docCompleto.participante_id || null,
          docCompleto.chave_acesso,
          docCompleto.modelo,
          docCompleto.serie,
          docCompleto.numero,
          docCompleto.tipo_operacao,
          docCompleto.tipo_emissao,
          docCompleto.situacao_documento || '00',
          docCompleto.data_emissao,
          docCompleto.data_entrada_saida,
          docCompleto.natureza_operacao,
          docCompleto.indicador_pagamento || '0',
          docCompleto.indicador_frete || '9',
          docCompleto.totais?.valor_produtos || 0,
          docCompleto.totais?.valor_desconto || 0,
          docCompleto.totais?.valor_frete || 0,
          docCompleto.totais?.valor_seguro || 0,
          docCompleto.totais?.valor_outras_despesas || 0,
          docCompleto.totais?.valor_total_documento || 0,
          docCompleto.totais?.valor_bc_icms || 0,
          docCompleto.totais?.valor_icms || 0,
          docCompleto.totais?.valor_bc_icms_st || 0,
          docCompleto.totais?.valor_icms_st || 0,
          docCompleto.totais?.valor_ipi || 0,
          docCompleto.totais?.valor_pis || 0,
          docCompleto.totais?.valor_cofins || 0
        ]);

        return resDoc.rows[0];
      } catch (e) {
        console.warn('DB error ao salvar documento, fallback memória:', e.message);
      }
    }

    // Fallback memória
    this.memoryStore.documentos.push(docCompleto);
    return docCompleto;
  }

  async getDocumentos(tenantId, empresaId, { anoMes, tipoOperacao } = {}) {
    if (isDbConnected()) {
      try {
        let sql = `
          SELECT d.*, p.nome as participante_nome, p.codigo_participante as participante_codigo
          FROM documentos_fiscais d
          LEFT JOIN participantes p ON p.id = d.participante_id
          WHERE d.tenant_id = $1 AND d.empresa_id = $2
        `;
        const params = [tenantId, empresaId];
        if (anoMes) {
          params.push(`${anoMes}-01`);
          sql += ` AND d.data_emissao >= $${params.length}`;
        }
        if (tipoOperacao) {
          params.push(tipoOperacao);
          sql += ` AND d.tipo_operacao = $${params.length}`;
        }
        sql += ` ORDER BY d.data_emissao DESC, d.numero DESC`;
        const res = await pool.query(sql, params);
        return res.rows;
      } catch (e) {
        console.warn('DB error getDocumentos:', e.message);
      }
    }

    return this.memoryStore.documentos.filter(d => {
      if (d.tenant_id !== tenantId || d.empresa_id !== empresaId) return false;
      if (anoMes && !d.data_emissao.startsWith(anoMes)) return false;
      if (tipoOperacao && d.tipo_operacao !== tipoOperacao) return false;
      return true;
    });
  }

  async getRegrasDePara(tenantId, empresaId) {
    if (isDbConnected()) {
      try {
        const res = await pool.query('SELECT * FROM regras_fiscais_depara WHERE tenant_id = $1 AND (empresa_id = $2 OR empresa_id IS NULL)', [tenantId, empresaId]);
        return res.rows;
      } catch (e) {
        console.warn('DB error getRegrasDePara:', e.message);
      }
    }
    return this.memoryStore.regrasDePara.filter(r => r.tenant_id === tenantId && (!r.empresa_id || r.empresa_id === empresaId));
  }

  async salvarApuracao(tenantId, empresaId, anoMes, apuracao) {
    if (isDbConnected()) {
      try {
        const q = `
          INSERT INTO apuracoes_mensais (
            tenant_id, empresa_id, ano_mes, imposto, status,
            saldo_credor_anterior, total_debitos, total_creditos,
            saldo_devedor_apurado, imposto_a_recolher, saldo_credor_transportar,
            memoria_calculo
          ) VALUES ($1, $2, $3, $4, 'FECHADO', $5, $6, $7, $8, $9, $10, $11)
          ON CONFLICT (tenant_id, empresa_id, ano_mes, imposto) DO UPDATE SET
            saldo_credor_anterior = EXCLUDED.saldo_credor_anterior,
            total_debitos = EXCLUDED.total_debitos,
            total_creditos = EXCLUDED.total_creditos,
            saldo_devedor_apurado = EXCLUDED.saldo_devedor_apurado,
            imposto_a_recolher = EXCLUDED.imposto_a_recolher,
            saldo_credor_transportar = EXCLUDED.saldo_credor_transportar,
            memoria_calculo = EXCLUDED.memoria_calculo,
            data_fechamento = CURRENT_TIMESTAMP
          RETURNING *;
        `;
        const res = await pool.query(q, [
          tenantId,
          empresaId,
          anoMes,
          apuracao.imposto,
          apuracao.saldo_credor_anterior || 0,
          apuracao.total_debitos || 0,
          apuracao.total_creditos || 0,
          apuracao.saldo_devedor_apurado || 0,
          apuracao.imposto_a_recolher || 0,
          apuracao.saldo_credor_transportar || 0,
          JSON.stringify(apuracao.memoria_calculo || {})
        ]);
        return res.rows[0];
      } catch (e) {
        console.warn('DB error salvarApuracao:', e.message);
      }
    }

    const item = {
      id: `apur-${Date.now()}`,
      tenant_id: tenantId,
      empresa_id: empresaId,
      ano_mes: anoMes,
      ...apuracao
    };
    this.memoryStore.apuracoes.push(item);
    return item;
  }
}

export const fiscalRepository = new FiscalRepository();
