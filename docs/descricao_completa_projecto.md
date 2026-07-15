# Plataforma de Relatórios ESG (VSME → ESRS) — Descrição Completa do Projecto

## 1. Objectivo

Evolução da POC para uma aplicação multiempresa de elaboração de relatórios de sustentabilidade segundo o **Voluntary Standard** da Comissão Europeia (Commission Delegated Regulation (EU) C(2026) 5011 final, 3.7.2026 — "undertakings protected by the value chain cap"), cobrindo a totalidade do Módulo Básico (B1–B11) e do Módulo Abrangente (C1–C9), com arquitectura preparada para evoluir depois para ESRS/CSRD completo.

O standard tem consistência deliberada com a ESRS, mas não é a mesma norma; a taxonomia XBRL ESRS Set 1 da EFRAG serve como referência de boas práticas de estruturação, não como obrigação (o VSME em si não tem taxonomia XBRL própria obrigatória).

## 2. Princípio arquitectural central (mantido da POC)

**Blocos estruturados (modelos validados por schema — Zod — serializados para JSONB em PostgreSQL) são a fonte de verdade.** XHTML/iXBRL são gerados dinamicamente a partir dos blocos, apenas para apresentação/entrega — nunca são armazenados como fonte de verdade.

- "JSON estruturado", "blocos validados por schema/JSONB" e "blocos estruturados" descrevem o mesmo objecto em três fases do seu ciclo de vida: definição de schema → formato de serialização → contentor de armazenamento.
- Preview/edição: HTML gerado a partir dos blocos.
- Entrega regulatória: XHTML com marcação iXBRL (formato exigido pelo Artigo 29d da Accounting Directive/CSRD para submissão via ESEF).

## 3. Stack técnico (mantido da POC)

- **Backend:** Next.js (API routes/route handlers), Zod
- **Base de dados:** Neon (PostgreSQL serverless), JSONB para blocos + tabelas relacionais para metadados
- **Frontend:** Next.js (React)
- **Deployment:** Vercel (via GitHub) — Next.js (API routes/route handlers) como serverless functions para a fase actual; migração para deployment em container de longa duração fica em aberto para quando iXBRL/PDF de produção entrarem em âmbito (compute-heavy)

Toda a lógica de cálculo/negócio vive no **backend** (camada de Domínio), nunca no frontend — ver secção 7.

## 4. Novos requisitos estruturais (face à POC)

### 4.1 Multiempresa
A aplicação suporta múltiplas empresas ("undertakings"). O utilizador escolhe a empresa com que está a trabalhar. Existe uma **lista de empresas com manutenção** (CRUD).

### 4.2 Utilizadores e controlo de acesso
Existe uma **lista de utilizadores com manutenção**. Cada utilizador só tem acesso às empresas para as quais está explicitamente autorizado (relação utilizador↔empresa).

### 4.3 Workflow em dois passos
Toda a informação de período passa por dois estados sequenciais: **Elaboração → Aprovação**.

### 4.4 Multiperíodo sequencial
A aplicação permite criar informação para vários períodos de reporte, em sequência — cada novo período parte do anterior.

## 5. Modelo de dados: mestre da empresa (SCD2) vs. dados de período

Grande parte da informação de "General Information" muda raramente e não deve ser reintroduzida em cada período. Solução adoptada: **Slowly Changing Dimension tipo 2 (SCD2)** para dados mestre da empresa.

- Tabela de dados mestre da empresa, com versões `válido_desde` / `válido_até` (ou flag `atual`).
- Cada período de reporte referencia (por FK) a versão do dado mestre em vigor nessa data — como um facto num data warehouse apontando para a surrogate key correta da dimensão.
- Edição do mestre cria nova versão; períodos anteriores continuam a apontar para a versão que estava em vigor na altura.
- **Não** é um SCD2 "fine-grained" por campo — uma versão cobre o conjunto de campos editáveis nessa edição.

**Campos classificados como dados mestre (SCD2):**
- Identificador da entidade (tipo + valor — ex. LEI, NIF), nome da entidade, moeda
- Forma legal, código(s) NACE (validado como folha da hierarquia, não categoria/agregado)
- País de operação principal
- Lista de subsidiárias (ID, nome, morada) — confirmada como SCD2 apesar de modelada como lista "por período" no template original
- Lista de sites/localizações (ID, morada, código postal, cidade, país, coordenadas GPS) — idem, SCD2 confirmado; reutilizada por referência de ID noutras disclosures (ex. B5 Biodiversidade)
- Certificações/labels de sustentabilidade (YES/NO + descrição)

**Campos que ficam fora do mestre (sempre "de período", sem carry-forward automático fora do padrão descrito em 5.1):**
- Nº de empregados, volume de negócios, balanço total (mudam sempre, são factos do período)
- Todas as métricas B3–B11 / C1–C9

