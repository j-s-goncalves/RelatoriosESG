# Fases de Desenvolvimento a partir da POC

Ponto de partida: POC funcional que valida o padrão arquitectural (blocos validados por schema — Zod — serializados para JSONB como fonte de verdade, geração dinâmica de HTML/iXBRL, Next.js + Neon + Vercel) para uma única disclosure (C6). As fases seguintes evoluem essa base para a aplicação completa descrita em `descricao_completa_projecto.md`, sem alterar o stack nem o princípio arquitectural central.

## Fase 0 — Base já existente (POC)
- Modelo de bloco `MiniQuestionnaire` booleano (checklist)
- Persistência em JSONB, API REST Next.js, editor React (Next.js)
- Disclosure única (C6) sem auth, sem multiempresa, sem workflow, sem geração de documento

## Fase 1 — Fundações multiempresa e utilizadores
- Modelo de dados: empresa (undertaking), utilizador, relação utilizador↔empresa
- CRUD de manutenção de empresas
- CRUD de manutenção de utilizadores
- Autenticação e controlo de acesso: utilizador só vê/opera nas empresas para as quais está autorizado
- Selector de empresa activa na aplicação

*Critério de conclusão: um utilizador consegue autenticar-se, ver apenas as suas empresas autorizadas, e alternar entre elas.*

## Fase 2 — Dados mestre da empresa (SCD2)
- Tabela de dados mestre da empresa com versionamento `válido_desde`/`válido_até`
- Migração dos campos identificados como mestre (identificador da entidade, forma legal, NACE, moeda, país de operação, subsidiárias, sites, certificações)
- API de edição do mestre (cria nova versão, não faz update in-place)
- Resolução da versão em vigor para uma data de referência

*Critério de conclusão: editar um campo mestre cria uma nova versão sem apagar a anterior; um período antigo continua a mostrar a versão que estava em vigor na altura.*

## Fase 3 — Multiperíodo e workflow Elaboração/Aprovação
- Modelo de período de reporte (empresa + ano/intervalo), sequencial
- Estado de cada bloco de período: `elaboração` / `aprovação` / `aprovado`
- Criação de novo período: clonagem dos blocos aprovados do período anterior, com estado `herdado_sem_alteração`
- Campo de proveniência por bloco: `novo` / `herdado_sem_alteração` / `herdado_e_editado`
- Transições de estado com validação de permissões (quem pode aprovar)

*Critério de conclusão: criar um segundo período reaproveita os dados do primeiro; editar um bloco herdado marca-o como `herdado_e_editado`; o fluxo Elaboração→Aprovação é obrigatório antes de um bloco contar como definitivo.*

## Fase 4 — Generalização dos tipos de bloco
- Generalizar `MiniQuestionnaire` para suportar `value: boolean` e `value: numeric`, com definição de itens em `questionnaire_item_definitions` (não hardcoded)
- Implementar tipos de bloco em falta: métrica numérica desagregada, tabela estruturada fixa, tabela repetível, tabela repetível com totais agregados, série temporal comparativa
- Implementar o padrão `ConditionalSection` como composição transversal sobre os tipos acima
- Implementar `default_value` na definição de campo (ex. B9 — 2000h)
- Implementar flag transversal `omitido_por_confidencialidade` + agregação automática na disclosure B1

*Critério de conclusão: os tipos de bloco cobrem todas as formas identificadas no mapa VSME, sem necessidade de classes ad-hoc por disclosure.*

## Fase 5 — Motor de cálculo no backend
- Endpoint de cálculo/preview dedicado, stateless
- Seed data: tabela `fuel_reference` (réplica de `Fuel Conversion Parameters`) e tabela de factores de emissão (energia/combustível → tCO2e)
- Calculadora de combustível (unidade→MWh) e conversão energia→tCO2e
- Campos derivados: totais de tabelas repetíveis (resíduos, materiais, poluentes), taxa de acidentes, gap salarial, % cobertura por acordo colectivo, rácio de género, intensidade de emissões, critérios de exclusão de benchmarks UE (C8)
- Versionamento dos parâmetros de cálculo (seed data), referenciado em cada bloco persistido

*Critério de conclusão: nenhum valor calculado é editável directamente pelo utilizador; todos resultam de um pedido ao endpoint de preview e são gravados com referência à versão dos parâmetros usados.*

## Fase 6 — Módulo Básico completo (B1–B11)
Implementação disclosure a disclosure, por esta ordem sugerida (segue a estrutura do standard):
1. B1 — Basis for preparation (inclui integração com Fase 2 — dados mestre)
2. B2 — Práticas e políticas (sem matriz de temas, sem cooperativas)
3. B3 — Energia e GHG (usa motor de cálculo da Fase 5)
4. B4 — Poluição
5. B5 — Biodiversidade (referencia sites do mestre)
6. B6 — Água
7. B7 — Resíduos e materiais
8. B8 — Workforce características gerais (com validação cruzada a B1)
9. B9 — Saúde e segurança
10. B10 — Remuneração e formação
11. B11 — Corrupção e suborno

*Critério de conclusão: um relatório do Módulo Básico completo pode ser elaborado e aprovado de início a fim para uma empresa/período.*

## Fase 7 — Módulo Abrangente completo (C1–C9)
Implementação disclosure a disclosure, com dependência de C6/C7 reaproveitarem a infraestrutura genérica de checklist da Fase 4:
1. C1 — Estratégia
2. C2 — Complemento de B2
3. C3 — Targets GHG e transição climática
4. C4 — Riscos climáticos
5. C5 — Características adicionais da workforce
6. C6 — Políticas de direitos humanos (com regra de obrigatoriedade por nº de empregados, conforme texto legal)
7. C7 — Incidentes de direitos humanos
8. C8 — Receitas de actividades específicas + exclusão de benchmarks (campos calculados)
9. C9 — Diversidade de género no órgão de governança

*Critério de conclusão: uma empresa que opte pelo Módulo Básico + Abrangente consegue completar as 20 disclosures (B1–B11 + C1–C9).*

## Fase 8 — Validação, completude e omissões
- Indicador de completude por secção/disclosure (à semelhança de `Table of Contents & Validation`)
- Regras de obrigatoriedade condicional por escalão de nº de empregados (≤10 vs. >10), conforme Anexo II do texto legal
- Validações cruzadas entre disclosures (ex. totais de B8 vs. B1)

*Critério de conclusão: o utilizador vê, a qualquer momento, o que falta preencher e é avisado de inconsistências antes de submeter para Aprovação.*

## Fase 9 — Geração de saída (XHTML/iXBRL/PDF)
- Geração dinâmica de HTML de apresentação a partir dos blocos
- Geração de XHTML com marcação iXBRL para as 20 disclosures
- Avaliação de necessidade de migração de deployment (Next.js serverless functions em Vercel → container de longa duração) face ao custo computacional da geração de documentos

*Critério de conclusão: um relatório aprovado gera um documento XHTML/iXBRL válido, sem que este seja a fonte de verdade armazenada.*

## Notas transversais a todas as fases
- Nenhuma fase altera o stack técnico (Next.js/Zod/Neon/Vercel) nem o princípio de blocos JSONB como fonte de verdade.
- Cálculo permanece sempre no backend (Fase 5 em diante).
- Âmbito explicitamente excluído em todas as fases: matriz B2 de temas, disclosures de cooperativas, taxonomia XBRL ESRS completa/`Technical Sheet`.
