export type Creator = {
  id: string;
  name: string;
  avatar_url: string | null;
  role: string | null;
  created_at: string;
};

// Alias for backward compat
export type Member = Creator;

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
  weights: EngagementWeights
): number {
  return (
    metrics.likes * weights.likes_weight +
    metrics.comments * weights.comments_weight +
    metrics.shares * weights.shares_weight +
    metrics.saves * weights.saves_weight
  );
}
