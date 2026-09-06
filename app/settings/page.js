"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Settings as SettingsIcon } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import BottomNav from "@/components/BottomNav";
import SelfieCamera from "@/components/SelfieCamera";

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [bio, setBio] = useState("");
  const [savingBio, setSavingBio] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [message, setMessage] = useState("");
  const [showCamera, setShowCamera] = useState(false);
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) {
        router.replace("/login");
        return;
      }
      setEmail(userData.user.email);

      const { data: profileData } = await supabase
        .from("profiles")
        .select("display_name, username, account_type, bio, avatar_url")
        .eq("id", userData.user.id)
        .single();

      setProfile(profileData);
      setBio(profileData?.bio || "");
      setLoading(false);
    }
    load();
  }, [router]);

  async function uploadAvatarFile(file) {
    if (!file) return;
    setUploadingAvatar(true);
    setMessage("");
    try {
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", preset);
      formData.append("resource_type", "image");
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: "POST", body: formData }
      );
      if (!res.ok) throw new Error("Upload to Cloudinary failed");
      const json = await res.json();
      const { data: userData } = await supabase.auth.getUser();
      await supabase.from("profiles").update({ avatar_url: json.secure_url }).eq("id", userData.user.id);
      setProfile((p) => ({ ...p, avatar_url: json.secure_url }));
    } catch (err) {
      setMessage("Couldn't upload photo: " + err.message);
    } finally {
      setUploadingAvatar(false);
    }
  }

  function uploadAvatar(e) {
    const file = e.target.files?.[0];
    uploadAvatarFile(file);
  }

  function handleSelfie(file) {
    setShowCamera(false);
    uploadAvatarFile(file);
  }

  async function saveBio() {
    setSavingBio(true);
    setMessage("");
    const { data: userData } = await supabase.auth.getUser();
    const { data: updated, error } = await supabase
      .from("profiles")
      .update({ bio })
      .eq("id", userData.user.id)
      .select();
    if (error) {
      setMessage("Couldn't save bio: " + error.message);
    } else if (!updated || updated.length === 0) {
      setMessage("Save didn't return a row — likely blocked by a permissions rule.");
    } else {
      setMessage("Bio saved!");
    }
    setSavingBio(false);
  }

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-ink text-slate font-body">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-ink text-parchment px-5 pt-6 pb-28">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-semibold">Profile</h1>
        <a href="/settings/account" aria-label="Settings">
          <SettingsIcon className="w-5 h-5 text-slate" />
        </a>
      </div>

      <div className="flex flex-col items-center mb-6">
        <div className="relative">
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt="Profile"
              className="w-20 h-20 rounded-full object-cover"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-clay flex items-center justify-center font-display text-2xl font-semibold">
              {(profile?.display_name || profile?.username || "?")[0]?.toUpperCase()}
            </div>
          )}
          <button
            onClick={() => setShowAvatarMenu((v) => !v)}
            className="absolute bottom-0 right-0 bg-wick text-ink text-xs font-semibold rounded-full px-2 py-0.5"
          >
            {uploadingAvatar ? "..." : "Edit"}
          </button>
        </div>

        {showAvatarMenu && (
          <div className="mt-3 flex gap-2">
            <label className="bg-white/10 text-parchment text-xs font-semibold px-4 py-2 rounded-full cursor-pointer">
              Upload photo
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  setShowAvatarMenu(false);
                  uploadAvatar(e);
                }}
                className="hidden"
              />
            </label>
            <button
              onClick={() => {
                setShowAvatarMenu(false);
                setShowCamera(true);
              }}
              className="bg-white/10 text-parchment text-xs font-semibold px-4 py-2 rounded-full"
            >
              Take selfie
            </button>
          </div>
        )}
      </div>

      {showCamera && (
        <SelfieCamera onCapture={handleSelfie} onCancel={() => setShowCamera(false)} />
      )}

      {message && <p className="font-body text-sm text-clay mb-4 text-center">{message}</p>}

      <div className="bg-white/5 rounded-xl p-5 mb-4">
        <p className="font-body text-sm text-slate mb-2">Bio</p>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Tell people a little about yourself or your business"
          rows={3}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 font-body text-sm resize-none"
        />
        <button
          onClick={saveBio}
          disabled={savingBio}
          className="mt-2 bg-wick text-ink font-semibold text-sm px-4 py-2 rounded-full disabled:opacity-60"
        >
          {savingBio ? "Saving..." : "Save bio"}
        </button>
      </div>

      <div className="bg-white/5 rounded-xl p-5 mb-4 space-y-1">
        <p className="font-body text-sm text-slate">Username</p>
        <p className="font-body font-semibold">{profile?.username || profile?.display_name}</p>
      </div>

      <div className="bg-white/5 rounded-xl p-5 mb-4 space-y-1">
        <p className="font-body text-sm text-slate">Email</p>
        <p className="font-body font-semibold">{email}</p>
      </div>

      <div className="bg-white/5 rounded-xl p-5 mb-4 space-y-1">
        <p className="font-body text-sm text-slate">Account type</p>
        <p className="font-body font-semibold capitalize">{profile?.account_type}</p>
      </div>

      <BottomNav />
    </div>
  );
}
