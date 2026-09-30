# 🏛️ Portal do Contador

> **Hub Fiscal, Contábil e Financeiro com Inteligência e Automação de Documentos.**

O **Portal do Contador** foi concebido para ser uma suíte completa de ferramentas essenciais para escritórios de contabilidade, contadores autônomos e analistas fiscais.

A primeira ferramenta lançada e totalmente funcional é o **Interpretador Inteligente de Notas Fiscais (NF-e, NFC-e e NFS-e)**, com suporte a arquivos **XML** e **PDF (DANFE)**.

---

## 🚀 Ferramenta 1: Interpretador de Notas Fiscais

Permite que o contador ou assistente fiscal envie notas fiscais em lote ou unitárias e receba imediatamente um raio-x legível, amigável e validado de todos os campos do documento.

### Principais Funcionalidades:
1. **Suporte Dual a XML e PDF:**
   - **XML:** Extração exata e aprofundada da árvore oficial da SEFAZ (Layout 4.00, 3.10 e NFS-e ABRASF).
   - **PDF:** Extração de texto e padrões de DANFE com leitor OCR/Textual integrado (via PDF.js local).
2. **Resumo Executivo Instantâneo:**
   - Chave de Acesso formatada em blocos de 4 dígitos com validador de dígito verificador (Módulo 11 SEFAZ).
   - Botão de cópia rápida e link direto de consulta ao Portal Nacional da SEFAZ.
   - Número da nota, série, data/hora de emissão e natureza da operação.
3. **Quadro Tributário e Financeiro (KPIs):**
   - Valor Total da Nota Fiscal e Total dos Produtos.
   - Carga Tributária Total Estimada (com percentual relativo sobre o faturamento).
   - ICMS Próprio com Base de Cálculo e Alíquota média.
   - ICMS Substituição Tributária (ST).
   - IPI (Imposto sobre Produtos Industrializados).
   - PIS e COFINS com discriminação detalhada.
   - Frete, Seguro, Despesas Acessórias e Descontos Comerciais.
4. **Emitente & Destinatário Lado a Lado:**
   - Razão Social, Fantasia, CNPJ/CPF formatado, Inscrição Estadual, Regime Tributário (CRT: Simples Nacional vs Regime Normal), endereço completo e contatos.
5. **Tabela de Itens e Mercadorias Interativa:**
   - Busca em tempo real por descrição, código de barras, NCM ou CFOP.
   - Detalhamento de cada tributo incidente por item (CST/CSOSN, Base, Alíquota e Valor).
6. **Auditoria Contábil Automática:**
   - Checagem automática da soma de itens vs total declarado.
   - Validação da equação fundamental da NF (`Produtos - Descontos + Tributos = Total`).
   - Conferência de CFOP interno (iniciados em 1/5) vs interestadual (iniciados em 2/6) cruzando as UFs de origem e destino.
   - Validação do dígito verificador da Chave de Acesso.
7. **Exportação e Relatórios:**
   - 📥 **Exportar Itens para Excel (CSV):** Compatível nativamente com Excel em português (BOM UTF-8 e separador `;`).
   - 💻 **Exportar JSON Estruturado:** Para integração com outros sistemas ou automações.
   - 🖨️ **Imprimir Resumo Executivo:** Estilo folha A4 limpo, sem elementos desnecessários de interface.
8. **Privacidade e Segurança:**
   - Processamento **100% no navegador (Client-Side)**. Nenhuma nota fiscal ou dado do cliente é enviado para servidores externos.

---

## 🏛️ Módulo de Escrituração Fiscal & SPED

> **Engine de Ingestão DF-e, Motor de Apuração (ICMS, IPI, PIS/COFINS) e Exportação SPED EFD.**

O módulo de Escrituração Fiscal permite que escritórios contábeis processem múltiplos clientes (Multi-tenant) sob os regimes **Lucro Real**, **Lucro Presumido** e **Simples Nacional**, executando:
1. **Ingestão Inteligente com De-Para:** Conversão automática de CFOPs de saída do fornecedor para CFOPs de entrada corretos (revenda, insumos, uso/consumo, ativo imobilizado) e tratamento de CSTs de crédito.
2. **Motor de Apuração Não-Cumulativa & Cumulativa:**
   - Fechamento mensal de ICMS próprio (Registro E110).
   - Apuração de PIS/COFINS com suporte à **Tese do Século (Tema 69 STF)**, excluindo o ICMS destacado da base de cálculo das contribuições.
   - Segregação de créditos por insumo e vedação expressa para despesas de uso/consumo.
3. **Auditoria Pré-PVA com 10 Regras Fundamentais:** Verificação automática antes da importação no PVA da Receita Federal (C100 vs C170, Chave DV Módulo 11, CFOP territorialidade, CST x Alíquota, participantes e itens órfãos).
4. **Gerador Oficial de SPED Fiscal:** Produção de arquivos `.txt` delimitados por pipes (`|`) para:
   - **EFD ICMS IPI:** Blocos 0, C (C100, C170, C190), E (E100, E110, E116) e 9 (9900 totalizadores, 9999).
   - **EFD-Contribuições:** Blocos 0, C, M (M200, M600) e 9.

---

## 📂 Estrutura de Arquivos

```text
portal-do-contador/
├── index.html                   # Interface do Portal com Interpretador e Módulo de Escrituração
├── css/
│   └── style.css                # Design System com tema escuro/claro, glassmorphism e painel fiscal
├── js/
│   ├── app.js                   # Controlador do Interpretador de Notas Fiscais
│   ├── escrituracao-view.js     # Interface do Módulo de Escrituração Fiscal & SPED
│   ├── parser-xml.js            # Parser de XML no browser
│   ├── parser-pdf.js            # Parser de DANFE PDF
│   └── tax-helpers.js           # Dicionários de CFOP/CST e cálculos
├── database/
│   └── init.sql                 # DDL PostgreSQL 15+ particionado, procedures e seeds
├── server/                      # Backend Node.js do Motor Fiscal
│   ├── package.json
│   ├── test/
│   │   └── fiscal-module.test.js # Bateria de testes automatizados do módulo fiscal
│   └── src/
│       ├── server.js            # Servidor Express com endpoints REST
│       ├── db.js                # Conexão Pool com PostgreSQL
│       └── services/
│           ├── dfeParser.js     # Parser avançado de NF-e, CT-e e NFS-e
│           ├── deParaService.js # Motor de regras e fallback de De-Para fiscal
│           ├── taxCalculationEngine.js # Apuração ICMS, IPI, PIS/COFINS (Tema 69)
│           ├── preValidatorService.js  # Motor de auditoria com as 10 regras da EFD
│           ├── fiscalRepository.js     # Repositório com fallback em memória
│           └── sped/
│               ├── spedFormatter.js          # Formatador de pipes, datas e números
│               ├── efdIcmsIpiGenerator.js    # Gerador de EFD ICMS IPI oficial
│               └── efdContribuicoesGenerator.js # Gerador de EFD-Contribuições
└── README.md
```

---

## 🛠️ Como Executar

### 1. Iniciar o Servidor Backend Fiscal (Node.js):
```bash
cd server
npm install
npm start
# O servidor iniciará em http://localhost:3001
```

### 2. Rodar a Bateria de Testes Automatizados:
```bash
cd server
node test/fiscal-module.test.js
```

### 3. Executar o Frontend do Portal:
```bash
# Na raiz do projeto:
npx serve .
# Acesse http://localhost:8080 (ou a porta informada)
```
No menu lateral, clique em **"🏛️ Escrituração & SPED"** para alternar para o módulo fiscal completo.

