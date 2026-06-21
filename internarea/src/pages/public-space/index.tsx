import axios from "axios";
import Link from "next/link";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Globe,
  Heart,
  ImagePlus,
  MessageCircle,
  Share2,
  UserPlus,
  Users,
  X,
  Upload,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { useSelector } from "react-redux";
import { selectuser } from "@/Feature/Userslice";
import { toast } from "react-toastify";
import { storage } from "@/firebase/firebase";
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";
import { useTranslation } from "next-i18next/pages";
import { serverSideTranslations } from "next-i18next/pages/serverSideTranslations";

type CommunityFriend = {
  userKey: string;
  name: string;
  email: string;
  photo?: string;
};

type CommunityProfile = {
  userKey: string;
  name: string;
  email: string;
  photo?: string;
  friends: CommunityFriend[];
  friendsCount: number;
  todayPosts: number;
  remainingPosts: number | null;
  dailyPostLimit: number | "unlimited";
};

type CommunityComment = {
  _id: string;
  text: string;
  createdAt: string;
  author: {
    userKey: string;
    name: string;
    email: string;
    photo?: string;
  };
};

type CommunityPost = {
  _id: string;
  text: string;
  createdAt: string;
  sharesCount: number;
  likes: string[];
  media: Array<{
    type: "image" | "video";
    url: string;
    name?: string;
  }>;
  comments: CommunityComment[];
  author: {
    userKey: string;
    name: string;
    email: string;
    photo?: string;
  };
};

type UploadingFile = {
  id: string;
  file: File;
  type: "image" | "video";
  progress: number;
  status: "uploading" | "done" | "error";
  url: string;
  name: string;
};

const AvatarPlaceholder = ({
  name,
  size = "md",
}: {
  name: string;
  size?: "sm" | "md" | "lg";
}) => {
  const sizes = {
    sm: "h-8 w-8 text-xs",
    md: "h-11 w-11 text-sm",
    lg: "h-14 w-14 text-base",
  };
  return (
    <div
      className={`flex-shrink-0 flex items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 font-bold text-white border-2 border-white shadow-sm ${sizes[size]}`}
    >
      {name?.charAt(0)?.toUpperCase() || "?"}
    </div>
  );
};

