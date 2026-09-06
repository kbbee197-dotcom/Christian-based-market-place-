"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, MessageCircle, Share2, Play, ShoppingBag, X, Plus, ShoppingCart, Receipt, LayoutDashboard, LogOut, Settings, Search, Bell } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import BottomNav from "@/components/BottomNav";

async function getToken() {
  const { data } = await supabase.auth.getSession();
  return data?.session?.access_token || null;
}

async function callSocial(payload, token) {
  return fetch("/api/social", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
}

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
      avatarUrl: row.creator?.avatar_url || null,
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
  const [extraPosts, setExtraPosts] = useState([]);
  const [soundOn, setSoundOn] = useState(false);
  const [activeTab, setActiveTab] = useState("discover");
  const [followingIds, setFollowingIds] = useState([]);

  const allPosts = [...initialPosts, ...extraPosts]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .map(normalize);

  const posts = allPosts.filter((post) => {
    if (activeTab === "following") return followingIds.includes(post.creator.id);
    if (activeTab === "shop") return !!post.product;
    return true;
  });

  useEffect(() => {
    async function loadFollowingIds() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;

      const { data } = await supabase
        .from("follows")
        .select("creator_id")
        .eq("follower_id", userData.user.id);

      setFollowingIds((data || []).map((f) => f.creator_id));
    }
    loadFollowingIds();
  }, []);

  useEffect(() => {
    async function loadFollowerPosts() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;

      const { data } = await supabase
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
            id, title, price_cents, currency
          ),
          likes:likes(count),
          comments:comments(count)
        `
        )
        .eq("flagged", false)
        .eq("visibility", "followers")
        .order("created_at", { ascending: false })
        .limit(20);

      setExtraPosts(data || []);
    }
    loadFollowerPosts();
  }, []);

  useEffect(() => {
    function unmuteOnFirstInteraction() {
      setSoundOn(true);
      window.removeEventListener("click", unmuteOnFirstInteraction);
      window.removeEventListener("touchstart", unmuteOnFirstInteraction);
    }
    window.addEventListener("click", unmuteOnFirstInteraction);
    window.addEventListener("touchstart", unmuteOnFirstInteraction);
    return () => {
      window.removeEventListener("click", unmuteOnFirstInteraction);
      window.removeEventListener("touchstart", unmuteOnFirstInteraction);
    };
  }, []);

  return (
    <>
      <FeedHeader activeTab={activeTab} setActiveTab={setActiveTab} />
      {posts.length === 0 ? (
        <div className="min-h-dvh flex flex-col items-center justify-center bg-ink text-parchment px-6 text-center gap-2">
          <p className="font-display text-xl">
            {activeTab === "following"
              ? "No videos from people you follow yet"
              : activeTab === "shop"
              ? "No shoppable videos yet"
              : "Nothing posted yet"}
          </p>
        </div>
      ) : (
        <div className="snap-feed bg-ink">
          {posts.map((post) => (
            <FeedCard key={post.id} post={post} soundOn={soundOn} />
          ))}
        </div>
      )}
      <BottomNav />
    </>
  );
}

function FeedHeader({ activeTab, setActiveTab }) {
  const [isVendor, setIsVendor] = useState(false);

  useEffect(() => {
    async function checkVendor() {
      const { data } = await supabase.auth.getUser();
      if (!data?.user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("account_type")
        .eq("id", data.user.id)
        .single();
      setIsVendor(profile?.account_type === "vendor");
    }
    checkVendor();
  }, []);

  const tabs = [
    { key: "discover", label: "Discover" },
    { key: "following", label: "Following" },
    { key: "shop", label: "Shop" },
  ];

  return (
    <div className="fixed top-3 inset-x-3 z-50">
      <div className="flex items-center justify-between gap-2 bg-black/50 backdrop-blur-md rounded-full px-3 py-2">
        <a href="/orders" className="font-body text-xs font-semibold text-parchment shrink-0 px-1">
          Orders
        </a>

        <div className="flex items-center gap-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`font-body text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap transition-all ${
                activeTab === tab.key ? "bg-wick text-ink" : "text-parchment/70"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 shrink-0 px-1">
          {isVendor && (
            <a href="/dashboard" aria-label="Dashboard"><LayoutDashboard className="w-5 h-5 text-parchment" /></a>
          )}
          <a href="/search" aria-label="Search"><Search className="w-5 h-5 text-parchment" /></a>
          <a href="/inbox" aria-label="Inbox"><Bell className="w-5 h-5 text-parchment" /></a>
        </div>
      </div>
    </div>
  );
}

