
## Understanding the request

The user wants a new **Premiações** (Awards) page with:
1. **Active challenge** — highlighted at the top: challenge name, period, prizes per placement (1st, 2nd, 3rd…) each with an image and description
2. **Live ranking** — "who would win right now" using existing ranking data
3. **Past awards history** — archived completed challenges below

---

## Database design

### Table: `awards`
Represents a challenge/competition (active or past):
```sql
CREATE TABLE public.awards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  start_date date,
  end_date date,
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

### Table: `award_prizes`
Each row = one placement prize within an award:
```sql
CREATE TABLE public.award_prizes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  award_id uuid NOT NULL REFERENCES public.awards(id) ON DELETE CASCADE,
  placement integer NOT NULL,  -- 1 = 1st, 2 = 2nd, etc.
  title text NOT NULL,          -- "1º lugar"
  description text,
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

RLS: public SELECT/INSERT/UPDATE/DELETE for both tables (consistent with existing tables).

Storage: A new bucket `award-images` (public) for prize images.

---

## Pages and components

### New route: `/awards`
New nav item in Layout: **Premiações** with `Gift` icon from lucide-react, between Ranking and Settings.

### `src/pages/Awards.tsx`
Two sections:

**Section 1 — Active Challenge (hero card)**
- Fetches the single `is_active = true` award
- Shows title, description, date range
- For each prize (ordered by `placement`): placement badge, image, title, description
- "Quem levaria agora" sub-section: re-uses the ranking logic (same as Ranking.tsx) filtered by the award's `start_date`→`end_date`, showing top N creators (N = number of prizes configured), with avatar + name + score matched to the corresponding prize card
- Admin controls: button to open a modal to create/edit the active challenge and its prizes

**Section 2 — History**
- All `is_active = false` awards, sorted by `end_date` desc
- Collapsed cards showing the award name, period, and who won each placement (stored as completed data)

### Winner storage
When an award is marked as completed (is_active set to false), the system should record the actual winners. Add a `winner_member_id` column to `award_prizes`:
```sql
ALTER TABLE public.award_prizes ADD COLUMN winner_member_id uuid REFERENCES public.members(id) ON DELETE SET NULL;
```
When admin closes the competition, they assign winners from the current ranking snapshot.

---

## Admin modal flow

A single dialog (`AwardFormDialog`) with two tabs:
1. **Desafio** — title, description, start_date, end_date
2. **Prêmios** — dynamic list: add/remove placements, each with title + description + image upload (to `award-images` bucket)

"Encerrar competição" button: sets `is_active = false` and saves the current ranking snapshot as `winner_member_id` on each prize automatically.

---

## "Who would win now" logic

Reuse the same ranking computation from `Ranking.tsx` but:
- Filter posts by `posted_at` within the award's `start_date` → `end_date`
- Take top N results where N = number of prizes
- Display each creator next to their corresponding prize card

---

## Files to create/modify

| File | Action |
|---|---|
| `supabase/migrations/…_awards.sql` | Create `awards`, `award_prizes` tables + RLS + storage bucket |
| `src/pages/Awards.tsx` | New page (main display + admin controls) |
| `src/App.tsx` | Add `/awards` route |
| `src/components/Layout.tsx` | Add "Premiações" nav item with `Gift` icon |

---

## UI layout sketch

```
/awards
┌─────────────────────────────────────────────┐
│  🏆 DESAFIO ATIVO          [Editar] [Encerrar]│
│  "Nome do Desafio"  •  01/03 – 31/03/2026   │
│  Descrição do desafio...                    │
│                                             │
│  PRÊMIOS                                    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐    │
│  │🥇 1º Lugar│ │🥈 2º Lugar│ │🥉 3º Lugar│   │
│  │[imagem]  │ │[imagem]  │ │[imagem]  │    │
│  │descrição │ │descrição │ │descrição │    │
│  └──────────┘ └──────────┘ └──────────┘    │
│                                             │
│  QUEM LEVARIA AGORA                        │
│  🥇 Avatar Nome  ──── 1.240 pts            │
│  🥈 Avatar Nome  ────   980 pts            │
│  🥉 Avatar Nome  ────   750 pts            │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  HISTÓRICO DE PREMIAÇÕES                    │
│  ▼ Desafio Fevereiro 2026  01/02–28/02      │
│    🥇 João  🥈 Maria  🥉 Pedro              │
│  ▼ Desafio Janeiro 2026    01/01–31/01      │
│    🥇 Ana   🥈 Carlos ...                  │
└─────────────────────────────────────────────┘
```

---

## Summary of changes

- **2 new DB tables** + 1 storage bucket
- **1 new page** (`Awards.tsx`) with admin CRUD inline (no separate settings page needed)
- **2 small edits** (`App.tsx` + `Layout.tsx`) to wire up the new route and nav item
