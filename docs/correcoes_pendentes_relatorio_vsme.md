# Correcções pendentes — Relatório ESG VSME (face ao standard)

Correcções identificadas na revisão do relatório exportado (`vsme_JG_2025.xhtml`) face ao texto do standard (Commission Delegated Regulation (EU) C(2026) 5011 final) e ao template digital da EFRAG (`VSMEDigitalTemplate1_3_0.xlsx`). Não são sugestões de evolução — são gaps/erros a corrigir antes de avançar.

---

## 1. B1 — Falta o campo de declaração de Opção A/B

O §27, ponto (a) do standard exige que a empresa declare explicitamente qual opção seguiu:
- **Opção A**: só Módulo Básico
- **Opção B**: Módulo Básico + Módulo Abrangente

A secção B1 do relatório exportado tem os 4 datapoints numéricos (nº empregados, ETI, volume de negócios, balanço), mas **não tem o campo que declara a opção seguida**. É um campo estrutural em falta, não uma métrica — e determina se as secções C1–C9 são sequer aplicáveis ao relatório.

**Acção**: acrescentar campo de selecção Opção A / Opção B a B1, incluído no export XHTML/iXBRL.

---

## 2. Caixas de texto narrativo — tamanho visual

As caixas de texto narrativo (ex. B2 e sub-tópicos) têm de ter o **triplo do tamanho visual actual** (altura / nº de linhas visíveis no ecrã).

**Nota**: isto é sobre o tamanho visual da caixa (altura/linhas), **não** uma alteração ao limite de caracteres permitido.

---

## 3. B3 — Quadro de Energia não corresponde ao §32

O standard exige uma tabela de **2 linhas × 3 colunas**:

| | Renovável | Não renovável | Total |
|---|---|---|---|
| Electricidade | | | |
| Combustíveis | | | |

O relatório actual usa uma estrutura diferente (3 linhas: Energia renovável — autoprodução; Energia renovável — rede; Energia não renovável), sem a distinção Electricidade/Combustíveis exigida e sem coluna de Total.

**Acção**: implementar o quadro exigido pelo standard como estrutura primária (alimenta o iXBRL). Avaliar com o Elaborador/Product Owner se a segmentação actual (autoprodução vs. rede) deve ser mantida como desagregação adicional dentro de "Electricidade → Renovável", ou descontinuada.

**Nota à parte (não é correcção)**: a secção de emissões GEE (§33 — Âmbito 1/2) já está correctamente implementada (modelo de dados, mapeamento iXBRL e formulário em `/disclosure/B3_GHG` confirmados via diagnóstico de código). Os valores "—" nessa secção são apenas dados por preencher no relatório de teste, não uma lacuna funcional.

---

## 4. B4 — Falta campo alternativo de referência/URL

O §34 do standard permite que, se a informação sobre poluição do ar, água e solo já estiver disponível publicamente, a empresa possa substituir o preenchimento directo por uma referência ao documento onde é reportada (ex. URL ou hiperligação).

A aplicação não tem este campo alternativo.

**Acção**: acrescentar campo opcional de referência/URL a B4, como alternativa ao preenchimento directo dos dados de poluição.

---

## 5. B7 — Quadro de Resíduos não corresponde ao §39(a)(b)

O standard/template EFRAG exige uma tabela repetível com colunas:
- Tipo de resíduo (perigoso/não perigoso)
- Unidade de medida
- **Resíduo desviado para reciclagem/reutilização**
- **Resíduo encaminhado para eliminação**
- Total (calculado)

Seguida de um **quadro de totais obrigatório**:
- Total de resíduos perigosos (massa)
- Total de resíduos não perigosos (massa)
- Total geral (massa)
- Total de resíduos perigosos (volume, m³)
- Total de resíduos não perigosos (volume, m³)
- Total geral (volume, m³)

O relatório actual tem colunas (Tipo de resíduo | Perigoso | Quantidade ton | Destino/Tratamento) que não distinguem reciclagem/reutilização de eliminação, não têm coluna de unidade, e **falta por completo o quadro de totais**.

**Acção**: reestruturar o quadro de resíduos com as colunas exigidas e acrescentar o bloco de totais (6 valores).

---

## 6. B7 — Quadro de Materiais não corresponde ao §39(c)

O standard exige:
1. Campo gate Sim/Não: "a empresa opera em sector com fluxos de materiais significativos?"
2. Se Sim: tabela repetível com nome do material-chave, massa/volume, unidade de medida — materiais nomeados individualmente.

O relatório actual mostra "Total de materiais utilizados" / "dos quais reciclados", em toneladas e % renovável — uma estrutura agregada que não corresponde ao exigido (não tem o gate, nem lista materiais nomeados individualmente).

**Acção**: substituir por campo gate + tabela repetível de materiais nomeados, conforme o standard.

---

## 7. B8/B9/B10 — Desalinhamento de numeração (correcção prioritária)

O relatório exportado usa uma numeração de disclosures desalinhada com a versão actual do standard.

**O que o standard exige (Módulo Básico):**
- **B8** (§40) — características gerais: nº empregados por tipo de contrato, género, país
- **B9** (§41) — saúde e segurança: acidentes de trabalho registáveis, fatalidades
- **B10** (§42) — remuneração: salário mínimo, gap salarial de género (se já exigido por lei UE), % cobertos por acordo colectivo, horas de formação/ano

**O que está no relatório exportado:**

| Secção rotulada como | Conteúdo | Devia ser |
|---|---|---|
| "B8 — Tipos de Contrato" | Contrato permanente/temporário | B8 (correcto, mas incompleto — falta género e país) |
| "B8 — Remuneração e Diferença Salarial" | Remuneração/gap salarial | **B10** |
| "B9 — Rotatividade: Admissões/Saídas" | Turnover | **C5** (Módulo Abrangente, §58) — não pertence ao Módulo Básico |
| "B9 — Diversidade Etária e de Género" | Diversidade | Não corresponde a nenhuma disclosure explícita do Módulo Básico nessa forma |
| "B10 — Acidentes e Lesões" | Acidentes de trabalho | **B9** |
| "B10 — Política de Saúde e Segurança" | Política H&S | Não corresponde a nenhuma disclosure explícita do Módulo Básico nessa forma |

**Acção**:
1. Reatribuir os rótulos correctos às secções existentes (acidentes → B9; remuneração → B10).
2. Completar B8 com os campos em falta (género, país).
3. Completar B10 com os campos em falta (salário mínimo, % acordo colectivo, horas de formação).
4. Mover o conteúdo de turnover para C5 (Módulo Abrangente), removendo-o do Módulo Básico.
5. Decidir, com o Product Owner, se "Diversidade Etária e de Género" e "Política de Saúde e Segurança" devem ser mantidos como informação adicional fora do standard (claramente identificados como tal) ou removidos.
