
## Plan: Content Type Classification with Score Multipliers

### What needs to be done

1. **Database**: Add a `content_type_multipliers` table and a `content_type` column to `posts`.
2. **Types**: Update `Post` type and add `ContentTypeMultipliers` type in `src/lib/types.ts`. Update `calcScore` to accept an optional multiplier.
3. **NewPost & EditPost**: Add a "Tipo de conteúdo" selector (Técnico / Meme / Anúncio) with a neutral default (nenhum). Score preview must apply the multiplier live.
4. **Settings**: Add a new section "Multiplicadores por Tipo de Conteúdo" with inputs for each type. Saving must recalculate all post scores applying the correct multiplier per post.
5. **Posts list**: Show the content type badge next to the platform badge.
6. **Score recalculation**: When weights or multipliers change in Settings, recalculate every post's score as `baseScore × multiplier`.

---

### Database changes

**New table** `content_type_multipliers`:
```sql
CREATE TABLE public.content_type_multipliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  technical numeric NOT NULL DEFAULT 1.0,
  meme numeric NOT NULL DEFAULT 1.0,
  announcement numeric NOT NULL DEFAULT 1.0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.content_type_multipliers (technical, meme, announcement)
VALUES (1.0, 1.0, 1.0);

ALTER TABLE public.posts ADD COLUMN content_type text DEFAULT NULL;

-- RLS
ALTER TABLE public.content_type_multipliers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read multipliers" ON public.content_type_multipliers FOR SELECT USING (true);
CREATE POLICY "Public update multipliers" ON public.content_type_multipliers FOR UPDATE USING (true);
```

**Content types** (values stored in `posts.content_type`): `technical`, `meme`, `announcement`, or `NULL` (no type).

---

### Score formula

```
score = (likes×likes_w + comments×comments_w + shares×shares_w + saves×saves_w) × content_type_multiplier
```

If `content_type` is null → multiplier = 1.0 (no effect).

---

### Files to change

| File | Change |
|---|---|
| `src/lib/types.ts` | Add `ContentTypeMultipliers` type, add `content_type` to `Post`, update `calcScore` signature |
| `src/pages/NewPost.tsx` | Add content type selector, apply multiplier in score preview |
| `src/pages/EditPost.tsx` | Add content type selector (pre-filled), apply multiplier in score preview |
| `src/pages/Settings.tsx` | New card section for multiplier config per type, save + recalculate |
| `src/pages/Posts.tsx` | Show content type badge on post card |

---

### UX in forms (NewPost / EditPost)

A segmented selector with 4 options:
- **Nenhum** (default, multiplier = 1×, no label shown)
- **Técnico** (e.g., 1.2×)
- **Meme** (e.g., 0.5×)
- **Anúncio** (e.g., 1.3×)

The score preview will update live to reflect the multiplier.

### UX in Settings

A new card below the existing "Pesos de Engajamento" card titled "Multiplicadores por Tipo de Conteúdo", with 3 rows (Técnico, Meme, Anúncio), each with a numeric input (step 0.1, min 0). Saving the whole settings page triggers recalculation of all posts' scores with the correct multiplier applied per-type.
