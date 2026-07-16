# Especificação de implementação — Evolução POC Relatórios ESG (VSME)

## Âmbito desta fase

Implementar, pela ordem indicada, as seguintes 5 funcionalidades:

1. Branding por empresa (logo, cores)
2. Navegação por perfil (admin/elaborador/aprovador) + reestruturação da navegação
3. Painel de completude e progresso por disclosure/secção
4. Comparação entre períodos (mesma empresa)
5. Multi-idioma Fase A (UI da aplicação, PT/EN)

## Stack e princípios já estabelecidos (contexto obrigatório)

- **Backend**: Next.js (API routes/route handlers) + Zod para validação
- **Frontend**: Next.js (React)
- **Base de dados**: Neon (PostgreSQL serverless), blocos estruturados em JSONB + metadados relacionais
- **Deployment**: Vercel
- **Princípio arquitectural central**: blocos estruturados validados por schema, serializados para JSONB, são a fonte de verdade; XHTML/iXBRL são gerados dinamicamente, nunca armazenados como fonte de verdade
- **Multiempresa**: tabela de empresas + relação utilizador↔empresa já existente
- **Workflow**: todo o conteúdo passa por dois estados — Elaboração → Aprovação
- **Multiperíodo**: períodos sequenciais, cada um criado a partir do anterior (carry-forward)
- **Cálculo sempre no backend**: nenhuma lógica de cálculo/agregação no frontend

---

## 1. Branding por empresa

### Objectivo
Cada empresa pode configurar logo e cores próprias, aplicadas na UI e no cabeçalho dos outputs gerados (XHTML/relatório).

### Modelo de dados
- Adicionar à tabela de empresas (ou tabela `empresa_branding` separada, 1:1):
  - `logo_url` (string, referência a ficheiro armazenado — usar storage externo, não Base64 em BD)
  - `cor_primaria` (string, hex)
  - `cor_secundaria` (string, hex)
- Valores por defeito (tema neutro da plataforma) quando não configurado.

### API
- `GET /api/empresas/:id/branding`
- `PUT /api/empresas/:id/branding` (só Administrador ou Elaborador com permissão, a decidir)

### Frontend
- Ecrã de configuração em "Empresas" (só visível a Administrador).
- Aplicar `cor_primaria`/`cor_secundaria` via CSS custom properties no layout raiz da empresa activa (context/provider que lê o branding ao trocar de empresa).
- Logo no cabeçalho da aplicação e no cabeçalho do XHTML/relatório gerado.

### Critérios de aceitação
- Trocar de empresa activa muda o tema (cores + logo) sem reload da página.
- Empresa sem branding configurado usa tema neutro, sem erro.
- Logo aparece no output XHTML exportado.

---

## 2. Navegação por perfil + reestruturação Relatórios/Divulgações

### Objectivo
Diferenciar UI e permissões por papel (Administrador, Elaborador, Aprovador) e eliminar a ambiguidade actual entre "Relatórios" e "Divulgações" no menu.

### Modelo de dados
- Adicionar campo `papel` à relação utilizador↔empresa existente (enum: `admin`, `elaborador`, `aprovador`; um utilizador pode ter papéis diferentes em empresas diferentes, ou múltiplos papéis na mesma empresa se aplicável — confirmar com o Anexo II não aplicável aqui, é decisão de produto).
- Nota: `admin` pode ser um papel global (não por empresa) — separar dos papéis por empresa se for esse o caso.

### Hierarquia de navegação (substituir a estrutura actual)
```
Empresa (seletor global)
  └─ Período (2024, 2025, ...) — com estado global (Elaboração/Aprovado)
       └─ Módulo (Básico / Abrangente)
            └─ Disclosure (B1, B2, ... C9) — com indicador de completude
                 └─ Bloco(s) da disclosure
```
- "Relatório" deixa de ser item de menu — passa a ser o *output* (XHTML/PDF) gerado a partir de um Período aprovado, acessível a partir do próprio período (botão "Gerar relatório"), não como secção independente.
- "Divulgação" é sempre sinónimo de disclosure (B1–C9) na UI e nos textos — eliminar qualquer outro uso do termo.

### Middleware / controlo de acesso
- Middleware de rota Next.js a verificar papel + empresa activa antes de renderizar páginas sob `/empresas/[id]/...`.
- Elaborador não pode editar blocos de um período já Aprovado (acção "reabrir período" devolve a Elaboração e fica registada, se o módulo de auditoria já existir; caso contrário, apenas bloquear e assinalar como trabalho futuro).

### UI por papel
- **Administrador**: menu lateral "Empresas", "Utilizadores", "Configuração" (inclui branding da secção 1). Não entra no ecrã de preenchimento de blocos por defeito.
- **Elaborador**: entra na Empresa/Período activo, vê árvore Módulo→Disclosure. Botão "Submeter para aprovação" (habilitar/desabilitar por completude fica ligado à secção 3 deste documento, se implementada depois; nesta fase pode ser sempre activo).
- **Aprovador**: ecrã inicial = fila "Pendentes de aprovação" (cross-empresa, das empresas a que tem acesso). Detalhe de disclosure só ao clicar num item da fila.

