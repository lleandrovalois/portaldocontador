-- ============================================================================
-- PORTAL DO CONTADOR - MÓDULO DE ESCRITURAÇÃO FISCAL E SPED
-- SCHEMA RELACIONAL MULTI-TENANT PARA POSTGRESQL 15+
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enums Tributários Brasileiros
DO $$ BEGIN
    CREATE TYPE tipo_regime_tributario AS ENUM (
        'SIMPLES_NACIONAL',
        'SIMPLES_EXCESSO_SUBLIMITE',
        'LUCRO_PRESUMIDO',
        'LUCRO_REAL'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE perfil_sped AS ENUM ('A', 'B', 'C');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE tipo_operacao_fiscal AS ENUM ('ENTRADA', 'SAIDA');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE tipo_emissao_dfe AS ENUM ('PROPRIA', 'TERCEIROS');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE destinacao_item AS ENUM ('REVENDA', 'INSUMO', 'USO_CONSUMO', 'ATIVO_IMOBILIZADO', 'OUTROS');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE tipo_imposto_apuracao AS ENUM ('ICMS_PROPRIO', 'ICMS_ST', 'IPI', 'PIS', 'COFINS');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 1. TABELA DE TENANTS (Escritórios de Contabilidade)
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    razao_social VARCHAR(200) NOT NULL,
    nome_fantasia VARCHAR(150),
    cnpj CHAR(14) NOT NULL UNIQUE,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. TABELA DE EMPRESAS (Clientes do Escritório Escriturados)
CREATE TABLE IF NOT EXISTS empresas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    razao_social VARCHAR(200) NOT NULL,
    nome_fantasia VARCHAR(150),
    cnpj CHAR(14) NOT NULL,
    inscricao_estadual VARCHAR(20) NOT NULL,
    inscricao_municipal VARCHAR(20),
    codigo_municipio_ibge CHAR(7) NOT NULL,
    uf CHAR(2) NOT NULL,
    suframa VARCHAR(9),
    regime_tributario tipo_regime_tributario NOT NULL DEFAULT 'LUCRO_PRESUMIDO',
    perfil_sped perfil_sped NOT NULL DEFAULT 'A',
    ind_atividade CHAR(1) NOT NULL DEFAULT '0', -- 0: Industrial, 1: Outros
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_empresa_tenant_cnpj UNIQUE (tenant_id, cnpj)
);

-- 3. PARTICIPANTES (Registro 0150 SPED: Clientes e Fornecedores)
CREATE TABLE IF NOT EXISTS participantes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    codigo_participante VARCHAR(60) NOT NULL,
    nome VARCHAR(200) NOT NULL,
    cnpj_cpf VARCHAR(14) NOT NULL,
    inscricao_estadual VARCHAR(20),
    codigo_municipio_ibge CHAR(7) NOT NULL,
    uf CHAR(2) NOT NULL,
    codigo_pais CHAR(4) NOT NULL DEFAULT '1058',
    suframa VARCHAR(9),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_participante_tenant_cod UNIQUE (tenant_id, codigo_participante)
);
CREATE INDEX IF NOT EXISTS idx_participantes_doc ON participantes(tenant_id, cnpj_cpf);

-- 4. ITENS / PRODUTOS (Registro 0200 SPED)
CREATE TABLE IF NOT EXISTS produtos_servicos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    codigo_item VARCHAR(60) NOT NULL,
    descricao VARCHAR(255) NOT NULL,
    codigo_barra_gtin VARCHAR(14),
    unidade_medida CHAR(6) NOT NULL,
    tipo_item CHAR(2) NOT NULL DEFAULT '00', -- 00: Revenda, 01: Matéria-Prima
    ncm CHAR(8) NOT NULL,
    cest CHAR(7),
    aliquota_icms_padrao NUMERIC(7,4) DEFAULT 18.0000,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_produto_empresa_cod UNIQUE (tenant_id, empresa_id, codigo_item)
);

-- 5. DOCUMENTOS FISCAIS (Cabeçalho - Registro C100)
CREATE TABLE IF NOT EXISTS documentos_fiscais (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    participante_id UUID REFERENCES participantes(id) ON DELETE SET NULL,
    chave_acesso CHAR(44) NOT NULL,
    modelo CHAR(2) NOT NULL DEFAULT '55',
    serie VARCHAR(4) NOT NULL DEFAULT '1',
    numero INTEGER NOT NULL,
    tipo_operacao tipo_operacao_fiscal NOT NULL,
    tipo_emissao tipo_emissao_dfe NOT NULL,
    situacao_documento CHAR(2) NOT NULL DEFAULT '00', -- 00 = Regular
    data_emissao DATE NOT NULL,
    data_entrada_saida DATE NOT NULL,
    natureza_operacao VARCHAR(100) NOT NULL,
    indicador_pagamento CHAR(1) NOT NULL DEFAULT '0',
    indicador_frete CHAR(1) NOT NULL DEFAULT '9',
    
    valor_produtos NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    valor_desconto NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    valor_frete NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    valor_seguro NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    valor_outras_despesas NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    valor_total_documento NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    
    valor_bc_icms NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    valor_icms NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    valor_bc_icms_st NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    valor_icms_st NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    valor_ipi NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    valor_pis NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    valor_cofins NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    
    xml_conteudo TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id, data_emissao)
) PARTITION BY RANGE (data_emissao);

