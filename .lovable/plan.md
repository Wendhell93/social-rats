
## Sistema de admin + login com Google

### Visão geral

Implementar autenticação Google para o admin usando o sistema nativo (Lovable Cloud Managed Google OAuth). Quando logado como admin, o menu mostra o item "Configurações" e os botões de criar/editar/excluir aparecem em todas as páginas. Quando não logado, tudo fica apenas leitura.

---

### O que muda em cada lugar

**Menu lateral (`Layout.tsx`)**
- Adicionar botão "Entrar como admin" no rodapé (quando não logado)
- Quando logado: trocar pelo avatar do usuário Google + botão "Sair"
- Item "Configurações" só aparece quando logado como admin

**Proteção de rotas**
- `/settings`, `/posts/new`, `/posts/:id/edit` → redireciona para `/login` se não for admin
- Todas as outras rotas continuam públicas

**Botões condicionais (visíveis só se admin)**
- `Posts.tsx`: botões "+ Novo Post", editar (lápis) e excluir (lixeira)
- `Creators.tsx` / `CreatorProfile.tsx`: botões de criar/editar/excluir criador
- `Awards.tsx`: botões de criar/editar desafio e premiação
- `ScoreSpaces.tsx`: botões "+ Novo Espaço", editar e excluir
- `CreationSchool.tsx`: botões "+ Novo Recurso", editar e excluir

---

### Arquivos a criar/modificar

| Arquivo | Ação |
|---|---|
| `src/contexts/AuthContext.tsx` | Novo contexto com `user`, `isAdmin`, `signInWithGoogle`, `signOut` |
| `src/pages/Login.tsx` | Tela de login com botão "Entrar com Google" |
| `src/components/AdminRoute.tsx` | Wrapper que redireciona para `/login` se não for admin |
| `src/components/Layout.tsx` | Ocultar "Configurações", botão login/logout no rodapé |
| `src/App.tsx` | Envolver `AuthProvider`, adicionar rota `/login`, proteger `/settings`, `/posts/new`, `/posts/:id/edit` |
| `src/pages/Posts.tsx` | Ocultar botões de CRUD se não for admin |
| `src/pages/Creators.tsx` | Ocultar botões de CRUD se não for admin |
| `src/pages/CreatorProfile.tsx` | Ocultar botões de CRUD se não for admin |
| `src/pages/Awards.tsx` | Ocultar botões de criar/editar desafio se não for admin |
| `src/pages/ScoreSpaces.tsx` | Ocultar botões de CRUD se não for admin |
| `src/pages/CreationSchool.tsx` | Ocultar botões de CRUD se não for admin |

---

### Fluxo de login

```text
[Qualquer página] → clica "Entrar como admin" no rodapé do menu
  → /login → botão "Entrar com Google"
    → popup Google OAuth
      → retorna logado → redireciona para a página anterior
        → menu mostra "Configurações" + botões de edição aparecem
```

---

### AuthContext

```typescript
// Expõe:
const { user, isAdmin, signInWithGoogle, signOut } = useAuth();
// isAdmin = !!user (qualquer usuário logado é admin)
// Não há tabela de roles separada — login = admin
```

> Como o app não tem cadastro público, qualquer conta que logar via Google é tratada como admin. Simples e seguro.

---

### Banco de dados
Nenhuma migração necessária. Usaremos apenas o Supabase Auth nativo (Google OAuth gerenciado pelo Lovable Cloud).
