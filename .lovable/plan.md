
## Análise completa do app — Sugestões de melhoria

Analisei todas as páginas: Dashboard, Ranking, Posts, Criadores, Perfil do Criador, Novo Post e Editar Post. Aqui estão as principais oportunidades organizadas por impacto.

---

### UX / Usabilidade

**1. Filtro de período na aba Posts**
Hoje o filtro de período existe no Dashboard e Ranking, mas a listagem de Posts não tem filtro nenhum (apenas busca por texto). Com muitos posts, fica difícil visualizar por período.

**2. Ranking mostra todos os criadores, mesmo com 0 pontos**
O ranking exibe criadores sem nenhum post no período, o que polui a lista. Deveria ocultar quem não tem pontos ou mostrar separado.

**3. EditPost não tem campo de data de publicação**
O formulário de Novo Post tem campo de data, mas o de Edição não. Se a data foi esquecida ou errada, não dá para corrigir.

**4. Exclusão de criador sem confirmação**
O botão "✕" na lista de criadores não tem nenhum `AlertDialog` de confirmação — diferente da exclusão de posts que tem. Pode causar exclusões acidentais.

**5. Criadores sem score visível na listagem**
Os cards de criadores não mostram o score total acumulado. O usuário precisa entrar no perfil para ver. Exibir o score diretamente no card daria uma visão imediata.

---

### Funcionalidade

**6. Fórmula de score visível**
As configurações têm os pesos, mas em nenhum lugar do app é explicado como o score é calculado. Um tooltip ou linha explicativa em "Métricas" (ex: "Score = 1×curtidas + 3×comentários + 5×compartilhamentos + 2×salvamentos") ajudaria muito.

**7. Página de Settings — configurações básicas do app**
A rota `/settings` existe mas não foi analisada. Se estiver vazia ou só com pesos, poderia ganhar o título do ranking, nome da equipe, etc.

**8. Permalink do criador no ranking**
Os nomes no ranking não são clicáveis para ir ao perfil. Só o Dashboard tem esse link.

**9. Ordenação e filtros na listagem de Posts**
Além da busca por texto, adicionar ordenação (mais recente, maior score, plataforma) tornaria o gerenciamento muito mais prático.

---

### Proposta de implementação por prioridade

```
ALTA PRIORIDADE (impacto imediato)
├── Confirmação ao excluir criador
├── Campo de data na edição de post
├── Ranking clicável para perfil do criador
└── Ocultar criadores com 0 pontos no ranking (ou destacar)

MÉDIA PRIORIDADE (melhora produtividade)
├── Score visível no card de criador
├── Tooltip da fórmula de score em Novo/Editar Post
└── Ordenação na listagem de Posts

BAIXA PRIORIDADE (refinamento)
└── Filtro de período na listagem de Posts
```

---

**O que você quer implementar?**
Posso fazer tudo de uma vez ou em partes — me diga o que tem mais urgência ou aprove o plano completo.
