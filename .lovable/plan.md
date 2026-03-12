
## Nova aba "Escola de criação"

Replicar exatamente a estrutura de "Quero Pontuar" com uma nova tabela no banco, nova página e novo item no menu.

### Banco de dados

Nova tabela `creation_school_spaces` com as mesmas colunas de `score_spaces`:
- `id`, `name`, `description`, `url`, `button_label`, `display_order`, `created_at`
- RLS: políticas públicas para select/insert/update/delete (igual à tabela irmã)

### Arquivos a criar/editar

| Arquivo | Ação |
|---|---|
| `supabase/migrations/…_creation_school_spaces.sql` | Nova tabela + RLS |
| `src/pages/CreationSchool.tsx` | Cópia adaptada de `ScoreSpaces.tsx` |
| `src/App.tsx` | Adicionar rota `/escola-de-criacao` |
| `src/components/Layout.tsx` | Adicionar item "Escola de criação" com ícone `BookOpen` entre "Quero Pontuar" e "Configurações" |

### Adaptações na nova página

- Título: **"Escola de criação"**
- Subtítulo: *"Acesse os recursos abaixo para evoluir como criador"*
- Ícone do header/empty state: `BookOpen` (lucide-react)
- queryKey: `["creation_school_spaces"]`
- Tabela Supabase: `creation_school_spaces`
- Textos de toast/dialog: "Recurso criado/atualizado/removido"
- Placeholder do botão: `"Acessar"`

Todo o restante (grid responsivo, modal CRUD, AlertDialog de exclusão, loading skeletons) permanece idêntico ao `ScoreSpaces.tsx`.
