import axios from "axios";
import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import {
  Globe,
  Heart,
  ImagePlus,
  MessageCircle,
  Share2,
  UserPlus,
  Users,
  Video,
} from "lucide-react";
import { useSelector } from "react-redux";
import { selectuser } from "@/Feature/Userslice";
import { toast } from "react-toastify";

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

const PublicSpacePage = () => {
  const user = useSelector(selectuser);
  const [profile, setProfile] = useState<CommunityProfile | null>(null);
  const [feed, setFeed] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [composerText, setComposerText] = useState("");
  const [mediaItems, setMediaItems] = useState<
    Array<{ type: "image" | "video"; url: string; name: string }>
  >([]);
  const [friendForm, setFriendForm] = useState({ name: "", email: "" });
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [isPosting, setIsPosting] = useState(false);
  const [isAddingFriend, setIsAddingFriend] = useState(false);

  const communityUser = useMemo(() => {
    if (!user?.email) {
      return null;
    }

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
      const [profileResponse, feedResponse] = await Promise.all([
        axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/community/profile`, {
          user: communityUser,
        }),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/community/feed`),
      ]);

      setProfile(profileResponse.data);
      setFeed(feedResponse.data);
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

  const handleMediaUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(event.target.files || []);

    if (!files.length) {
      return;
    }

    const convertedFiles = await Promise.all(
      files.map(
        (file) =>
          new Promise<{ type: "image" | "video"; url: string; name: string }>(
            (resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => {
                resolve({
                  type: file.type.startsWith("video") ? "video" : "image",
                  url: String(reader.result || ""),
                  name: file.name,
                });
              };
              reader.onerror = () => reject(reader.error);
              reader.readAsDataURL(file);
            }
          )
      )
    );

    setMediaItems((previous) => [...previous, ...convertedFiles]);
    event.target.value = "";
  };

  const handleCreatePost = async () => {
    if (!communityUser) {
      toast.error("Please sign in before posting to Public Space.");
      return;
    }

    try {
      setIsPosting(true);
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/community/posts`,
        {
          user: communityUser,
          text: composerText,
          media: mediaItems,
        }
      );

      setFeed((previous) => [response.data.post, ...previous]);
      setProfile(response.data.profile);
      setComposerText("");
      setMediaItems([]);
      toast.success(response.data.message || "Post created successfully.");
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Unable to create your post."
      );
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
          friend: {
            name: friendForm.name.trim(),
            email: friendForm.email.trim(),
          },
        }
      );

      setProfile(response.data.profile);
      setFriendForm({ name: "", email: "" });
      toast.success(response.data.message || "Friend added successfully.");
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Unable to add this friend."
      );
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

      setFeed((previous) =>
        previous.map((post) => (post._id === postId ? response.data.post : post))
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
        {
          user: communityUser,
          text,
        }
      );

      setFeed((previous) =>
        previous.map((post) => (post._id === postId ? response.data.post : post))
      );
      setCommentInputs((previous) => ({ ...previous, [postId]: "" }));
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Unable to add your comment."
      );
    }
  };

  const handleShare = async (postId: string) => {
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/community/posts/${postId}/share`
      );

      setFeed((previous) =>
        previous.map((post) => (post._id === postId ? response.data.post : post))
      );

      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(
          `${window.location.origin}/public-space`
        );
      }

      toast.success("Post shared. Public Space link copied.");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Unable to share this post.");
    }
  };

  const canPost = useMemo(() => {
    if (!profile) {
      return false;
    }

    if (profile.dailyPostLimit === "unlimited") {
      return true;
    }

    return (profile.remainingPosts ?? 0) > 0;
  }, [profile]);

  if (!communityUser) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-16">
        <div className="mx-auto max-w-3xl rounded-3xl bg-white p-10 text-center shadow-lg">
          <Globe className="mx-auto h-14 w-14 text-blue-600" />
          <h1 className="mt-4 text-3xl font-bold text-gray-900">Public Space</h1>
          <p className="mt-3 text-gray-600">
            Sign in with your account first to join the public community, build
            friendships, and share photos or videos.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Link
              href="/"
              className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Go home
            </Link>
            <Link
              href="/profile"
              className="rounded-xl border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              View profile
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 px-4 py-10 animate-slide-up">
      <div className="mx-auto max-w-7xl">
        {/* Banner Section */}
        <div className="mb-8 flex flex-col gap-6 rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-750 p-8 text-white shadow-xl shadow-slate-100 lg:flex-row lg:items-center lg:justify-between relative overflow-hidden">
          {/* Background overlay design details */}
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-white/5 rounded-full blur-[80px]" />
          <div className="absolute -bottom-20 -left-20 w-[300px] h-[300px] bg-indigo-500/10 rounded-full blur-[80px]" />

          <div className="relative z-10">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-blue-100">
              Community Space
            </p>
            <h1 className="mt-2.5 text-3xl font-extrabold font-heading tracking-tight">Public Space Timeline</h1>
            <p className="mt-3 max-w-xl text-blue-100/80 text-xs sm:text-sm leading-relaxed">
              Share updates, upload media, comment on student queries, and expand your connection count to unlock higher daily post limits.
            </p>
          </div>
          
          <div className="relative z-10 grid grid-cols-2 gap-4 rounded-2xl bg-white/10 p-4.5 backdrop-blur-md border border-white/10 min-w-[280px]">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-blue-100">Connections</p>
              <p className="mt-0.5 text-2xl font-black font-heading">${profile?.friendsCount ?? 0}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-blue-100">Today posts</p>
              <p className="mt-0.5 text-2xl font-black font-heading">${profile?.todayPosts ?? 0}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-blue-100">Daily limit</p>
              <p className="mt-0.5 text-2xl font-black font-heading">
                ${profile?.dailyPostLimit ?? 0}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-blue-100">Remaining</p>
              <p className="mt-0.5 text-2xl font-black font-heading">
                ${profile?.dailyPostLimit === "unlimited"
                  ? "∞"
                  : profile?.remainingPosts ?? 0}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[360px_minmax(0,1fr)]">
          {/* Sidebar */}
          <div className="space-y-6">
            {/* User profile tile */}
            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm shadow-slate-100">
              <div className="flex items-center gap-4">
                {communityUser.photo ? (
                  <img
                    src={communityUser.photo}
                    alt={communityUser.name}
                    className="h-14 w-14 rounded-full object-cover border border-slate-100 shadow-sm"
                  />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 font-bold text-blue-600 border border-blue-100 text-lg">
                    {communityUser.name?.charAt(0)?.toUpperCase()}
                  </div>
                )}
                <div>
                  <h2 className="text-base font-bold text-slate-800 font-heading">
                    {communityUser.name}
                  </h2>
                  <p className="text-xs text-slate-455 mt-0.5 font-medium">{communityUser.email}</p>
                </div>
              </div>
              <div className="mt-5 rounded-xl bg-slate-50 border border-slate-100 p-4 text-xs leading-relaxed text-slate-550">
                <p className="font-bold text-slate-700 font-heading uppercase tracking-wider mb-1.5 text-[10px]">Posting rule</p>
                <p>
                  0 friends: no posting. 1 friend: 1 post/day. 2 friends: 2 posts/day. 3-10 friends: same posts as friends count. &gt;10 friends: unlimited.
                </p>
              </div>
            </div>

            {/* Add friend form */}
            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm shadow-slate-100">
              <div className="flex items-center gap-2 mb-4">
                <UserPlus className="h-4.5 w-4.5 text-blue-600" />
                <h2 className="text-base font-bold text-slate-800 font-heading">
                  Add connection
                </h2>
              </div>
              <form onSubmit={handleAddFriend} className="space-y-3.5">
                <input
                  type="text"
                  value={friendForm.name}
                  onChange={(event) =>
                    setFriendForm((previous) => ({
                      ...previous,
                      name: event.target.value,
                    }))
                  }
                  placeholder="Connection name"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-700 placeholder-slate-400 outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-semibold"
                />
                <input
                  type="email"
                  value={friendForm.email}
                  onChange={(event) =>
                    setFriendForm((previous) => ({
                      ...previous,
                      email: event.target.value,
                    }))
                  }
                  placeholder="Connection email"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-700 placeholder-slate-400 outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-semibold"
                />
                <button
                  type="submit"
                  disabled={isAddingFriend}
                  className="w-full rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 transition-colors shadow-sm"
                >
                  {isAddingFriend ? "Adding..." : "Add connection"}
                </button>
              </form>
            </div>

            {/* Friend List Grid */}
            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm shadow-slate-100">
              <div className="flex items-center gap-2 mb-4">
                <Users className="h-4.5 w-4.5 text-blue-600" />
                <h2 className="text-base font-bold text-slate-800 font-heading">
                  Connections
                </h2>
              </div>
              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                {profile?.friends?.length ? (
                  profile.friends.map((friend) => (
                    <div
                      key={friend.userKey}
                      className="flex items-center justify-between rounded-xl border border-slate-50 px-3.5 py-2.5 bg-slate-50/20"
                    >
                      <div>
                        <p className="font-bold text-slate-750 text-xs">{friend.name}</p>
                        <p className="text-[10px] text-slate-455 font-medium mt-0.5">{friend.email}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="rounded-xl bg-slate-50 border border-slate-100 px-4 py-4 text-xs text-slate-455 font-medium text-center">
                    No connections yet. Add a friend to unlock posting privileges.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Main Feed Column */}
          <div className="space-y-6">
            {/* Create a Post Box */}
            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm shadow-slate-100">
              <h2 className="text-base font-bold text-slate-800 font-heading mb-4">
                Create a post
              </h2>
              <textarea
                value={composerText}
                onChange={(event) => setComposerText(event.target.value)}
                placeholder="Share something inspiring with the community..."
                className="w-full min-h-[96px] rounded-2xl border border-slate-200 p-4 text-xs sm:text-sm text-slate-700 placeholder-slate-455 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium leading-relaxed"
              />
              <div className="mt-4 flex flex-wrap gap-3">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-600 hover:text-slate-850 transition-colors">
                  <ImagePlus className="h-4 w-4 text-slate-500" />
                  Attach media
                  <input
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    className="hidden"
                    onChange={handleMediaUpload}
                  />
                </label>
              </div>

              {mediaItems.length ? (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {mediaItems.map((item, index) => (
                    <div
                      key={`${item.name}-${index}`}
                      className="overflow-hidden rounded-xl border border-slate-150 bg-slate-50"
                    >
                      {item.type === "image" ? (
                        <img
                          src={item.url}
                          alt={item.name}
                          className="h-32 w-full object-cover"
                        />
                      ) : (
                        <video
                          src={item.url}
                          controls
                          className="h-32 w-full object-cover"
                        />
                      )}
                      <div className="flex items-center gap-2 px-3.5 py-2.5 text-xs text-slate-500 font-semibold truncate border-t border-slate-100 bg-white">
                        <ImagePlus className="h-3.5 w-3.5 flex-shrink-0" />
                        <span className="truncate">{item.name}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}

              {!canPost ? (
                <div className="mt-4 bg-amber-50/55 border border-amber-100 rounded-xl px-4 py-3 flex items-start space-x-2">
                  <span className="text-amber-600 mt-0.5">⚠️</span>
                  <p className="text-xs text-amber-800 font-semibold leading-relaxed">
                    You require more connection entries or remaining daily limits to post today.
                  </p>
                </div>
              ) : null}

              <div className="mt-5 pt-4 border-t border-slate-50 flex justify-end">
                <button
                  type="button"
                  disabled={isPosting || !canPost}
                  onClick={handleCreatePost}
                  className="rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 transition-colors shadow-sm"
                >
                  {isPosting ? "Publishing..." : "Publish Post"}
                </button>
              </div>
            </div>

            {/* Posts Stream */}
            <div className="space-y-5">
              {loading ? (
                <div className="rounded-2xl border border-slate-100 bg-white p-8 text-center text-xs font-bold text-slate-400 shadow-sm">
                  Loading community timeline feed...
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
                      {/* Author Details Header */}
                      <div className="flex items-center gap-3">
                        {post.author.photo ? (
                          <img
                            src={post.author.photo}
                            alt={post.author.name}
                            className="h-11 w-11 rounded-full object-cover border border-slate-100 shadow-sm"
                          />
                        ) : (
                          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-50 font-bold text-blue-600 text-sm border border-blue-100">
                            {post.author.name?.charAt(0)?.toUpperCase()}
                          </div>
                        )}
                        <div>
                          <h3 className="font-bold text-slate-800 text-sm font-heading">
                            {post.author.name}
                          </h3>
                          <p className="text-[10px] text-slate-405 font-bold mt-0.5">
                            {new Date(post.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      {post.text ? (
                        <p className="mt-4 whitespace-pre-wrap text-xs sm:text-sm text-slate-650 leading-relaxed">
                          {post.text}
                        </p>
                      ) : null}

                      {post.media?.length ? (
                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          {post.media.map((item, index) => (
                            <div
                              key={`${post._id}-media-${index}`}
                              className="overflow-hidden rounded-xl border border-slate-150 bg-slate-50"
                            >
                              {item.type === "image" ? (
                                <img
                                  src={item.url}
                                  alt={item.name || "Post media"}
                                  className="h-60 w-full object-cover"
                                />
                              ) : (
                                <video
                                  src={item.url}
                                  controls
                                  className="h-60 w-full object-cover"
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      ) : null}

                      {/* Action buttons row */}
                      <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap gap-2 text-xs">
                        <button
                          type="button"
                          onClick={() => handleLike(post._id)}
                          className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-bold transition-colors ${
                            likedByCurrentUser
                              ? "bg-rose-50 text-rose-600 border border-rose-100"
                              : "bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-100"
                          }`}
                        >
                          <Heart className="h-3.5 w-3.5" />
                          <span>{post.likes.length}</span>
                        </button>
                        
                        <button
                          type="button"
                          className="inline-flex items-center gap-1.5 rounded-xl bg-slate-55 hover:bg-slate-100 text-slate-600 border border-slate-100 px-3 py-1.5 font-bold transition-colors"
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

                      {/* Comments section */}
                      <div className="mt-5 rounded-2xl bg-slate-50/80 border border-slate-100 p-4">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={commentInputs[post._id] || ""}
                            onChange={(event) =>
                              setCommentInputs((previous) => ({
                                ...previous,
                                [post._id]: event.target.value,
                              }))
                            }
                            placeholder="Write a comment..."
                            className="flex-1 rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-700 placeholder-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-semibold"
                          />
                          <button
                            type="button"
                            onClick={() => handleComment(post._id)}
                            className="rounded-xl bg-blue-650 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 transition-colors shadow-sm"
                          >
                            Comment
                          </button>
                        </div>

                        {post.comments.length ? (
                          <div className="mt-4 space-y-2.5 max-h-56 overflow-y-auto pr-1">
                            {post.comments.map((comment) => (
                              <div
                                key={comment._id}
                                className="rounded-xl bg-white border border-slate-100 p-3 shadow-sm shadow-slate-50"
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-bold text-slate-800 text-[11px] font-heading">{comment.author.name}</span>
                                  <span className="text-[9px] text-slate-400 font-medium">
                                    {new Date(comment.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-650 font-semibold leading-relaxed">
                                  {comment.text}
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[11px] text-slate-400 font-bold py-3 text-center">
                            No comments yet. Start the conversation.
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-2xl border border-slate-100 bg-white p-12 text-center text-xs font-bold text-slate-400 shadow-sm">
                  No public posts yet. Be the first to share something inspiring with the community!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicSpacePage;