const PublicSpacePage = () => {
  const { t } = useTranslation("common");
  const user = useSelector(selectuser);
  const [profile, setProfile] = useState<CommunityProfile | null>(null);
  const [feed, setFeed] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [composerText, setComposerText] = useState("");
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [friendForm, setFriendForm] = useState({ name: "", email: "" });
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [isPosting, setIsPosting] = useState(false);
  const [isAddingFriend, setIsAddingFriend] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const communityUser = useMemo(() => {
    if (!user?.email) return null;
    return {
      uid: user.uid,
      name: user.name || "Community Member",
      email: user.email,
      photo: user.photo || "",
    };
  }, [user]);

  const loadCommunityData = async () => {
    if (!communityUser) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const [profileRes, feedRes] = await Promise.all([
        axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/community/profile`, {
          user: communityUser,
        }),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/community/feed`),
      ]);
      setProfile(profileRes.data);
      setFeed(feedRes.data);
    } catch (error) {
      console.error(error);
      toast.error("Unable to load the Public Space right now.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCommunityData();
  }, [communityUser?.email]);

  // ── Firebase Storage Upload ──────────────────────────────────────────────
  const handleMediaUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    files.forEach((file) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const isVideo = file.type.startsWith("video");
      const uploadItem: UploadingFile = {
        id,
        file,
        type: isVideo ? "video" : "image",
        progress: 0,
        status: "uploading",
        url: "",
        name: file.name,
      };

      setUploadingFiles((prev) => [...prev, uploadItem]);

      // Push to Firebase Storage
      const storagePath = `public-space/${communityUser?.uid || "anon"}/${id}-${file.name}`;
      const storageRef = ref(storage, storagePath);
      const task = uploadBytesResumable(storageRef, file);

      task.on(
        "state_changed",
        (snapshot) => {
          const pct = Math.round(
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          );
          setUploadingFiles((prev) =>
            prev.map((u) => (u.id === id ? { ...u, progress: pct } : u))
          );
        },
        async () => {
          console.warn(`Firebase upload failed for ${file.name}. Trying local server fallback...`);
          
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onloadend = async () => {
            const base64data = reader.result as string;
            try {
              const uploadRes = await axios.post(
                `${process.env.NEXT_PUBLIC_API_URL}/api/community/upload-media`, 
                { name: file.name, base64: base64data }
              );
              setUploadingFiles((prev) =>
                prev.map((u) =>
                  u.id === id
                    ? { ...u, status: "done", url: uploadRes.data.url, progress: 100 }
                    : u
                )
              );
              toast.info(`Uploaded ${file.name} to local server.`);
            } catch (err) {
              setUploadingFiles((prev) =>
                prev.map((u) =>
                  u.id === id ? { ...u, status: "error", progress: 0 } : u
                )
              );
              toast.error(`Failed to upload ${file.name} to local server.`);
            }
          };
        },
        async () => {
          const downloadUrl = await getDownloadURL(task.snapshot.ref);
          setUploadingFiles((prev) =>
            prev.map((u) =>
              u.id === id
                ? { ...u, status: "done", url: downloadUrl, progress: 100 }
                : u
            )
          );
        }
      );
    });

    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeUploadingFile = (id: string) => {
    setUploadingFiles((prev) => prev.filter((u) => u.id !== id));
  };

  const allUploadsReady = uploadingFiles.every((u) => u.status === "done" || u.status === "error");
  const hasMedia = uploadingFiles.some((u) => u.status === "done");

  const handleCreatePost = async () => {
    if (!communityUser) {
      toast.error("Please sign in before posting to Public Space.");
      return;
    }
    if (!allUploadsReady) {
      toast.info("Please wait for all uploads to complete.");
      return;
    }

    try {
      setIsPosting(true);
      const media = uploadingFiles
        .filter((u) => u.status === "done")
        .map((u) => ({ type: u.type, url: u.url, name: u.name }));

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/community/posts`,
        { user: communityUser, text: composerText, media }
      );

      setFeed((prev) => [response.data.post, ...prev]);
      setProfile(response.data.profile);
      setComposerText("");
      setUploadingFiles([]);
      toast.success(response.data.message || "Post created successfully.");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Unable to create your post.");
    } finally {
      setIsPosting(false);
    }
  };

  const handleAddFriend = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!communityUser) {
      toast.error("Please sign in before adding friends.");
      return;
    }
    if (!friendForm.name.trim() || !friendForm.email.trim()) {
      toast.error("Friend name and email are required.");
      return;
    }
    try {
      setIsAddingFriend(true);
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/community/friends`,
        {
          user: communityUser,
          friend: { name: friendForm.name.trim(), email: friendForm.email.trim() },
        }
      );
      setProfile(response.data.profile);
      setFriendForm({ name: "", email: "" });
      toast.success(response.data.message || "Friend added successfully.");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Unable to add this friend.");
    } finally {
      setIsAddingFriend(false);
    }
  };

  const handleLike = async (postId: string) => {
    if (!communityUser) {
      toast.error("Please sign in before liking a post.");
      return;
    }
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/community/posts/${postId}/like`,
        { user: communityUser }
      );
      setFeed((prev) =>
        prev.map((post) => (post._id === postId ? response.data.post : post))
      );
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Unable to like this post.");
    }
  };

  const handleComment = async (postId: string) => {
    if (!communityUser) {
      toast.error("Please sign in before commenting.");
      return;
    }
    const text = commentInputs[postId]?.trim();
    if (!text) {
      toast.error("Write a comment before posting it.");
      return;
    }
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/community/posts/${postId}/comment`,
        { user: communityUser, text }
      );
      setFeed((prev) =>
        prev.map((post) => (post._id === postId ? response.data.post : post))
      );
      setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Unable to add your comment.");
    }
  };

  const handleShare = async (postId: string) => {
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/community/posts/${postId}/share`
      );
      setFeed((prev) =>
        prev.map((post) => (post._id === postId ? response.data.post : post))
      );
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(`${window.location.origin}/public-space`);
      }
      toast.success("Post shared. Public Space link copied.");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Unable to share this post.");
    }
  };

  const canPost = useMemo(() => {
    if (!profile) return false;
    if (profile.dailyPostLimit === "unlimited") return true;
    return (profile.remainingPosts ?? 0) > 0;
  }, [profile]);

  // ── Unauthenticated State ─────────────────────────────────────────────────
  if (!communityUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 flex items-center justify-center px-4 py-20">
        <div className="mx-auto max-w-lg rounded-3xl bg-white p-12 text-center shadow-xl shadow-slate-100 border border-slate-100">
          <div className="mx-auto h-16 w-16 rounded-2xl bg-blue-50 flex items-center justify-center mb-6">
            <Globe className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 font-heading">
            {t("joinPublicSpace")}
          </h1>
          <p className="mt-3 text-sm text-slate-500 leading-relaxed">
            {t("signInToConnect")}
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link
              href="/"
              className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white hover:bg-blue-700 shadow-md shadow-blue-100 transition-all"
            >
              {t("signInAndJoin")}
            </Link>
            <Link
              href="/profile"
              className="rounded-xl border border-slate-200 px-6 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all"
            >
              {t("profile")}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Main UI ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50/50 animate-slide-up">
      {/* Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 px-6 py-10 lg:px-12 lg:py-14">
        <div className="absolute inset-0 opacity-10">
          <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="ps-grid" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
                <circle cx="16" cy="16" r="1.5" fill="white" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#ps-grid)" />
          </svg>
        </div>
        <div className="relative z-10 mx-auto max-w-7xl flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-blue-100 border border-white/10 backdrop-blur-sm mb-4">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {t("liveCommunityFeed")}
            </span>
            <h1 className="text-3xl font-extrabold font-heading tracking-tight text-white lg:text-4xl">
              {t("publicSpace")}
            </h1>
            <p className="mt-2 max-w-lg text-sm text-blue-100/80 leading-relaxed">
              {t("psBannerDesc")}
            </p>
          </div>
          {/* Stats pills */}
          <div className="grid grid-cols-2 gap-3 min-w-[260px]">
            {[
              { label: t("connections"), value: profile?.friendsCount ?? 0 },
              { label: t("todayPosts"), value: profile?.todayPosts ?? 0 },
              {
                label: t("dailyLimit"),
                value:
                  profile?.dailyPostLimit === "unlimited"
                    ? "∞"
                    : profile?.dailyPostLimit ?? 0,
              },
              {
                label: t("remaining"),
                value:
                  profile?.dailyPostLimit === "unlimited"
                    ? "∞"
                    : profile?.remainingPosts ?? 0,
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl bg-white/10 border border-white/10 backdrop-blur-sm p-4 text-center"
              >
                <p className="text-2xl font-black font-heading text-white">
                  {stat.value}
                </p>
                <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-100">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
          {/* ── Sidebar ───────────────────────────────────────────── */}
          <aside className="space-y-5">
            {/* Profile card */}
            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-4">
                {communityUser.photo ? (
                  <img
                    src={communityUser.photo}
                    alt={communityUser.name}
                    className="h-14 w-14 rounded-full object-cover border-2 border-slate-100 shadow-sm"
                  />
                ) : (
                  <AvatarPlaceholder name={communityUser.name} size="lg" />
                )}
                <div className="min-w-0">
                  <h2 className="font-bold text-slate-800 font-heading truncate">
                    {communityUser.name}
                  </h2>
                  <p className="text-xs text-slate-400 font-medium truncate mt-0.5">
                    {communityUser.email}
                  </p>
                </div>
              </div>
              <div className="mt-4 rounded-xl bg-amber-50/60 border border-amber-100 p-3.5 text-xs leading-relaxed text-amber-800">
                <p className="font-bold uppercase tracking-wider text-[10px] text-amber-600 mb-1">
                  {t("postingRules")}
                </p>
                <p>
                  {t("postingRulesDesc")}
                </p>
              </div>
            </div>

            {/* Add friend */}
            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <UserPlus className="h-4 w-4 text-blue-600" />
                <h2 className="text-sm font-bold text-slate-800 font-heading">
                  {t("addConnection")}
                </h2>
              </div>
              <form onSubmit={handleAddFriend} className="space-y-3">
                <input
                  type="text"
                  value={friendForm.name}
                  onChange={(e) =>
                    setFriendForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder={t("friendNamePlaceholder")}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-700 placeholder-slate-400 outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium"
                />
                <input
                  type="email"
                  value={friendForm.email}
                  onChange={(e) =>
                    setFriendForm((prev) => ({ ...prev, email: e.target.value }))
                  }
                  placeholder={t("friendEmailPlaceholder")}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-700 placeholder-slate-400 outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium"
                />
                <button
                  type="submit"
                  disabled={isAddingFriend}
                  className="w-full rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 transition-colors shadow-sm"
                >
                  {isAddingFriend ? t("adding") : t("addConnection")}
                </button>
              </form>
            </div>

            {/* Friends list */}
            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Users className="h-4 w-4 text-blue-600" />
                <h2 className="text-sm font-bold text-slate-800 font-heading">
                  {t("connections")}
                  <span className="ml-2 px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[10px] font-bold">
                    {profile?.friendsCount ?? 0}
                  </span>
                </h2>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {profile?.friends?.length ? (
                  profile.friends.map((friend) => (
                    <div
                      key={friend.userKey}
                      className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/50 px-3 py-2.5"
                    >
                      {friend.photo ? (
                        <img
                          src={friend.photo}
                          alt={friend.name}
                          className="h-8 w-8 rounded-full object-cover border border-slate-100"
                        />
                      ) : (
                        <AvatarPlaceholder name={friend.name} size="sm" />
                      )}
                      <div className="min-w-0">
                        <p className="font-bold text-slate-700 text-xs truncate">
                          {friend.name}
                        </p>
                        <p className="text-[10px] text-slate-400 font-medium truncate">
                          {friend.email}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="rounded-xl bg-slate-50 border border-slate-100 px-4 py-4 text-xs text-slate-400 font-medium text-center">
                    {t("noConnectionsYet")}
                  </p>
                )}
              </div>
            </div>
          </aside>

          {/* ── Feed Column ──────────────────────────────────────── */}
          <div className="space-y-5">
            {/* Create Post */}
            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <h2 className="text-sm font-bold text-slate-800 font-heading mb-4">
                {t("createPost")}
              </h2>
              <textarea
                value={composerText}
                onChange={(e) => setComposerText(e.target.value)}
                placeholder={t("composerPlaceholder")}
                rows={3}
                className="w-full rounded-2xl border border-slate-200 p-4 text-xs sm:text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium leading-relaxed resize-none"
              />

              {/* Upload button */}
              <div className="mt-3 flex flex-wrap gap-3">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 transition-colors">
                  <Upload className="h-3.5 w-3.5 text-blue-500" />
                  {t("uploadToFirebase")}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    className="hidden"
                    onChange={handleMediaUpload}
                  />
                </label>
              </div>

              {/* Upload progress items */}
              {uploadingFiles.length > 0 && (
                <div className="mt-4 space-y-2">
                  {uploadingFiles.map((item) => (
                    <div
                      key={item.id}
                      className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50"
                    >
                      {/* Media preview */}
                      {item.status === "done" && (
                        item.type === "image" ? (
                          <img
                            src={item.url}
                            alt={item.name}
                            className="w-full h-32 object-cover"
                          />
                        ) : (
                          <video
                            src={item.url}
                            controls
                            className="w-full h-32 object-cover"
                          />
                        )
                      )}

                      {/* Progress bar for in-progress */}
                      {item.status === "uploading" && (
                        <div className="h-32 flex flex-col items-center justify-center gap-3 p-4">
                          <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />
                          <div className="w-full">
                            <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1">
                              <span className="truncate max-w-[180px]">{item.name}</span>
                              <span>{item.progress}%</span>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-blue-500 transition-all duration-200"
                                style={{ width: `${item.progress}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* File info footer */}
                      <div className="flex items-center gap-2 px-3 py-2 bg-white border-t border-slate-100">
                        {item.status === "done" ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                        ) : item.status === "error" ? (
                          <X className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
                        ) : (
                          <ImagePlus className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
                        )}
                        <span className="text-[10px] font-bold text-slate-500 truncate flex-1">
                          {item.name}
                        </span>
                        <button
                          onClick={() => removeUploadingFile(item.id)}
                          className="flex-shrink-0 rounded-lg p-0.5 hover:bg-slate-100 transition-colors"
                        >
                          <X className="h-3 w-3 text-slate-400" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!canPost && (
                <div className="mt-4 rounded-xl bg-amber-50 border border-amber-100 px-4 py-3 flex items-start gap-2">
                  <span className="text-amber-600 mt-0.5 text-sm">⚠️</span>
                  <p className="text-xs text-amber-800 font-semibold leading-relaxed">
                    {t("connectionLimitWarning")}
                  </p>
                </div>
              )}

              <div className="mt-5 pt-4 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  disabled={isPosting || !canPost || (!composerText.trim() && !hasMedia) || !allUploadsReady}
                  onClick={handleCreatePost}
                  className="rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 transition-colors shadow-sm flex items-center gap-2"
                >
                  {isPosting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      {t("publishing")}
                    </>
                  ) : !allUploadsReady ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      {t("uploading")}
                    </>
                  ) : (
                    t("publishPost")
                  )}
                </button>
              </div>
            </div>

            {/* Posts Stream */}
            <div className="space-y-5">
              {loading ? (
                <div className="rounded-2xl border border-slate-100 bg-white p-10 text-center">
                  <Loader2 className="h-8 w-8 text-blue-500 animate-spin mx-auto mb-3" />
                  <p className="text-xs font-bold text-slate-400">
                    {t("loadingCommunityFeed")}
                  </p>
                </div>
              ) : feed.length ? (
                feed.map((post) => {
                  const likedByCurrentUser = profile
                    ? post.likes.includes(profile.userKey)
                    : false;

                  return (
                    <div
                      key={post._id}
                      className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm hover:shadow-md hover:shadow-slate-50 transition-all duration-300"
                    >
                      {/* Author */}
                      <div className="flex items-center gap-3">
                        {post.author.photo ? (
                          <img
                            src={post.author.photo}
                            alt={post.author.name}
                            className="h-11 w-11 rounded-full object-cover border border-slate-100 shadow-sm"
                          />
                        ) : (
                          <AvatarPlaceholder name={post.author.name} />
                        )}
                        <div>
                          <h3 className="font-bold text-slate-800 text-sm font-heading">
                            {post.author.name}
                          </h3>
                          <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                            {new Date(post.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      {post.text && (
                        <p className="mt-4 whitespace-pre-wrap text-xs sm:text-sm text-slate-700 leading-relaxed">
                          {post.text}
                        </p>
                      )}

                      {/* Media grid — Firebase Storage URLs */}
                      {post.media?.length ? (
                        <div className={`mt-4 grid gap-2 ${post.media.length === 1 ? "" : "grid-cols-2"}`}>
                          {post.media.map((item, idx) => (
                            <div
                              key={`${post._id}-media-${idx}`}
                              className="overflow-hidden rounded-xl border border-slate-100 bg-slate-50"
                            >
                              {item.type === "image" ? (
                                <img
                                  src={item.url}
                                  alt={item.name || "Post image"}
                                  className="w-full h-60 object-cover"
                                />
                              ) : (
                                <video
                                  src={item.url}
                                  controls
                                  className="w-full h-60 object-cover"
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      ) : null}

                      {/* Action bar */}
                      <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap gap-2 text-xs">
                        <button
                          type="button"
                          onClick={() => handleLike(post._id)}
                          className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-bold transition-colors ${
                            likedByCurrentUser
                              ? "bg-rose-50 text-rose-600 border border-rose-100"
                              : "bg-slate-50 hover:bg-slate-100 text-slate-650 border border-slate-100"
                          }`}
                        >
                          <Heart
                            className={`h-3.5 w-3.5 ${likedByCurrentUser ? "fill-rose-500" : ""}`}
                          />
                          <span>{post.likes.length}</span>
                        </button>

                        <button
                          type="button"
                          className="inline-flex items-center gap-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-100 px-3 py-1.5 font-bold transition-colors"
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                          <span>{post.comments.length}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleShare(post._id)}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-100 px-3 py-1.5 font-bold transition-colors ml-auto"
                        >
                          <Share2 className="h-3.5 w-3.5" />
                          <span>{post.sharesCount}</span>
                        </button>
                      </div>

                      {/* Comment section */}
                      <div className="mt-4 rounded-2xl bg-slate-50/80 border border-slate-100 p-4">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={commentInputs[post._id] || ""}
                            onChange={(e) =>
                              setCommentInputs((prev) => ({
                                ...prev,
                                [post._id]: e.target.value,
                              }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleComment(post._id);
                            }}
                            placeholder={t("writeComment")}
                            className="flex-1 rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-700 placeholder-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium"
                          />
                          <button
                            type="button"
                            onClick={() => handleComment(post._id)}
                            className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 transition-colors shadow-sm"
                          >
                            {t("post")}
                          </button>
                        </div>

                        {post.comments.length ? (
                          <div className="mt-3 space-y-2 max-h-56 overflow-y-auto pr-1">
                            {post.comments.map((comment) => (
                              <div
                                key={comment._id}
                                className="rounded-xl bg-white border border-slate-100 p-3 shadow-sm"
                              >
                                <div className="flex items-center gap-2 mb-1">
                                  {comment.author.photo ? (
                                    <img
                                      src={comment.author.photo}
                                      alt={comment.author.name}
                                      className="h-6 w-6 rounded-full object-cover"
                                    />
                                  ) : (
                                    <AvatarPlaceholder
                                      name={comment.author.name}
                                      size="sm"
                                    />
                                  )}
                                  <span className="font-bold text-slate-800 text-[11px] font-heading">
                                    {comment.author.name}
                                  </span>
                                  <span className="ml-auto text-[9px] text-slate-400 font-medium">
                                    {new Date(comment.createdAt).toLocaleDateString("en-US", {
                                      month: "short",
                                      day: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-700 font-medium leading-relaxed pl-8">
                                  {comment.text}
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[11px] text-slate-400 font-bold py-3 text-center">
                            {t("noCommentsYet")}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-2xl border border-slate-100 bg-white p-16 text-center">
                  <Globe className="h-10 w-10 text-slate-200 mx-auto mb-4" />
                  <p className="text-sm font-bold text-slate-400">
                    {t("noPostsYet")}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const getStaticProps = async ({ locale }: { locale: string }) => ({
  props: {
    ...(await serverSideTranslations(locale, ["common"])),
  },
});

export default PublicSpacePage;