-- Partição padrão de anos recentes e futuros
CREATE TABLE IF NOT EXISTS documentos_fiscais_padrao PARTITION OF documentos_fiscais
    FOR VALUES FROM ('2024-01-01') TO ('2030-01-01');

CREATE INDEX IF NOT EXISTS idx_doc_fiscal_busca 
    ON documentos_fiscais (tenant_id, empresa_id, data_entrada_saida, tipo_operacao);

CREATE INDEX IF NOT EXISTS idx_doc_fiscal_chave 
    ON documentos_fiscais (tenant_id, chave_acesso);

-- 6. ITENS DE DOCUMENTOS FISCAIS (Registro C170)
CREATE TABLE IF NOT EXISTS documentos_fiscais_itens (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    documento_id UUID NOT NULL,
    data_emissao DATE NOT NULL,
    tenant_id UUID NOT NULL,
    numero_item INTEGER NOT NULL,
    produto_id UUID NOT NULL REFERENCES produtos_servicos(id) ON DELETE CASCADE,
    descricao_complementar VARCHAR(255),
    quantidade_comercial NUMERIC(15,4) NOT NULL,
    unidade_medida VARCHAR(6) NOT NULL DEFAULT 'UN',
    valor_unitario NUMERIC(21,10) NOT NULL,
    valor_bruto NUMERIC(15,2) NOT NULL,
    valor_desconto NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    destinacao_item destinacao_item NOT NULL DEFAULT 'REVENDA',
    
    cfop_origem CHAR(4) NOT NULL,
    cfop_escriturado CHAR(4) NOT NULL,
    cst_icms CHAR(3) NOT NULL DEFAULT '00',
    percentual_reducao_bc_icms NUMERIC(7,4) DEFAULT 0.0000,
    valor_bc_icms NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    aliquota_icms NUMERIC(7,4) NOT NULL DEFAULT 0.0000,
    valor_icms NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    valor_bc_icms_st NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    aliquota_icms_st NUMERIC(7,4) NOT NULL DEFAULT 0.0000,
    valor_icms_st NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    
    cst_ipi CHAR(2) DEFAULT '99',
    codigo_enquadramento_ipi CHAR(3) DEFAULT '999',
    valor_bc_ipi NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    aliquota_ipi NUMERIC(7,4) NOT NULL DEFAULT 0.0000,
    valor_ipi NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    
    cst_pis CHAR(2) NOT NULL DEFAULT '70',
    valor_bc_pis NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    aliquota_pis NUMERIC(7,4) NOT NULL DEFAULT 0.0000,
    valor_pis NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    
    cst_cofins CHAR(2) NOT NULL DEFAULT '70',
    valor_bc_cofins NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    aliquota_cofins NUMERIC(7,4) NOT NULL DEFAULT 0.0000,
    valor_cofins NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    
    PRIMARY KEY (id, data_emissao)
) PARTITION BY RANGE (data_emissao);

CREATE TABLE IF NOT EXISTS documentos_fiscais_itens_padrao PARTITION OF documentos_fiscais_itens
    FOR VALUES FROM ('2024-01-01') TO ('2030-01-01');

CREATE INDEX IF NOT EXISTS idx_itens_apuracao_cfop 
    ON documentos_fiscais_itens (tenant_id, data_emissao, cfop_escriturado, cst_icms);