### 5.1 Carry-forward para blocos de período
O próprio standard já prevê (§18–22) o mecanismo: um relatório pode indicar que certas disclosures "não mudaram" e remeter para o período anterior, sem as repetir. Padrão adoptado:
- Ao criar novo período, o sistema clona o valor aprovado do período anterior para cada bloco, como ponto de partida do rascunho, marcado com estado `herdado / não alterado`.
- Cada instância de bloco (empresa, período, disclosure) guarda proveniência: `origem` ∈ {`novo`, `herdado_sem_alteração`, `herdado_e_editado`}, com referência ao bloco do período anterior.

## 6. Tipos de bloco (taxonomia genérica)

Objectivo original mantido: pequeno número de classes genéricas que cobrem todos os casos do standard, com definição de conteúdo em dados (tabelas de definição), não em código.

| Tipo | Descrição | Exemplos |
|---|---|---|
| Métrica numérica | Valor único ou desagregado por categoria | Consumo de energia total, água withdrawal |
| Narrativa/texto livre | Texto sem estrutura | Descrição de práticas, campos "outras disclosures" |
| Tabela estruturada (fixa) | Linhas fixas definidas pelo standard, não repetíveis | Energia por fonte (electricidade/autogerada/combustíveis) |
| Tabela repetível | Linhas dinâmicas, até N (tipicamente 100), adicionadas pelo utilizador | Sites em áreas de biodiversidade, poluentes, resíduos, materiais |
| Tabela repetível com totais agregados | Como acima + linhas de totais derivadas por fórmula (sempre calculadas no backend) | Resíduos (B7), materiais (B7), poluentes (B4) |
| Série temporal | Valor actual + comparativo do período anterior | Métricas com comparação obrigatória a partir do 2º ano (§14) |
| `MiniQuestionnaire` (generalizado) | Checklist genérico por item, com definição de itens em tabela (`questionnaire_item_definitions`), **não** hardcoded — suporta `value: boolean` (checklists tipo C6/C7) e `value: numeric` (categorias fixas tipo Scope 3, receitas C8) | C6/C7 (direitos humanos), Scope 3 GHG (15 categorias GHG Protocol), C8 receitas por actividade |
| `ConditionalSection` | Padrão de composição transversal: conteúdo só relevante/visível quando um campo boolean associado (gate) é `True` | B3 breakdown, B4, B5, B6, B7 materiais, C3, C4, B11, C8, C9 |
| Campo com calculadora auxiliar | Valor final normalizado gravado é sempre o resultado de uma conversão a partir de inputs numa unidade à escolha do utilizador; cálculo sempre executado no backend via endpoint de preview | Conversor de combustível (MWh), conversor energia→tCO2e |
| Campo derivado/calculado | Nunca input directo do utilizador — sempre calculado no backend a partir de outros campos já introduzidos | Totais de tabelas repetíveis, taxa de acidentes, gap salarial, % cobertura por acordo colectivo, rácio de género, intensidade de emissões, critérios de exclusão de benchmarks UE (C8) |
| Campo com valor por defeito do standard | `default_value` na definição do campo, editável pelo utilizador | Horas trabalhadas/ano por trabalhador a tempo inteiro (B9, defeito 2000h) |

### 6.1 Regra transversal: cálculo sempre no backend
Toda a lógica de cálculo (conversões de unidade, fatores de emissão, totais agregados, rácios, taxas) vive na camada de Domínio (backend Next.js), nunca no frontend. Para UX responsiva, existe um **endpoint de cálculo/preview dedicado**, stateless (não persiste), que recebe inputs brutos e devolve o resultado calculado. O bloco final só é persistido em JSONB na confirmação do utilizador, guardando: inputs brutos + resultado calculado + referência à versão dos parâmetros/seed data usada (fatores de conversão, fatores de emissão).

Razões: lógica única e auditável; utilizador não pode manipular valores calculados via API directa; reprodutibilidade regulatória (versionamento de parâmetros); alimenta directamente o gerador de iXBRL sem duplicação de lógica.

### 6.2 Dados de referência (seed data, não editáveis pelo utilizador)
- **`fuel_reference`** — tabela completa de tipos de combustível com NCV típico, densidade típica, estado da matéria, estado de renovabilidade típico, e factores de conversão (massa↔volume↔energia) — réplica integral da sheet `Fuel Conversion Parameters` do template EFRAG.
- **Tabela de factores de emissão** — converte energia/combustível em tCO2e, seed data própria (o template EFRAG não a inclui; aponta apenas para calculadoras externas na EFRAG).
- **`Enumeration Lists`** — listas de valores fechados para dropdowns (países, NACE, tipos de resíduo, etc.), importadas como dados de referência.

