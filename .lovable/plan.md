
## Contexto do problema

O scraping automático de Instagram e TikTok não funciona (Firecrawl bloqueia essas plataformas com 403). Por isso, **o rastreamento de dados precisa ser 100% manual**. O fluxo atual já suporta entrada manual, mas tem algumas fricções que tornam o processo confuso ou trabalhoso:

1. O botão "Buscar" não deixa claro que vai falhar para Instagram/TikTok — o usuário fica tentando
2. Não há como **editar métricas de um post já salvo** (ex: atualizar curtidas depois que o post cresceu)
3. Não há campo de **data do post** no formulário de cadastro — sem isso, os filtros de período do ranking ficam inúteis
4. A página de posts não mostra a data de publicação

## Plano de melhorias para o rastreamento manual

### 1. Remover a tentativa de scraping — formulário direto
Em vez de mostrar o botão "Buscar" que sempre vai falhar para Instagram/TikTok, mostrar diretamente o formulário de métricas assim que a URL for detectada como válida.

- Remover o botão "Buscar" e a lógica de scraping do `NewPost.tsx`
- Mostrar os campos de métricas imediatamente após colar uma URL válida
- Manter a detecção de plataforma (Instagram/TikTok)

### 2. Adicionar campo de data do post
- Adicionar campo "Data do post" no formulário de cadastro (`NewPost.tsx`)
- Salvar no campo `posted_at` já existente no banco
- Mostrar a data na listagem de posts (`Posts.tsx`)

### 3. Adicionar edição de métricas de posts existentes
- Adicionar botão de edição na listagem de posts (`Posts.tsx`)
- Abrir dialog/inline com campos editáveis de curtidas, comentários, compartilhamentos e salvamentos
- Recalcular o score ao salvar

## Arquivos a editar

- `src/pages/NewPost.tsx` — remover scraping, simplificar para formulário direto + campo de data
- `src/pages/Posts.tsx` — adicionar data na listagem + botão/dialog de edição de métricas

Nenhuma alteração de banco necessária — o campo `posted_at` já existe na tabela `posts`.
