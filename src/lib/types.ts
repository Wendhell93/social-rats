export type Creator = {
  id: string;
  name: string;
  avatar_url: string | null;
  role: string | null;
  created_at: string;
};

// Alias for backward compat
export type Member = Creator;

export type PostFormat = "feed" | "stories";

export type Post = {
  id: string;
  member_id: string | null;
  url: string;
  platform: string;
  title: string | null;
  thumbnail_url: string | null;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  score: number;
  posted_at: string | null;
  created_at: string;
  content_type: string | null;
  // Stories / Feed format
  format: PostFormat;
  views_pico: number;
  interactions: number;
  forwards: number;
  cta_clicks: number;
  member?: Creator;
  post_creators?: { creator: Creator }[];
};

export type PostCreator = {
  id: string;
  post_id: string;
  creator_id: string;
};

export type EngagementWeights = {
  id: string;
  likes_weight: number;
  comments_weight: number;
  shares_weight: number;
  saves_weight: number;
  updated_at: string;
};

export type ContentTypeMultipliers = {
  id: string;
  technical: number;
  meme: number;
  announcement: number;
  updated_at: string;
};

export type StoriesWeights = {
  id: string;
  views_pico_weight: number;
  interactions_weight: number;
  forwards_weight: number;
  cta_clicks_weight: number;
  updated_at: string;
};

export type ContentType = "technical" | "meme" | "announcement" | null;

export const CONTENT_TYPE_LABELS: Record<string, string> = {
  technical: "Técnico",
  meme: "Meme",
  announcement: "Anúncio",
};

export type RankedCreator = Creator & {
  total_score: number;
  post_count: number;
  total_likes: number;
  total_comments: number;
  total_shares: number;
  total_saves: number;
  rank: number;
};

export function detectPlatform(url: string): string | null {
  if (!url) return null;
  if (url.includes("instagram.com")) return "instagram";
  if (url.includes("tiktok.com")) return "tiktok";
  if (url.includes("youtube.com") || url.includes("youtu.be")) return "youtube";
  if (url.includes("twitter.com") || url.includes("x.com")) return "twitter";
  if (url.includes("linkedin.com")) return "linkedin";
  return null;
}

export function calcScore(
  metrics: { likes: number; comments: number; shares: number; saves: number },
  weights: EngagementWeights,
  multiplier: number = 1.0
): number {
  const base =
    metrics.likes * weights.likes_weight +
    metrics.comments * weights.comments_weight +
    metrics.shares * weights.shares_weight +
    metrics.saves * weights.saves_weight;
  return base * multiplier;
}

/**
 * Stories score formula (fixed weights, no content-type multiplier):
 * Score = (views_pico × 0.25) + (interactions × 3) + (forwards × 5) + (cta_clicks × 10)
 */
export function calcScoreStories(metrics: {
  views_pico: number;
  interactions: number;
  forwards: number;
  cta_clicks: number;
}): number {
  return (
    metrics.views_pico * 0.25 +
    metrics.interactions * 3 +
    metrics.forwards * 5 +
    metrics.cta_clicks * 10
  );
}

export function getMultiplier(
  contentType: string | null,
  multipliers: ContentTypeMultipliers | null
): number {
  if (!contentType || !multipliers) return 1.0;
  if (contentType === "technical") return multipliers.technical;
  if (contentType === "meme") return multipliers.meme;
  if (contentType === "announcement") return multipliers.announcement;
  return 1.0;
}
