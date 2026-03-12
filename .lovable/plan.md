
Tenho tudo que preciso. A mudança é cirúrgica — apenas reordenar os arrays em `Layout.tsx`.

**Nova ordem da sidebar (baseNavItems):**
1. Dashboard → `/`
2. Ranking → `/ranking`
3. Quero Pontuar → `/quero-pontuar`
4. Prêmios e Regras → `/awards`
5. Escola de criação → `/escola-de-criacao`
6. Conteúdos → `/posts`
7. Criadores → `/creators`
8. Configurações → `/settings` *(admin, adicionado dinamicamente)*

**Nova ordem do bottomPrimary (mobile bottom nav — 4 fixos + "Mais"):**
- Dashboard
- Quero Pontuar
- Ranking
- Prêmios e Regras
- + botão "Mais" (restantes: Escola de criação, Conteúdos, Criadores, Configurações se admin)

**Único arquivo a alterar:** `src/components/Layout.tsx`
- Linhas 32–48: substituir `baseNavItems` e `bottomPrimary` com a nova ordem.

Nada mais muda — SidebarContent, Sheet, lógica de admin, estilos, tudo permanece idêntico.
