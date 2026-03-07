
## O que o usuário quer

Adicionar um botão de **"Atualizar métricas"** na página de **edição de post** (`EditPost.tsx`) — igual ao que existe no `NewPost.tsx` — para que posts já cadastrados possam ter suas métricas re-importadas do Instagram automaticamente.

## Análise do estado atual

- `NewPost.tsx` já tem toda a lógica de importação: estados `importStatus`, `importWarning`, `thumbnailUrl`, função `handleImportMetrics` que chama a edge function `fetch-instagram-metrics`.
- `EditPost.tsx` **não tem** o botão de importação — só tem campos manuais de métricas.
- A edge function `fetch-instagram-metrics` já está deployada e funcional.
- A plataforma do post é armazenada no campo `platform` — portanto é possível saber se é Instagram na tela de edição.

## O que será feito

**Único arquivo alterado: `src/pages/EditPost.tsx`**

1. Adicionar os estados de importação: `importStatus`, `importWarning`, `thumbnailUrl`
2. Adicionar a função `handleImportMetrics` (mesma lógica do `NewPost.tsx`, mas usando `post.url` que já está disponível)
3. Adicionar o botão **"Atualizar métricas"** na seção de Métricas de Engajamento — visível apenas quando `post.platform === "instagram"`
4. Ao importar com sucesso, preencher `metrics` automaticamente, mostrar o `thumbnailUrl` e exibir o aviso caso a importação seja parcial
5. Os campos de curtidas/comentários ganham o badge **"auto"** verde após importação (igual ao NewPost)

## Posicionamento do botão

O botão aparece no header do card "Métricas de Engajamento", ao lado direito, apenas para posts do Instagram:

```text
┌─ Métricas de Engajamento ──────────── [↻ Atualizar métricas] ─┐
│  ❤️ Curtidas       💬 Comentários                              │
│  🔁 Compartilhamentos  🔖 Salvamentos                          │
└───────────────────────────────────────────────────────────────┘
```
