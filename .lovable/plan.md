
## Sistema de Ranking de Engajamento em Redes Sociais

### Visão geral
App para cadastrar conteúdo de Instagram e TikTok de membros da equipe, medir engajamento automaticamente pelo link e gerar ranking com pontuação configurável.

---

### 1. Estrutura do app (páginas)
- **Dashboard** — visão geral com cards de resumo e ranking rápido
- **Conteúdos** — lista de todos os posts cadastrados com filtros
- **Cadastrar Conteúdo** — formulário com campo de link (Instagram/TikTok)
- **Membros** — cadastro e listagem da equipe interna
- **Ranking** — tabela de posições com filtro por período
- **Configurações** — pesos de pontuação por tipo de engajamento

---

### 2. Cadastro de conteúdo
- Campo para colar o link do post (Instagram ou TikTok)
- Sistema detecta a rede social pelo formato da URL
- Ao confirmar, busca automaticamente via Firecrawl (scraping público) os metadados do post: curtidas, comentários, compartilhamentos, salvamentos (quando disponíveis publicamente)
- Associa o post a um membro da equipe
- Exibe prévia do post com os dados encontrados antes de salvar

---

### 3. Métricas e pontuação
- Tipos de engajamento rastreados: curtidas, comentários, compartilhamentos, salvamentos
- Fórmula: `score = (curtidas × peso_curtida) + (comentários × peso_comentário) + ...`
- Pesos configuráveis na página de Configurações (ex: compartilhamento = 5pts, comentário = 3pts, curtida = 1pt, salvamento = 2pts)
- Cada post exibe seu score individual

---

### 4. Ranking
- Tabela com posição, avatar, nome do membro, total de posts, score total e variação
- Filtros: período (últimos 7 dias, 30 dias, mês específico, acumulado)
- Destaque visual para Top 3 (ouro, prata, bronze)
- Gráfico de barras comparando os membros

---

### 5. Dashboard
- Cards: total de posts cadastrados, membros ativos, post de maior engajamento
- Pódio visual com os 3 primeiros do ranking
- Tabela dos posts mais recentes

---

### Backend (Supabase)
- Tabelas: `members`, `posts`, `engagement_weights`
- Os dados de engajamento (curtidas, etc.) são inseridos no cadastro via scraping ou manualmente como fallback
- Sem autenticação (acesso livre)
