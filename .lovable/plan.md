
## O que o documento define

**Dois tipos de publicação** (obrigatório declarar):
- **Feed** — foto, carrossel ou vídeo no perfil. Usa a fórmula atual: (curtidas×1 + comentários×3 + compartilhamentos×5 + salvamentos×2) × multiplicador de tipo
- **Stories** — conteúdo efêmero. Fórmula diferente com métricas diferentes

**Fórmula Stories:**
```
Score = (views_pico × 0.25) + (interações × 3) + (encaminhamentos × 5) + (cliques_no_link × 10)
```

**4 regras especiais dos Stories:**
- R1: `views_pico` = só o story com mais views do dia (não soma todos)
- R2: Máximo 10 stories por criador por dia (os demais não pontuam)
- R3: Interações + encaminhamentos + cliques somam todos os stories elegíveis (até 10)
- R4: CTA (cliques no link) tem peso ×10, o maior de todos

**Métricas Stories vs Feed:**

| Stories | Feed |
|---|---|
| views_pico (×0.25) | curtidas (×1) |
| interações (×3) | comentários (×3) |
| encaminhamentos (×5) | compartilhamentos (×5) |
| cliques_no_link (×10) | salvamentos (×2) |

**Importante:** Stories NÃO têm multiplicador por tipo de conteúdo — a fórmula é fixa. Feed mantém o multiplicador configurável.

---

## O que precisa mudar

### 1. Banco de dados (migração)
Adicionar 4 colunas à tabela `posts`:
```sql
ALTER TABLE posts ADD COLUMN format text DEFAULT 'feed'; -- 'feed' | 'stories'
ALTER TABLE posts ADD COLUMN views_pico integer DEFAULT 0;
ALTER TABLE posts ADD COLUMN interactions integer DEFAULT 0;  -- enquetes, quizzes, etc
ALTER TABLE posts ADD COLUMN forwards integer DEFAULT 0;     -- encaminhamentos
ALTER TABLE posts ADD COLUMN cta_clicks integer DEFAULT 0;   -- cliques no link
```

### 2. `src/lib/types.ts`
- Adicionar campos novos ao tipo `Post`: `format`, `views_pico`, `interactions`, `forwards`, `cta_clicks`
- Adicionar tipo `PostFormat = "feed" | "stories"`
- Criar função `calcScoreStories({ views_pico, interactions, forwards, cta_clicks }): number`
- Adaptar `calcScore` para despachar para a função correta com base no `format`

### 3. `src/pages/NewPost.tsx` e `src/pages/EditPost.tsx`
- Adicionar seletor **Feed / Stories** no início do formulário (obrigatório)
- Quando **Feed**: mostrar métricas atuais (curtidas, comentários, compartilhamentos, salvamentos) + multiplicador de tipo de conteúdo
- Quando **Stories**: mostrar métricas stories (views_pico, interações, encaminhamentos, cliques_no_link) + aviso das regras R1/R2 + ocultar seletor de tipo de conteúdo
- Score preview atualiza em tempo real conforme o formato
- Validação de limite de 10 stories por criador por dia (bloqueia o save com mensagem de erro)

### 4. `src/pages/Posts.tsx`
- Badge de formato (Feed / Stories) visível no card, ao lado do badge de plataforma
- Exibir as métricas corretas conforme o formato do post
- Filtro por formato (Todos / Feed / Stories)

### 5. `src/components/ContentTypePicker.tsx`
- Ocultar (ou desabilitar) quando o formato selecionado for **Stories**, já que Stories não aplica multiplicador por tipo

---

## Diagrama de fluxo do score

```
Cadastrar post
    │
    ├── Formato: FEED
    │       ├── Métricas: curtidas, comentários, compartilhamentos, salvamentos
    │       ├── Tipo: Técnico / Meme / Anúncio / Nenhum (multiplier)
    │       └── Score = (c×w1 + co×w2 + cp×w3 + s×w4) × multiplier
    │
    └── Formato: STORIES
            ├── Métricas: views_pico, interações, encaminhamentos, cliques_link
            ├── Sem multiplicador por tipo
            ├── Validação: ≤10 stories por criador por dia
            └── Score = (views×0.25) + (int×3) + (enc×5) + (cta×10)
```

---

## Arquivos a modificar

| Arquivo | O que muda |
|---|---|
| `supabase/migrations/` | Nova migração: 5 colunas na tabela `posts` |
| `src/lib/types.ts` | Novo tipo `PostFormat`, novos campos em `Post`, nova função `calcScoreStories` |
| `src/pages/NewPost.tsx` | Seletor Feed/Stories, métricas condicionais, validação dos 10 stories |
| `src/pages/EditPost.tsx` | Seletor Feed/Stories (pré-preenchido), métricas condicionais |
| `src/pages/Posts.tsx` | Badge de formato, filtro por formato, exibição de métricas corretas |
| `src/components/ContentTypePicker.tsx` | Ocultar quando formato = stories |
