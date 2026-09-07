import Feed from "@/components/Feed";
import { supabaseServer } from "@/lib/supabaseServer";

export const revalidate = 0; // always fetch fresh — this is a live feed

export default async function FeedPage() {
  const supabase = supabaseServer();

  const { data, error } = await supabase
    .from("videos_posts")
    .select(
      `
      id,
      caption,
      video_url,
      thumbnail_url,
      created_at,
      creator:profiles!videos_posts_creator_id_fkey (
        id, username, display_name, avatar_url
      ),
      product:products (
        id, title, price_cents, currency, image_urls, description, tagline, category, tags, inventory_count
      ),
      likes:likes(count),
      comments:comments(count)
    `
    )
    .eq("flagged", false)
    .eq("visibility", "public")
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    // Most common cause early on: schema.sql hasn't been run yet, or
    // NEXT_PUBLIC_SUPABASE_URL / ANON_KEY aren't set in Vercel yet.
    return (
      <main className="min-h-dvh flex items-center justify-center bg-ink text-parchment px-6 text-center">
        <p className="font-body text-slate">
          Couldn't load the feed yet. Check that your Supabase environment
          variables are set and that schema.sql has been run.
        </p>
      </main>
    );
  }

  return <Feed initialPosts={data ?? []} />;
}