-- 7. REGRAS FISCAIS DE-PARA
CREATE TABLE IF NOT EXISTS regras_fiscais_depara (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
    participante_id UUID REFERENCES participantes(id) ON DELETE CASCADE,
    ncm CHAR(8),
    cfop_origem CHAR(4) NOT NULL,
    destinacao destinacao_item NOT NULL,
    
    cfop_escriturado CHAR(4) NOT NULL,
    cst_icms_escriturado CHAR(3) NOT NULL,
    cst_pis_escriturado CHAR(2) NOT NULL,
    cst_cofins_escriturado CHAR(2) NOT NULL,
    credita_icms BOOLEAN NOT NULL DEFAULT FALSE,
    credita_ipi BOOLEAN NOT NULL DEFAULT FALSE,
    credita_pis_cofins BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 8. APURAÇÕES MENSAIS
CREATE TABLE IF NOT EXISTS apuracoes_mensais (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    ano_mes CHAR(7) NOT NULL,
    imposto tipo_imposto_apuracao NOT NULL,
    data_fechamento TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) NOT NULL DEFAULT 'FECHADO',
    
    saldo_credor_anterior NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    total_debitos NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    total_creditos NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    total_outros_debitos NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    total_outros_creditos NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    total_estorno_debitos NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    total_estorno_creditos NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    saldo_devedor_apurado NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    total_deducoes NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    imposto_a_recolher NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    saldo_credor_transportar NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    
    memoria_calculo JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_apuracao_mensal UNIQUE (tenant_id, empresa_id, ano_mes, imposto)
);

-- ============================================================================
-- DADOS INICIAIS (SEED) PARA DEMONSTRAÇÃO E TESTES IMEDIATOS
-- ============================================================================

INSERT INTO tenants (id, razao_social, nome_fantasia, cnpj)
VALUES 
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Escritório Contábil Alfa & Associados', 'Alfa Contabilidade', '12345678000195')
ON CONFLICT (cnpj) DO NOTHING;