### 6.3 Flag transversal de omissão por confidencialidade
Cada bloco/disclosure tem um flag `omitido_por_confidencialidade` (booleano + justificação), conforme §22 do standard (omissão por prejuízo comercial sério, segredo comercial, informação classificada, obrigações legais de protecção). O ecrã de B1 agrega automaticamente a lista de tudo o que foi marcado, sem o utilizador ter de a escrever manualmente. Reavaliação obrigatória em cada data de reporte (§22.ii).

### 6.4 Indicador de completude
Cada secção/disclosure tem um estado de validação (`incompleto` / `completo` / com detalhe de campos em falta), à semelhança da sheet `Table of Contents & Validation` do template — usado para o UI de progresso do relatório.

## 7. Mapa completo de disclosures — Módulo Básico

### General Information / B1 — Basis for preparation
- Metadados XBRL do relatório: nome da entidade, identificador da entidade (tipo + valor), moeda, período de reporte (data início/fim)
- Módulo seleccionado (Básico / Básico+Abrangente)
- Lista de disclosures omitidas por confidencialidade (agregada automaticamente — ver 6.3)
- Base de relato: individual ou consolidada
- Forma legal, código(s) NACE, balanço total, volume de negócios, nº empregados (headcount/FTE + ponto-no-tempo/média)
- País de operação principal
- **[Mestre/SCD2]** Lista de subsidiárias (se consolidado)
- **[Mestre/SCD2]** Certificações/labels de sustentabilidade
- **[Mestre/SCD2]** Lista de sites (morada, geolocalização)
- Flag + lista: relatório contém disclosures do período anterior sem alteração + link ao relatório anterior (mecanismo de carry-forward nativo do standard)

### B2 — Práticas, políticas e futuras iniciativas
- Práticas, políticas (públicas ou não), futuras iniciativas, targets — narrativa estruturada
- *Fora de âmbito: matriz por tema de sustentabilidade (10 temas × pública/target) — não implementar*
- *Fora de âmbito: disclosures específicas de cooperativas — não implementar*

### B3 — Energia e emissões GHG
- Consumo total de energia (MWh) — sempre reportado
- `ConditionalSection`: breakdown renovável/não-renovável × electricidade/electricidade autogerada/combustíveis, com calculadora de combustível (ver 6.1, 6.2)
- Emissões GHG estimadas (tCO2e): Scope 1, Scope 2 location-based (sempre reportados), Scope 2 market-based (opcional), totais calculados
- `ConditionalSection` Scope 3: 15 categorias fixas GHG Protocol via `MiniQuestionnaire` numérico, total calculado
- Intensidade de emissões por turnover (location-based e market-based) — sempre reportado, campo derivado

### B4 — Poluição do ar, água e solo
- `ConditionalSection` (obrigado por lei ou reporta voluntariamente via EMAS) → tabela repetível com totais agregados (poluente × ar/água/solo), ou referência a URL externo

### B5 — Biodiversidade
- `ConditionalSection` (sites em/perto de área sensível) → tabela repetível referenciando Site ID de B1 (mestre), com área e distinção dentro/perto
- Land-use (opcional): área selada/naturalizada on-site/off-site — métricas numéricas simples

### B6 — Água
- Total de água captada — sempre reportado
- `ConditionalSection` (processos que consomem água significativamente) → consumo de água (calculado: captação − descarga), com destaque para consumo em zonas de stress hídrico

### B7 — Recursos, economia circular e resíduos
- Descrição de aplicação de princípios de economia circular — sempre reportado
- Resíduos gerados: tabela repetível com totais agregados (hazardous/non-hazardous × massa/volume, reciclado/reutilizado vs. eliminado)
- `ConditionalSection` (sector com fluxos de materiais significativos) → tabela repetível com totais agregados (mesma forma que resíduos)

### B8 — Workforce – Características gerais
- Tipo de contrato (permanente/temporário) — tabela fixa + total, **validação cruzada obrigatória com total de empregados de B1**
- Género (masculino/feminino/outro/não reportado) — idem, mesma validação cruzada
- `ConditionalSection` (opera em mais de um país) → país de emprego × nº empregados, tabela repetível, mesma validação cruzada
- Taxa de turnover (opcional) — campo derivado a partir de nº saídas/início/fim

### B9 — Workforce – Saúde e segurança
- Nº e taxa de acidentes de trabalho registáveis — taxa é campo derivado
- Horas trabalhadas/ano por trabalhador a tempo inteiro — **campo com valor por defeito do standard (2000h), editável**
- Nº de fatalidades

