
## New page: "Quero Pontuar"

### What it does
A page where admins can create and manage **spaces** — each space is a card with a name, short description, a link, and a custom button label. Users click the button to be taken to that external link (calendar, form, Monday, etc.).

---

### Database

New table: `score_spaces`

```sql
CREATE TABLE public.score_spaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  url text NOT NULL,
  button_label text NOT NULL DEFAULT 'Acessar',
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.score_spaces ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public select" ON public.score_spaces FOR SELECT USING (true);
CREATE POLICY "public insert" ON public.score_spaces FOR INSERT WITH CHECK (true);
CREATE POLICY "public update" ON public.score_spaces FOR UPDATE USING (true);
CREATE POLICY "public delete" ON public.score_spaces FOR DELETE USING (true);
```

---

### New page: `src/pages/ScoreSpaces.tsx`

**Layout sketch:**
```
/quero-pontuar
┌─────────────────────────────────────────────┐
│  Quero Pontuar             [+ Novo Espaço]  │
│  "Acesse os espaços abaixo para pontuar"    │
├─────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐         │
│  │ 📋 Nome       │  │ 📅 Calendário │         │
│  │ Descrição     │  │ Descrição    │         │
│  │               │  │              │         │
│  │ [Acessar →]  │  │ [Abrir →]    │         │
│  │   ✏️  🗑️      │  │  ✏️  🗑️      │         │
│  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────┘
```

Each card:
- Name (bold title)
- Description (muted text)
- CTA button with custom label → opens the URL in a new tab (`target="_blank"`)
- Edit (pencil) and Delete (trash) icon buttons at the bottom

**Admin dialog** (single `Dialog`):
- Field: Nome do espaço
- Field: Descrição breve
- Field: URL do link
- Field: Texto do botão (e.g. "Acessar", "Ver Calendário", "Abrir Formulário")
- Save / Cancel

---

### Files to create/modify

| File | Action |
|---|---|
| `supabase/migrations/…_score_spaces.sql` | New table + RLS |
| `src/pages/ScoreSpaces.tsx` | New page |
| `src/App.tsx` | Add `/quero-pontuar` route |
| `src/components/Layout.tsx` | Add nav item "Quero Pontuar" with `Star` icon between Premiações and Configurações |

---

### Design notes
- Consistent with existing card style (dark cards, border, rounded)
- CTA button uses the `default` blue primary variant
- Cards displayed in a responsive grid (2–3 columns on desktop, 1 on mobile)
- Deletion uses an `AlertDialog` confirmation (consistent with Posts page)
- Empty state shows a friendly prompt to create the first space
