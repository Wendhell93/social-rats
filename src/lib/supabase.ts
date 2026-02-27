import { supabase } from "@/integrations/supabase/client";
export { supabase };

export type Member = {
  id: string;
  name: string;
  avatar_url: string | null;
  role: string | null;
  created_at: string;
};

export type Post = {
  id: string;
  member_id: string;
  url: string;
  platform: "instagram" | "tiktok";
  title: string | null;
  thumbnail_url: string | null;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  score: number;
  posted_at: string | null;
  created_at: string;
  member?: Member;
};

export type EngagementWeights = {
  id: string;
  likes_weight: number;
  comments_weight: number;
  shares_weight: number;
  saves_weight: number;
  updated_at: string;
};

export function detectPlatform(url: string): "instagram" | "tiktok" | null {
  if (url.includes("instagram.com")) return "instagram";
  if (url.includes("tiktok.com")) return "tiktok";
  return null;
}

export function calcScore(
  post: Pick<Post, "likes" | "comments" | "shares" | "saves">,
  weights: Pick<EngagementWeights, "likes_weight" | "comments_weight" | "shares_weight" | "saves_weight">
): number {
  return (
    post.likes * weights.likes_weight +
    post.comments * weights.comments_weight +
    post.shares * weights.shares_weight +
    post.saves * weights.saves_weight
  );
}