INSERT INTO empresas (id, tenant_id, razao_social, nome_fantasia, cnpj, inscricao_estadual, codigo_municipio_ibge, uf, regime_tributario, perfil_sped)
VALUES 
    ('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Comércio Distribuidor Paulistano Ltda', 'Distribuidora Paulistano', '28192837000109', '112233445566', '3550308', 'SP', 'LUCRO_REAL', 'A'),
    ('c2eebc99-9c0b-4ef8-bb6d-6bb9bd380c33', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Varejo Bom Preço Alimentos Eireli', 'Supermercado Bom Preço', '98765432000188', '998877665544', '3550308', 'SP', 'LUCRO_PRESUMIDO', 'A'),
    ('d3eebc99-9c0b-4ef8-bb6d-6bb9bd380d44', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Padaria & Confeitaria Sabor Ltda ME', 'Sabor da Vila', '44556677000122', '334455667788', '3550308', 'SP', 'SIMPLES_NACIONAL', 'B')
ON CONFLICT DO NOTHING;

-- Participantes de Exemplo
INSERT INTO participantes (id, tenant_id, codigo_participante, nome, cnpj_cpf, inscricao_estadual, codigo_municipio_ibge, uf)
VALUES
    ('e4eebc99-9c0b-4ef8-bb6d-6bb9bd380e55', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'FORN001', 'Indústria Química Nacional S.A.', '01234567000189', '123456789012', '3550308', 'SP'),
    ('f5eebc99-9c0b-4ef8-bb6d-6bb9bd380f66', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'CLI001', 'Supermercados Estrela do Sul Ltda', '55667788000144', '456789012345', '4106902', 'PR')
ON CONFLICT DO NOTHING;

-- Produtos de Exemplo
INSERT INTO produtos_servicos (id, tenant_id, empresa_id, codigo_item, descricao, unidade_medida, tipo_item, ncm, aliquota_icms_padrao)
VALUES
    ('11111111-1111-1111-1111-111111111111', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22', 'PROD001', 'Solvente Industrial Alifático 20L', 'UN', '00', '29011000', 18.0000),
    ('22222222-2222-2222-2222-222222222222', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22', 'PROD002', 'Resina Termoplástica Especial 50kg', 'SC', '01', '39011010', 18.0000)
ON CONFLICT DO NOTHING;

-- Regras Fiscais De-Para Iniciais
INSERT INTO regras_fiscais_depara (tenant_id, empresa_id, cfop_origem, destinacao, cfop_escriturado, cst_icms_escriturado, cst_pis_escriturado, cst_cofins_escriturado, credita_icms, credita_ipi, credita_pis_cofins)
VALUES
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22', '5102', 'REVENDA', '1102', '00', '50', '50', true, false, true),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22', '6102', 'REVENDA', '2102', '00', '50', '50', true, false, true),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22', '5101', 'INSUMO', '1101', '00', '50', '50', true, true, true),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22', '5102', 'USO_CONSUMO', '1556', '90', '70', '70', false, false, false)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- PROCEDURES E FUNÇÕES DE APURAÇÃO TRIBUTÁRIA
-- ============================================================================

CREATE OR REPLACE FUNCTION fechar_apuracao_icms(
    p_tenant_id UUID,
    p_empresa_id UUID,
    p_ano_mes CHAR(7),
    p_data_inicio DATE,
    p_data_fim DATE
) RETURNS UUID AS $$
DECLARE
    v_saldo_anterior NUMERIC(15,2) := 0.00;
    v_total_debitos NUMERIC(15,2) := 0.00;
    v_total_creditos NUMERIC(15,2) := 0.00;
    v_saldo_devedor NUMERIC(15,2) := 0.00;
    v_saldo_credor_transp NUMERIC(15,2) := 0.00;
    v_imposto_recolher NUMERIC(15,2) := 0.00;
    v_memoria JSONB;
    v_apuracao_id UUID;
    v_mes_anterior CHAR(7);
BEGIN
    v_mes_anterior := to_char((p_data_inicio - INTERVAL '1 day')::date, 'YYYY-MM');
    SELECT COALESCE(saldo_credor_transportar, 0.00)
    INTO v_saldo_anterior
    FROM apuracoes_mensais
    WHERE tenant_id = p_tenant_id 
      AND empresa_id = p_empresa_id 
      AND ano_mes = v_mes_anterior 
      AND imposto = 'ICMS_PROPRIO';

    SELECT COALESCE(SUM(i.valor_icms), 0.00)
    INTO v_total_debitos
    FROM documentos_fiscais_itens i
    JOIN documentos_fiscais d ON d.id = i.documento_id AND d.data_emissao = i.data_emissao
    WHERE i.tenant_id = p_tenant_id
      AND d.empresa_id = p_empresa_id
      AND i.data_emissao >= p_data_inicio AND i.data_emissao < p_data_fim
      AND d.tipo_operacao = 'SAIDA'
      AND d.situacao_documento = '00';

    SELECT COALESCE(SUM(i.valor_icms), 0.00)
    INTO v_total_creditos
    FROM documentos_fiscais_itens i
    JOIN documentos_fiscais d ON d.id = i.documento_id AND d.data_emissao = i.data_emissao
    WHERE i.tenant_id = p_tenant_id
      AND d.empresa_id = p_empresa_id
      AND i.data_emissao >= p_data_inicio AND i.data_emissao < p_data_fim
      AND d.tipo_operacao = 'ENTRADA'
      AND d.situacao_documento = '00'
      AND i.cst_icms IN ('00', '10', '20', '70')
      AND i.destinacao_item IN ('REVENDA', 'INSUMO');

    IF (v_total_debitos > (v_total_creditos + v_saldo_anterior)) THEN
        v_saldo_devedor := v_total_debitos - (v_total_creditos + v_saldo_anterior);
        v_imposto_recolher := v_saldo_devedor;
        v_saldo_credor_transp := 0.00;
    ELSE
        v_saldo_devedor := 0.00;
        v_imposto_recolher := 0.00;
        v_saldo_credor_transp := (v_total_creditos + v_saldo_anterior) - v_total_debitos;
    END IF;

    v_memoria := jsonb_build_object(
        'apurado_em', CURRENT_TIMESTAMP,
        'saldo_credor_anterior', v_saldo_anterior,
        'total_debitos_saida', v_total_debitos,
        'total_creditos_entrada', v_total_creditos,
        'imposto_recolher', v_imposto_recolher,
        'saldo_credor_transportar', v_saldo_credor_transp
    );

    INSERT INTO apuracoes_mensais (
        tenant_id, empresa_id, ano_mes, imposto, status,
        saldo_credor_anterior, total_debitos, total_creditos,
        saldo_devedor_apurado, imposto_a_recolher, saldo_credor_transportar,
        memoria_calculo
    ) VALUES (
        p_tenant_id, p_empresa_id, p_ano_mes, 'ICMS_PROPRIO', 'FECHADO',
        v_saldo_anterior, v_total_debitos, v_total_creditos,
        v_saldo_devedor, v_imposto_recolher, v_saldo_credor_transp,
        v_memoria
    )
    ON CONFLICT (tenant_id, empresa_id, ano_mes, imposto) DO UPDATE SET
        saldo_credor_anterior = EXCLUDED.saldo_credor_anterior,
        total_debitos = EXCLUDED.total_debitos,
        total_creditos = EXCLUDED.total_creditos,
        saldo_devedor_apurado = EXCLUDED.saldo_devedor_apurado,
        imposto_a_recolher = EXCLUDED.imposto_a_recolher,
        saldo_credor_transportar = EXCLUDED.saldo_credor_transportar,
        memoria_calculo = EXCLUDED.memoria_calculo,
        data_fechamento = CURRENT_TIMESTAMP
    RETURNING id INTO v_apuracao_id;

    RETURN v_apuracao_id;
END;
$$ LANGUAGE plpgsql;