function FeedCard({ post, soundOn }) {
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [following, setFollowing] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [added, setAdded] = useState(false);
  const [authNeeded, setAuthNeeded] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let watchTimer = null;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setPlaying(entry.isIntersecting);

        if (entry.isIntersecting) {
          watchTimer = setTimeout(() => {
            logWatch(post.id);
          }, 3000);
        } else if (watchTimer) {
          clearTimeout(watchTimer);
          watchTimer = null;
        }
      },
      { threshold: 0.6 }
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
      if (watchTimer) clearTimeout(watchTimer);
    };
  }, [post.id]);

  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;

    if (playing) {
      vid.play().catch(() => {});
    } else {
      vid.pause();
    }
  }, [playing]);

  async function currentUserId() {
    const { data } = await supabase.auth.getUser();
    return data?.user?.id ?? null;
  }

  async function logWatch(postId) {
    const userId = await currentUserId();
    if (!userId) return;
    await supabase
      .from("watch_history")
      .upsert(
        { user_id: userId, post_id: postId, watched_at: new Date().toISOString() },
        { onConflict: "user_id,post_id" }
      );
  }

  async function toggleLike() {
    const userId = await currentUserId();
    if (!userId) return setAuthNeeded(true);

    const token = await getToken();
    const nextOn = !liked;

    await callSocial({ type: "like", postId: post.id, on: nextOn }, token);

    setLikeCount((c) => (nextOn ? c + 1 : c - 1));
    setLiked(nextOn);
  }

  async function handleShare() {
    const shareUrl = `${window.location.origin}/post/${post.id}`;
    const shareData = {
      title: post.creator?.name ? `${post.creator.name} on the marketplace` : "Check this out",
      text: post.caption || "",
      url: shareUrl,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        try {
          await navigator.clipboard.writeText(shareUrl);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch (clipErr) {
          console.error("Share failed:", clipErr);
        }
      }
    }
  }

  async function toggleFollow() {
    const userId = await currentUserId();
    if (!userId) return setAuthNeeded(true);

    const token = await getToken();
    const nextOn = !following;

    await callSocial({ type: "follow", creatorId: post.creator.id, on: nextOn }, token);

    setFollowing(nextOn);
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
    <section ref={containerRef} className="snap-card relative h-dvh w-full flex items-center justify-center overflow-hidden">
      <button
        onClick={() => setPlaying((v) => !v)}
        className="absolute inset-0 bg-gradient-to-b from-[#1c2030] via-[#12141C] to-[#0b0c11] flex items-center justify-center"
        aria-label={playing ? "Pause video" : "Play video"}
      >
        {post.videoUrl ? (
          <video
            ref={videoRef}
            src={post.videoUrl}
            poster={post.thumbnailUrl || undefined}
            className="absolute inset-0 w-full h-full object-cover"
            loop
            muted={!soundOn}
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
          {post.creator.avatarUrl ? (
            <img
              src={post.creator.avatarUrl}
              alt={post.creator.name}
              className="w-9 h-9 rounded-full object-cover"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-clay flex items-center justify-center font-display font-semibold text-sm">
              {post.creator.avatar}
            </div>
          )}
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
        <ActionButton icon={<Share2 />} label={copied ? "Copied!" : "Share"} onClick={handleShare} />
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
    const token = await getToken();
    await callSocial({ type: "comment", postId, body: text.trim() }, token);
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
      className="fixed inset-x-0 bottom-0 z-[60] bg-parchment text-ink rounded-t-3xl px-6 pt-5 pb-[calc(env(safe-area-inset-bottom)+88px)] max-h-[70dvh] flex flex-col"
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
