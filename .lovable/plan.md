
## Plano: Renomear "Premiações" → "Prêmios e Regras" + seção de regras colapsável

### O que muda

**1. Layout.tsx** — renomear label do item de menu de `"Premiações"` → `"Prêmios e Regras"` (mantém ícone `Gift` e rota `/awards`).

**2. Awards.tsx** — 3 mudanças:

#### 2a. Título da página
- `h1`: de `"Premiações"` → `"Prêmios e Regras"`
- Subtítulo: `"Desafios ativos e histórico de vencedores"` → `"Desafios, prêmios e regras de pontuação"`

#### 2b. Buscar dados de configurações (somente leitura)
Adicionar `useEffect` para carregar em paralelo:
- `engagement_weights` (pesos do feed)
- `stories_weights` (pesos dos stories)
- `content_type_multipliers` (multiplicadores por tipo)

Nenhum estado de edição — só leitura (`weights`, `storiesW`, `multipliers`).

#### 2c. Botão "Ver regras" + painel colapsável
Logo abaixo do header da página, antes da seção do desafio ativo, adicionar:

```text
[ Ver regras de pontuação ▾ ]    ← botão toggle, visível para todos

Quando expandido, exibe 3 blocos lado a lado (ou empilhados no mobile):

┌─────────────────────┐  ┌─────────────────────┐  ┌──────────────────────┐
│  Feed               │  │  Stories             │  │  Multiplicadores     │
│  ❤ Curtidas  ×1     │  │  👁 Views Pico ×0.25 │  │  🔧 Técnico    ×1.5 │
│  💬 Comentários ×3  │  │  💬 Interações ×3    │  │  😂 Meme       ×0.5 │
│  🔁 Compart. ×5     │  │  🔁 Encaminh. ×5     │  │  📣 Anúncio    ×1.0 │
│  🔖 Salvam.  ×2     │  │  🖱 Cliques CTA ×10  │  │                      │
│                     │  │                      │  │  (Feed only)         │
│  Fórmula:           │  │  Fórmula:            │  │                      │
│  (métricas × peso)  │  │  soma ponderada      │  │                      │
│  × multiplicador    │  │  independente        │  │                      │
└─────────────────────┘  └─────────────────────┘  └──────────────────────┘
```

Implementação: `useState(false)` para `showRules`. Botão com ícone `ChevronDown`/`ChevronUp`. Os blocos são `Card` read-only sem inputs — apenas exibição.

### Arquivos modificados

| Arquivo | Mudança |
|---|---|
| `src/components/Layout.tsx` | Label `"Premiações"` → `"Prêmios e Regras"` |
| `src/pages/Awards.tsx` | Título + subtítulo + busca de pesos + botão "Ver regras" + painel colapsável somente leitura |

### Dados carregados (somente leitura)
- `engagement_weights` → exibe peso de curtidas, comentários, compartilhamentos, salvamentos
- `stories_weights` → exibe peso de views pico, interações, encaminhamentos, cliques CTA
- `content_type_multipliers` → exibe multiplicador por tipo (técnico, meme, anúncio)

Sem migrations, sem novos estados de edição, sem impacto em outras páginas.
