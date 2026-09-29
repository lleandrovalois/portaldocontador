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

## 📂 Estrutura de Arquivos

```text
portal-do-contador/
├── index.html               # Interface principal e dashboard modular
├── css/
│   └── style.css            # Design System (dark/light, glassmorphism, responsivo, print)
├── js/
│   ├── app.js               # Gerenciador de eventos, KPIs e renderização dinâmica
│   ├── parser-xml.js        # Motor de interpretação de XML NF-e/NFC-e/NFS-e
│   ├── parser-pdf.js        # Motor de interpretação de DANFE PDF
│   ├── tax-helpers.js       # Dicionários de CFOP/CST, formatação BRL e auditor contábil
│   ├── sample-data.js       # Exemplos reais embutidos para testes imediatos
│   └── export-utils.js      # Gerador de CSV para Excel, JSON e relatórios
├── vendor/
│   ├── pdf.min.js           # Biblioteca PDF.js empacotada localmente (offline)
│   └── pdf.worker.min.js    # Web Worker do PDF.js
└── README.md                # Documentação do projeto
```

---

## 🛠️ Como Executar

O projeto é construído em Vanilla HTML5, CSS3 e JavaScript moderno, sem depender de compilação complexa:

1. **Via Servidor Local (Recomendado):**
   ```bash
   npx serve .
   # ou
   python -m http.server 8080
   ```
2. Abra `http://localhost:8080` (ou a porta exibida) no navegador.

---

## 🗺️ Próximas Ferramentas no Roadmap do Portal

- [ ] **Módulo 2: Calculadora de Impostos:** Simulação de DAS (Simples Nacional - Anexos I a V), Lucro Presumido e Fator R.
- [ ] **Módulo 3: Agenda Fiscal e Calendário de Obrigações:** Prazos de DCTF, EFD-Reinf, SPED Fiscal, DAS e parcelamentos.
- [ ] **Módulo 4: Comparador e Auditor Cruzado de XMLs:** Comparação entre o pedido de compra e o XML do fornecedor para identificar divergências de preços ou alíquotas.
