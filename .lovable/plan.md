
## Mobile UX study — full analysis

### Problems identified

**1. Layout — fixed sidebar (CRITICAL)**
- `aside` has `w-60 flex-shrink-0` with no responsive behaviour
- On 390px viewport: sidebar takes 240px, leaving only 150px for content → everything squishes
- No hamburger menu, no drawer, no way to close the sidebar on mobile

**2. All pages — `p-8` padding**
- Every page uses `p-8` (32px) on both sides → on 390px only ~326px usable width, with sidebar it drops to ~86px
- On mobile (no sidebar) `p-8` should become `p-4`

**3. Posts page — filter bar overflow**
- 4 filters + PeriodSelector in a single `flex flex-wrap` row
- On mobile this wraps into a mess; search bar has `min-w-48` so filters get pushed below awkwardly
- Score column + admin icons on the right float in very tight space

**4. Ranking page**
- `px-6 py-4` on each row + Avatar + name + posts count + score
- The "Posts" mini-column in the center clips; on narrow screens the layout breaks

**5. Dashboard**
- `p-8` header; stat cards `grid-cols-1 sm:grid-cols-3` is fine
- Engagement 4-card row `grid-cols-2 sm:grid-cols-4` is fine
- PeriodSelector in Layout is `px-8 pt-6` — with no sidebar this is fine, good

**6. Awards page**
- Active challenge card has complex nested layout
- Prize cards grid (1→2→3 col) is responsive, fine
- But `p-8` wrapper on entire page

**7. Creators page**
- Grid `sm:grid-cols-2 lg:grid-cols-3` degrades to single column on mobile — OK
- Admin button row (Ver perfil + Editar + ✕) in tight card space

**8. Header/title rows across pages**
- Pattern `flex items-center justify-between mb-8` with title on left and "+ Novo" button on right
- On mobile the button label text forces wrapping or overflow

**9. PeriodSelector position (Layout)**
- Shows as `flex justify-end px-8 pt-6` but only on `/` and `/ranking`
- Fine on desktop, adequate on mobile since sidebar disappears there

**10. CreatorProfile**
- `p-8` entire page
- Area chart with ResponsiveContainer is responsive — fine
- Stats row: fine

---

### Solution architecture

#### Core strategy: Bottom nav bar on mobile + slide-over sidebar

On mobile (`< md`, i.e. `< 768px`):
- Sidebar is **hidden** (`hidden md:flex`)
- A **bottom navigation bar** replaces it (standard mobile pattern, same nav items as icons + labels)
- A hamburger icon in the top-right reveals a full-screen **drawer** for the full nav (for Configurações if admin, and login/logout)

On desktop (`≥ md`): everything stays exactly as-is.

#### Files to modify

| File | Change |
|---|---|
| `src/components/Layout.tsx` | Responsive sidebar: `hidden md:flex` on aside; add mobile top bar with hamburger + logo; add mobile bottom nav (5 pinned items); add slide-over Sheet for full menu |
| `src/index.css` | Add `pb-safe` / bottom padding utility for bottom nav |
| `src/pages/Dashboard.tsx` | `p-4 md:p-8` |
| `src/pages/Posts.tsx` | `p-4 md:p-8`; collapse filters into a row with scroll or a "Filtros" button on mobile |
| `src/pages/Ranking.tsx` | `p-4 md:p-8`; simplify row layout on mobile (hide "Posts" column, keep score) |
| `src/pages/Creators.tsx` | `p-4 md:p-8` |
| `src/pages/CreatorProfile.tsx` | `p-4 md:p-8` |
| `src/pages/Awards.tsx` | `p-4 md:p-8` |
| `src/pages/ScoreSpaces.tsx` | `p-4 md:p-8` |
| `src/pages/CreationSchool.tsx` | `p-4 md:p-8` |
| `src/pages/Settings.tsx` | `p-4 md:p-8` |

---

### Layout mobile structure

```text
MOBILE (< 768px):
┌─────────────────────────────────┐
│  ☰  SocialRats              [🔔] │  ← top bar (h-14, sticky)
├─────────────────────────────────┤
│                                 │
│         page content            │
│         (p-4, full width)       │
│                                 │
│                                 │
├─────────────────────────────────┤
│  🏠    👥    📄    🏆    ···    │  ← bottom nav (h-16, sticky)
│ Dash  Cria  Cont  Rank  Mais   │
└─────────────────────────────────┘

"···" / Mais opens a Sheet with remaining items:
  - Prêmios e Regras
  - Quero Pontuar
  - Escola de Criação
  - Configurações (admin only)
  - Login / Logout

DESKTOP (≥ 768px): unchanged — sidebar + main
```

---

### Detailed changes per file

**Layout.tsx**
- `<aside>` → add `hidden md:flex` (keeps exact current desktop sidebar)
- Add mobile top bar: `<div className="md:hidden fixed top-0 left-0 right-0 z-40 h-14 ...">` with logo + Sheet trigger (hamburger)
- Add mobile bottom nav: `<nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-16 ...">` with 5 items: Dashboard, Criadores, Conteúdos, Ranking, "Mais"
- Sheet (drawer from right): full remaining nav items + login/logout
- `<main>` → add `pt-14 pb-16 md:pt-0 md:pb-0` so content clears top bar and bottom nav

**All page files**
- Change `p-8` → `p-4 md:p-8` (one-liner per page)
- Change `mb-8` header margins → `mb-6 md:mb-8`

**Posts.tsx — filter bar**
- Wrap filters in `<div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap">` → horizontal scroll on mobile instead of awkward wrapping
- Filters become horizontally scrollable chips

**Ranking.tsx — row layout**
- The "Posts" center column: add `hidden sm:block` to hide it on mobile (score is what matters)
- Row padding: `px-4 py-3 md:px-6 md:py-4`

**CreatorProfile.tsx**
- Header card: `flex-col sm:flex-row` for avatar + info block

---

### What does NOT change
- All desktop layouts stay 100% identical
- All data, auth, Supabase queries — untouched
- All admin CRUD functionality — untouched
- Colors, fonts, dark theme — untouched