### B10 — Workforce – Remuneração, negociação colectiva e formação
- Pagamento ≥ salário mínimo aplicável (YES/NO)
- Gap salarial género (se já obrigado por lei UE) — campo derivado a partir de médias masculino/feminino
- % cobertura por acordo colectivo — campo derivado
- Horas médias de formação/empregado, por género — tabela fixa + média calculada

### B11 — Convicções e coimas por corrupção e suborno
- `ConditionalSection` → nº de convicções + montante total de coimas

## 8. Mapa completo de disclosures — Módulo Abrangente

*Pré-requisito: aplicação do Módulo Básico é obrigatória antes do Abrangente (§7 do standard).*

### C1 — Estratégia: modelo de negócio e iniciativas de sustentabilidade
- Descrição de produtos/serviços, mercados, relações de negócio principais
- Narrativa condicional: elementos da estratégia ligados a sustentabilidade

### C2 — Práticas, políticas e futuras iniciativas (complemento de B2)
- Descrição de cada prática/política já reportada em B2, descrição de targets, nível hierárquico responsável (opcional)

### C3 — Targets de redução GHG e transição climática
- `ConditionalSection` (tem targets estabelecidos) → ano-base/valor-base, ano-alvo/valor-alvo, unidades, share por Scope, lista de acções principais
- `ConditionalSection` (opera em sector de alto impacto climático) → estado de implementação de plano de transição, descrição (opcional), data prevista de adopção se ainda não existir

### C4 — Riscos climáticos
- `ConditionalSection` → descrição de perigos/eventos de transição climática, avaliação de exposição/sensibilidade, horizontes temporais, acções de adaptação, avaliação de risco (alto/médio/baixo, opcional)

### C5 — Características adicionais da workforce (opcional)
- Nº empregados masculino/feminino a nível de gestão + rácio calculado
- Nº trabalhadores independentes exclusivos + trabalhadores temporários via empresas de trabalho temporário

### C6 — Políticas e processos de direitos humanos
- `MiniQuestionnaire` booleano: código de conduta/política de direitos humanos (YES/NO) → se sim, cobertura por tema (trabalho infantil, trabalho forçado, tráfico humano, discriminação, prevenção de acidentes, outro + especificação livre)
- Mecanismo de reclamações para a própria força de trabalho (YES/NO)
- **Nota de regra de obrigatoriedade:** o texto legal (Anexo II) classifica este disclosure como `[Voluntary for undertakings with 10 employees or less]`; o template Excel trata-o como sempre reportado. A fonte a seguir na aplicação é o **texto legal**, não o Excel, quando divergem — campo obrigatório/opcional consoante nº de empregados da empresa.

### C7 — Incidentes de direitos humanos
- `MiniQuestionnaire` booleano: incidentes confirmados na própria força de trabalho, por tema (mesmos temas de C6 exc. prevenção de acidentes, + outro)
- Narrativa: descrição de acções tomadas
- YES/NO + especificação: incidentes envolvendo trabalhadores na cadeia de valor, comunidades afectadas, consumidores e utilizadores finais

### C8 — Receitas de certas actividades e exclusão de benchmarks UE
- `ConditionalSection` → receitas de: armas controversas, tabaco, combustíveis fósseis (carvão/petróleo/gás desagregado + total calculado), produção de químicos
- **Critérios de exclusão de benchmarks UE (4 critérios + "nenhum dos anteriores" + conclusão) — campos calculados no backend**, derivados das percentagens de receita acima sobre o turnover total de B1; não são input manual

### C9 — Rácio de diversidade de género no órgão de governança
- `ConditionalSection` (tem órgão de governança) → nº membros masculino/feminino + rácio calculado

## 9. Decisões de âmbito explicitamente excluídas
- Matriz B2 de temas de sustentabilidade (10 temas × pública/target)
- Disclosures específicas de cooperativas (B2/C1)
- Taxonomia XBRL ESRS completa e `Technical Sheet` (mapeamento técnico oculto do template) — referência de fase posterior, não da POC evoluída
- Regras de validação/condicionalidade regulatória e geração de documento/PDF — confirmado fora de âmbito da POC original, permanece assim nesta fase salvo indicação em contrário

## 10. Referências técnicas
- Commission Delegated Regulation (EU) C(2026) 5011 final (3.7.2026) — Annexes I e II (texto legal do standard, incluindo Anexo II com a lista de disclosures cobertas pelo value chain cap por escalão de empregados)
- EFRAG VSME Digital Template v1.3.0 (.xlsx) — implementação de referência do standard, incluindo sheets de apoio (`Fuel Converter`, `Fuel Conversion Parameters`, `Unit Of Measurement Converter`, `Enumeration Lists`, `Table of Contents & Validation`)
- Taxonomia ESRS Set 1 XBRL da EFRAG (`esrs_all.xsd`, agosto 2024) — referência de boas práticas de estruturação para fase posterior
