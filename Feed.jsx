"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, MessageCircle, Share2, Play, ShoppingBag, X, Plus, ShoppingCart, Receipt, LayoutDashboard, LogOut } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

function normalize(row) {
  return {
    id: row.id,
    caption: row.caption,
    videoUrl: row.video_url,
    thumbnailUrl: row.thumbnail_url,
    creator: {
      id: row.creator?.id,
      name: row.creator?.display_name || row.creator?.username || "Creator",
      avatar: (row.creator?.display_name || row.creator?.username || "?")[0]?.toUpperCase(),
    },
    product: row.product
      ? {
          id: row.product.id,
          name: row.product.title,
          price: (row.product.price_cents / 100).toFixed(2),
        }
      : null,
    likeCount: row.likes?.[0]?.count ?? 0,
    commentCount: row.comments?.[0]?.count ?? 0,
  };
}

export default function Feed({ initialPosts = [] }) {
  const posts = initialPosts.map(normalize);

  return (
    <>
      <TopBar />
      {posts.length === 0 ? (
        <div className="min-h-dvh flex flex-col items-center justify-center bg-ink text-parchment px-6 text-center gap-2">
          <p className="font-display text-xl">Nothing posted yet</p>
          <p className="font-body text-slate text-sm max-w-xs">
            Once a seller uploads a video from the vendor dashboard, it'll
            show up here.
          </p>
        </div>
      ) : (
        <div className="snap-feed bg-ink">
          {posts.map((post) => (
            <FeedCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </>
  );
}

function TopBar() {
  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <div className="fixed top-0 inset-x-0 z-50 flex items-center justify-end gap-4 px-4 py-3 bg-gradient-to-b from-black/60 to-transparent pointer-events-none">
      <div className="flex items-center gap-4 pointer-events-auto">
        <a href="/cart" aria-label="Cart"><ShoppingCart className="w-5 h-5 text-parchment" /></a>
        <a href="/orders" aria-label="Orders"><Receipt className="w-5 h-5 text-parchment" /></a>
        <a href="/dashboard" aria-label="Dashboard"><LayoutDashboard className="w-5 h-5 text-parchment" /></a>
        <button onClick={logout} aria-label="Log out"><LogOut className="w-5 h-5 text-parchment" /></button>
      </div>
    </div>
  );
}

function FeedCard({ post }) {
  const [playing, setPlaying] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [following, setFollowing] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [added, setAdded] = useState(false);
  const [authNeeded, setAuthNeeded] = useState(false);

  async function currentUserId() {
    const { data } = await supabase.auth.getUser();
    return data?.user?.id ?? null;
  }

  async function toggleLike() {
    const userId = await currentUserId();
    if (!userId) return setAuthNeeded(true);

    if (liked) {
      await supabase.from("likes").delete().eq("user_id", userId).eq("post_id", post.id);
      setLikeCount((c) => c - 1);
    } else {
      await supabase.from("likes").insert({ user_id: userId, post_id: post.id });
      setLikeCount((c) => c + 1);
    }
    setLiked((v) => !v);
  }

  async function toggleFollow() {
    const userId = await currentUserId();
    if (!userId) return setAuthNeeded(true);

    if (following) {
      await supabase.from("follows").delete().eq("follower_id", userId).eq("creator_id", post.creator.id);
    } else {
      await supabase.from("follows").insert({ follower_id: userId, creator_id: post.creator.id });
    }
    setFollowing((v) => !v);
  }

  async function addToCart() {
    const userId = await currentUserId();
    if (!userId) return setAuthNeeded(true);
    if (!post.product) return;

    await supabase
      .from("cart_items")
      .upsert({ user_id: userId, product_id: post.product.id, quantity: 1 }, { onConflict: "user_id,product_id" });
    setAdded(true);
  }

  return (
    <section className="snap-card relative h-dvh w-full flex items-center justify-center overflow-hidden">
      <button
        onClick={() => setPlaying((v) => !v)}
        className="absolute inset-0 bg-gradient-to-b from-[#1c2030] via-[#12141C] to-[#0b0c11] flex items-center justify-center"
        aria-label={playing ? "Pause video" : "Play video"}
      >
        {post.videoUrl ? (
          <video
            src={post.videoUrl}
            poster={post.thumbnailUrl || undefined}
            className="absolute inset-0 w-full h-full object-cover"
            autoPlay={playing}
            loop
            muted
            playsInline
          />
        ) : (
          !playing && (
            <div className="w-16 h-16 rounded-full bg-black/40 backdrop-blur flex items-center justify-center">
              <Play className="w-7 h-7 text-parchment ml-1" fill="currentColor" />
            </div>
          )
        )}
      </button>

      <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-transparent via-wick to-transparent opacity-70 pointer-events-none" />

      <div className="absolute left-4 bottom-28 right-24 z-10">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-9 h-9 rounded-full bg-clay flex items-center justify-center font-display font-semibold text-sm">
            {post.creator.avatar}
          </div>
          <span className="font-body font-semibold text-sm">{post.creator.name}</span>
          <button
            onClick={toggleFollow}
            className={`text-xs font-semibold px-3 py-1 rounded-full border transition ${
              following ? "border-slate/40 text-slate" : "border-wick text-wick hover:bg-wick hover:text-ink"
            }`}
          >
            {following ? "Following" : "Follow"}
          </button>
        </div>
        <p className="font-body text-sm text-parchment/90 max-w-xs">{post.caption}</p>
      </div>

      <div className="absolute right-3 bottom-28 z-10 flex flex-col items-center gap-5">
        <ActionButton icon={<Heart className={liked ? "fill-clay text-clay" : ""} />} label={likeCount} onClick={toggleLike} />
        <ActionButton icon={<MessageCircle />} label={post.commentCount} onClick={() => setCommentsOpen(true)} />
        <ActionButton icon={<Share2 />} label="Share" />
      </div>

      {post.product && (
        <div className="absolute left-0 right-0 bottom-0 z-10 px-4 pb-6">
          <button
            onClick={() => setCartOpen(true)}
            className="w-full flex items-center gap-3 bg-black/50 backdrop-blur-md border border-white/10 rounded-2xl px-4 py-3 text-left"
          >
            <div className="w-11 h-11 rounded-lg bg-parchment/10 flex items-center justify-center shrink-0">
              <ShoppingBag className="w-5 h-5 text-wick" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-body text-sm font-semibold truncate">{post.product.name}</p>
              <p className="font-mono text-xs text-slate">${post.product.price}</p>
            </div>
            <span className="font-body text-xs font-semibold text-ink bg-wick px-3 py-1.5 rounded-full shrink-0">View</span>
          </button>
        </div>
      )}

      <AnimatePresence>
        {cartOpen && <ProductDrawer post={post} added={added} onAdd={addToCart} onClose={() => setCartOpen(false)} />}
        {commentsOpen && <CommentDrawer postId={post.id} onAuthNeeded={() => setAuthNeeded(true)} onClose={() => setCommentsOpen(false)} />}
        {authNeeded && <AuthPrompt onClose={() => setAuthNeeded(false)} />}
      </AnimatePresence>
    </section>
  );
}

function ActionButton({ icon, label, onClick }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1">
      <div className="w-11 h-11 rounded-full bg-black/40 backdrop-blur flex items-center justify-center [&>svg]:w-5 [&>svg]:h-5">
        {icon}
      </div>
      <span className="font-mono text-[11px] text-slate">{label}</span>
    </button>
  );
}

function ProductDrawer({ post, added, onAdd, onClose }) {
  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      className="fixed inset-x-0 bottom-0 z-30 bg-parchment text-ink rounded-t-3xl px-6 pt-5 pb-8"
    >
      <div className="w-10 h-1 bg-ink/15 rounded-full mx-auto mb-5" />
      <div className="flex items-start justify-between mb-4">
        <h3 className="font-display text-xl font-semibold">{post.product.name}</h3>
        <button onClick={onClose} aria-label="Close" className="p-1">
          <X className="w-5 h-5" />
        </button>
      </div>
      <p className="font-display text-2xl font-semibold mb-6">${post.product.price}</p>
      <button onClick={onAdd} className="w-full flex items-center justify-center gap-2 bg-ink text-parchment font-semibold py-3.5 rounded-full">
        {added ? "Added to cart ✓" : (<><Plus className="w-4 h-4" /> Add to cart</>)}
      </button>
    </motion.div>
  );
}

function CommentDrawer({ postId, onClose, onAuthNeeded }) {
  const [comments, setComments] = useState(null);
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);

  async function load() {
    const { data } = await supabase
      .from("comments")
      .select("id, body, created_at, author:profiles(username, display_name)")
      .eq("post_id", postId)
      .eq("flagged", false)
      .order("created_at", { ascending: true });
    setComments(data || []);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  async function submit(e) {
    e.preventDefault();
    if (!text.trim()) return;
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return onAuthNeeded();

    setPosting(true);
    await supabase.from("comments").insert({ post_id: postId, author_id: userData.user.id, body: text.trim() });
    setText("");
    setPosting(false);
    load();
  }

  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      className="fixed inset-x-0 bottom-0 z-30 bg-parchment text-ink rounded-t-3xl px-6 pt-5 pb-6 max-h-[70dvh] flex flex-col"
    >
      <div className="w-10 h-1 bg-ink/15 rounded-full mx-auto mb-4" />
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-lg font-semibold">Comments</h3>
        <button onClick={onClose} aria-label="Close">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 mb-3">
        {comments === null && <p className="font-body text-sm text-ink/50">Loading...</p>}
        {comments?.length === 0 && <p className="font-body text-sm text-ink/50">Be the first to comment.</p>}
        {comments?.map((c) => (
          <div key={c.id}>
            <p className="font-body text-xs font-semibold">
              {c.author?.display_name || c.author?.username || "Someone"}
            </p>
            <p className="font-body text-sm">{c.body}</p>
          </div>
        ))}
      </div>

      <form onSubmit={submit} className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a comment..."
          className="flex-1 bg-ink/5 border border-ink/10 rounded-full px-4 py-2.5 font-body text-sm"
        />
        <button disabled={posting} className="bg-ink text-parchment font-semibold px-5 rounded-full text-sm disabled:opacity-60">
          Post
        </button>
      </form>
    </motion.div>
  );
}

function AuthPrompt({ onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-40 bg-black/70 flex items-center justify-center px-8"
      onClick={onClose}
    >
      <div onClick={(e) => e.stopPropagation()} className="bg-parchment text-ink rounded-2xl p-6 max-w-xs text-center">
        <p className="font-display text-lg font-semibold mb-2">Log in to continue</p>
        <p className="font-body text-sm text-ink/60 mb-5">Create a free account to like, follow, comment, and buy.</p>
        <a href="/login" className="block w-full bg-ink text-parchment font-semibold py-3 rounded-full">
          Log in / Sign up
        </a>
      </div>
    </motion.div>
  );
}
