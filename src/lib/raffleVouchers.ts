import { supabase } from "@/integrations/supabase/client";

/**
 * Generate raffle vouchers for a newly created/edited post.
 *
 * For each active raffle whose period includes `postDate`:
 *   - Check if the creator's areas match any of the raffle's target areas
 *   - Check if the creator hasn't exceeded max_vouchers_per_creator
 *   - Insert a voucher row
 */
export async function generateVouchersForPost(
  postId: string,
  creatorIds: string[],
  postDate: string | Date
) {
  const ts = typeof postDate === "string" ? postDate : postDate.toISOString();

  // 1. Fetch active raffles that overlap with the post date
  const { data: raffles } = await supabase
    .from("raffles")
    .select("id, max_vouchers_per_creator, start_date, end_date")
    .eq("status", "active")
    .lte("start_date", ts)
    .gte("end_date", ts);

  if (!raffles?.length) return;

  // 2. Fetch raffle → areas mapping
  const raffleIds = raffles.map((r) => r.id);
  const { data: raffleAreas } = await supabase
    .from("raffle_areas")
    .select("raffle_id, area_id")
    .in("raffle_id", raffleIds);

  if (!raffleAreas?.length) return;

  // Build map: raffleId → Set<areaId>
  const raffleAreaMap = new Map<string, Set<string>>();
  for (const ra of raffleAreas) {
    if (!raffleAreaMap.has(ra.raffle_id)) raffleAreaMap.set(ra.raffle_id, new Set());
    raffleAreaMap.get(ra.raffle_id)!.add(ra.area_id);
  }

  // 3. Fetch creator → areas mapping
  const { data: creatorAreas } = await supabase
    .from("creator_areas")
    .select("creator_id, area_id")
    .in("creator_id", creatorIds);

  if (!creatorAreas?.length) return;

  const creatorAreaMap = new Map<string, string[]>();
  for (const ca of creatorAreas) {
    if (!creatorAreaMap.has(ca.creator_id)) creatorAreaMap.set(ca.creator_id, []);
    creatorAreaMap.get(ca.creator_id)!.push(ca.area_id);
  }

  // 4. Fetch existing voucher counts per (raffle, creator)
  const { data: existingVouchers } = await supabase
    .from("raffle_vouchers")
    .select("raffle_id, creator_id")
    .in("raffle_id", raffleIds)
    .in("creator_id", creatorIds);

  const countMap = new Map<string, number>();
  for (const v of existingVouchers || []) {
    const key = `${v.raffle_id}:${v.creator_id}`;
    countMap.set(key, (countMap.get(key) || 0) + 1);
  }

  // 5. Build voucher inserts
  const inserts: {
    raffle_id: string;
    creator_id: string;
    post_id: string;
    area_id: string;
  }[] = [];

  for (const raffle of raffles) {
    const targetAreas = raffleAreaMap.get(raffle.id);
    if (!targetAreas) continue;

    for (const creatorId of creatorIds) {
      const creatorAreaIds = creatorAreaMap.get(creatorId);
      if (!creatorAreaIds) continue;

      // Find the matching area (first match)
      const matchingArea = creatorAreaIds.find((a) => targetAreas.has(a));
      if (!matchingArea) continue;

      // Check cap
      const key = `${raffle.id}:${creatorId}`;
      const current = countMap.get(key) || 0;
      if (current >= raffle.max_vouchers_per_creator) continue;

      inserts.push({
        raffle_id: raffle.id,
        creator_id: creatorId,
        post_id: postId,
        area_id: matchingArea,
      });

      // Increment local count to handle multiple creators in same batch
      countMap.set(key, current + 1);
    }
  }

  if (inserts.length > 0) {
    await supabase.from("raffle_vouchers").insert(inserts);
  }

  return inserts.length;
}

/**
 * Delete all vouchers for a specific post (used when editing/deleting a post).
 */
export async function deleteVouchersForPost(postId: string) {
  await supabase.from("raffle_vouchers").delete().eq("post_id", postId);
}

/**
 * Perform a random draw for a raffle.
 * Returns the winner info or null if no eligible vouchers.
 *
 * Each voucher is one "ticket" — more vouchers = higher chance.
 * Already-drawn creators are excluded.
 */
export async function performDraw(
  raffleId: string,
  prizeId?: string
): Promise<{
  winnerId: string;
  winnerName: string;
  voucherId: string;
  position: number;
} | null> {
  // 1. Get already drawn creator IDs
  const { data: winners } = await supabase
    .from("raffle_winners")
    .select("creator_id, position")
    .eq("raffle_id", raffleId);

  const drawnCreatorIds = new Set((winners || []).map((w) => w.creator_id));
  const nextPosition = (winners || []).length + 1;

  // 2. Get all vouchers for this raffle
  const { data: vouchers } = await supabase
    .from("raffle_vouchers")
    .select("id, creator_id")
    .eq("raffle_id", raffleId);

  if (!vouchers?.length) return null;

  // 3. Filter out already-drawn creators
  const eligible = vouchers.filter((v) => !drawnCreatorIds.has(v.creator_id));
  if (!eligible.length) return null;

  // 4. Random pick
  const picked = eligible[Math.floor(Math.random() * eligible.length)];

  // 5. Insert winner
  await supabase.from("raffle_winners").insert({
    raffle_id: raffleId,
    creator_id: picked.creator_id,
    voucher_id: picked.id,
    prize_id: prizeId || null,
    position: nextPosition,
  });

  // 6. Get winner name
  const { data: member } = await supabase
    .from("members")
    .select("name")
    .eq("id", picked.creator_id)
    .single();

  return {
    winnerId: picked.creator_id,
    winnerName: member?.name || "Desconhecido",
    voucherId: picked.id,
    position: nextPosition,
  };
}
