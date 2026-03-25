export type Creator = {
  id: string;
  name: string;
  avatar_url: string | null;
  role: string | null;
  auth_id: string | null;
  created_at: string;
  creator_areas?: { area: Area }[];
};

// Alias for backward compat
export type Member = Creator;

export type Area = {
  id: string;
  name: string;
  created_at: string;
};

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
  views: number;
  score: number;
  posted_at: string | null;
  created_at: string;
  content_type: string | null;
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
  views_weight: number;
  use_engagement_rate: boolean;
  no_views_factor: number;
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
  metrics: { likes: number; comments: number; shares: number; saves: number; views: number },
  weights: EngagementWeights,
  multiplier: number = 1.0
): number {
  const useER = weights.use_engagement_rate ?? false;

  if (useER) {
    const interactions =
      metrics.likes * weights.likes_weight +
      metrics.comments * weights.comments_weight +
      metrics.shares * weights.shares_weight +
      metrics.saves * weights.saves_weight;

    if (metrics.views > 0) {
      // Video/Reels: Engagement Rate = (weighted interactions / views) × 100
      return (interactions / metrics.views) * 100 * multiplier;
    }

    // Carousel/Image (no views): weighted sum × normalizing factor
    const factor = weights.no_views_factor ?? 0.02;
    return interactions * factor * multiplier;
  }

  // Classic weighted sum (engagement rate off)
  const base =
    metrics.likes * weights.likes_weight +
    metrics.comments * weights.comments_weight +
    metrics.shares * weights.shares_weight +
    metrics.saves * weights.saves_weight +
    metrics.views * weights.views_weight;
  return base * multiplier;
}

export function calcScoreStories(
  metrics: { views_pico: number; interactions: number; forwards: number; cta_clicks: number },
  weights?: Pick<StoriesWeights, "views_pico_weight" | "interactions_weight" | "forwards_weight" | "cta_clicks_weight">
): number {
  const w = weights ?? { views_pico_weight: 0.25, interactions_weight: 3, forwards_weight: 5, cta_clicks_weight: 10 };
  return (
    metrics.views_pico * w.views_pico_weight +
    metrics.interactions * w.interactions_weight +
    metrics.forwards * w.forwards_weight +
    metrics.cta_clicks * w.cta_clicks_weight
  );
}

export function getMultiplier(
  contentType: string | null,
  multipliers: ContentTypeMultipliers | Record<string, number> | null
): number {
  if (!contentType || !multipliers) return 1.0;
  // Support dynamic map (from content_types table)
  if (contentType in multipliers) {
    const val = (multipliers as any)[contentType];
    if (typeof val === "number") return val;
  }
  // Legacy columns
  if (contentType === "technical" && "technical" in multipliers) return (multipliers as any).technical;
  if (contentType === "meme" && "meme" in multipliers) return (multipliers as any).meme;
  if (contentType === "announcement" && "announcement" in multipliers) return (multipliers as any).announcement;
  return 1.0;
}