### Critérios de aceitação
- Utilizador só vê e acede às rotas correspondentes ao(s) seu(s) papel(éis).
- Menu não usa mais "Relatórios" como item de navegação separado de "Divulgações".
- Aprovador vê fila de pendentes como primeira página ao entrar numa empresa.

---

## 3. Painel de completude e progresso por disclosure/secção

### Objectivo
Visibilidade imediata do estado de preenchimento por Módulo/Disclosure/Bloco, sem navegar disclosure a disclosure.

### Cálculo
- Derivado em tempo real a partir dos blocos existentes + regras de obrigatoriedade (não armazenar estado de completude separadamente nesta fase — evitar dessincronização).
- Estados por nó: `não iniciado` / `em progresso` / `completo` / `não aplicável`.
- Campos voluntários (ex. thresholds ≤10 empregados, se já implementados; caso contrário tratar todos os campos definidos como obrigatórios nesta fase) não contam como "incompleto" quando vazios.

### API
- `GET /api/periodos/:id/completude` → devolve árvore com estado por Módulo/Disclosure e percentagem agregada.

### Frontend
- Indicador (badge/percentagem) junto a cada Disclosure na árvore de navegação (ver secção 2).
- Percentagem agregada visível no ecrã inicial do período (Elaborador).
- Filtro "mostrar só o que falta" na árvore de navegação.

### Critérios de aceitação
- Percentagem de completude reflecte correctamente blocos preenchidos vs. total esperado.
- Disclosure sem nenhum campo preenchido aparece como "não iniciado"; com todos os campos preenchidos, "completo".
- Endpoint reutilizável (não acoplado a um único ecrã).

---

## 4. Comparação entre períodos (mesma empresa)

### Objectivo
Vista analítica de evolução de métricas-chave entre períodos da mesma empresa, aproveitando os dados já estruturados em JSONB.

### Métricas prioritárias (primeira iteração)
- Consumo total de energia (B3)
- Emissões Scope 1 / Scope 2 (B3)
- Nº de acidentes de trabalho (B10/B9, confirmar numeração)
- Nº de empregados / turnover
- % género (se aplicável ao mapa de disclosures actual)

### API
- `GET /api/empresas/:id/comparacao?metricas=...&periodos=...` → devolve série temporal por métrica solicitada, extraída via query directa sobre os campos JSONB relevantes (sem necessidade de tabela agregada nesta fase).

### Frontend
- Novo ecrã "Comparação" (ou secção dentro da vista da empresa), com:
  - Gráfico de evolução temporal por métrica seleccionada.
  - Tabela comparativa (períodos em colunas) para a disclosure em foco.
  - Indicador de variação (%, absoluto) entre o período mais recente e o anterior.
- Nota: isto é uma vista analítica separada do comparativo já exigido dentro do próprio relatório regulatório (§14 do standard) — não substituir esse comparativo, é uma funcionalidade adicional.

### Critérios de aceitação
- Selecionar 2+ períodos da mesma empresa mostra evolução correcta das métricas escolhidas.
- Período sem dado para uma métrica aparece como lacuna visível no gráfico/tabela, não como zero.

---

## 5. Multi-idioma Fase A (UI apenas, PT/EN)

### Objectivo
Interface bilingue (PT/EN) — menus, botões, mensagens de validação, ajuda. **Não inclui** tradução de conteúdo narrativo introduzido pelos utilizadores nos relatórios (fora de âmbito desta fase).

### Abordagem técnica
- Usar `next-intl` (ou equivalente) para i18n de routing e strings da UI.
- PT como idioma por defeito.
- Labels fixos de disclosures/categorias (nomes de campos, unidades, categorias Scope 3, etc.) podem entrar no mesmo dicionário de traduções, por virem de vocabulário fechado — mas o *conteúdo narrativo introduzido pelo utilizador* nunca é traduzido nesta fase.

### Frontend
- Selector de idioma (ex. no cabeçalho, junto ao selector de empresa).
- Extrair todas as strings actualmente hardcoded da UI para ficheiros de tradução (`pt.json` / `en.json`).

### Critérios de aceitação
- Trocar idioma na UI actualiza todos os textos de interface (menus, botões, mensagens) sem reload completo.
- Nenhum conteúdo introduzido pelo utilizador (narrativas, valores) é alterado ao trocar de idioma.

---

## Ordem de implementação recomendada

1. Branding (mais simples, sem dependências das restantes)
2. Navegação por perfil (estrutural — as secções seguintes dependem da árvore de navegação nova)
3. Painel de completude (usa a árvore de navegação da secção 2)
4. Comparação entre períodos (independente das anteriores, mas beneficia da navegação já reestruturada)
5. Multi-idioma Fase A (transversal, mais fácil de aplicar depois da UI estar reestruturada, para não traduzir duas vezes)
