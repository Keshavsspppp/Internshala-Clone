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
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 rounded-3xl bg-gradient-to-r from-blue-700 to-indigo-700 p-8 text-white shadow-lg lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-100">
              Community
            </p>
            <h1 className="mt-2 text-3xl font-bold">Public Space</h1>
            <p className="mt-3 max-w-2xl text-blue-100">
              Share photos and videos, comment on community updates, and build
              connections that increase your daily posting allowance.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 rounded-2xl bg-white/10 p-4 backdrop-blur">
            <div>
              <p className="text-xs uppercase text-blue-100">Friends</p>
              <p className="mt-1 text-2xl font-bold">{profile?.friendsCount ?? 0}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-blue-100">Today</p>
              <p className="mt-1 text-2xl font-bold">{profile?.todayPosts ?? 0}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-blue-100">Daily limit</p>
              <p className="mt-1 text-2xl font-bold">
                {profile?.dailyPostLimit ?? 0}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase text-blue-100">Remaining</p>
              <p className="mt-1 text-2xl font-bold">
                {profile?.dailyPostLimit === "unlimited"
                  ? "∞"
                  : profile?.remainingPosts ?? 0}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[360px_minmax(0,1fr)]">
          <div className="space-y-6">
            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <div className="flex items-center gap-4">
                {communityUser.photo ? (
                  <img
                    src={communityUser.photo}
                    alt={communityUser.name}
                    className="h-14 w-14 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-lg font-semibold text-blue-700">
                    {communityUser.name?.charAt(0)?.toUpperCase()}
                  </div>
                )}
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {communityUser.name}
                  </h2>
                  <p className="text-sm text-gray-500">{communityUser.email}</p>
                </div>
              </div>
              <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm text-gray-600">
                <p className="font-semibold text-gray-800">Posting rule</p>
                <p className="mt-2">
                  `0` friends: no posting, `1` friend: `1` post per day, `2`
                  friends: `2` posts per day, `3-10` friends: same number of
                  daily posts as friends, more than `10` friends: unlimited.
                </p>
              </div>
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Add a friend
                </h2>
              </div>
              <form onSubmit={handleAddFriend} className="mt-5 space-y-4">
                <input
                  type="text"
                  value={friendForm.name}
                  onChange={(event) =>
                    setFriendForm((previous) => ({
                      ...previous,
                      name: event.target.value,
                    }))
                  }
                  placeholder="Friend name"
                  className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
                  placeholder="Friend email"
                  className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
                <button
                  type="submit"
                  disabled={isAddingFriend}
                  className="w-full rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isAddingFriend ? "Adding friend..." : "Add friend"}
                </button>
              </form>
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Friend list
                </h2>
              </div>
              <div className="mt-4 space-y-3">
                {profile?.friends?.length ? (
                  profile.friends.map((friend) => (
                    <div
                      key={friend.userKey}
                      className="flex items-center justify-between rounded-2xl border border-slate-100 px-4 py-3"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{friend.name}</p>
                        <p className="text-sm text-gray-500">{friend.email}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="rounded-2xl bg-slate-50 px-4 py-4 text-sm text-gray-600">
                    No friends yet. Add a friend to unlock posting in Public
                    Space.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900">
                Create a post
              </h2>
              <textarea
                value={composerText}
                onChange={(event) => setComposerText(event.target.value)}
                placeholder="Share something inspiring with the community..."
                className="mt-4 min-h-32 w-full rounded-2xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
              <div className="mt-4 flex flex-wrap gap-3">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50">
                  <ImagePlus className="h-4 w-4" />
                  Upload photo or video
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
                      className="overflow-hidden rounded-2xl border border-slate-200"
                    >
                      {item.type === "image" ? (
                        <img
                          src={item.url}
                          alt={item.name}
                          className="h-48 w-full object-cover"
                        />
                      ) : (
                        <video
                          src={item.url}
                          controls
                          className="h-48 w-full object-cover"
                        />
                      )}
                      <div className="flex items-center gap-2 px-4 py-3 text-sm text-gray-600">
                        {item.type === "image" ? (
                          <ImagePlus className="h-4 w-4" />
                        ) : (
                          <Video className="h-4 w-4" />
                        )}
                        {item.name}
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}

              {!canPost ? (
                <p className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
                  You need more friends or remaining daily posts before you can
                  publish new content.
                </p>
              ) : null}

              <button
                type="button"
                disabled={isPosting || !canPost}
                onClick={handleCreatePost}
                className="mt-5 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPosting ? "Publishing..." : "Publish to Public Space"}
              </button>
            </div>

            <div className="space-y-5">
              {loading ? (
                <div className="rounded-3xl bg-white p-8 text-center text-gray-500 shadow-sm">
                  Loading community feed...
                </div>
              ) : feed.length ? (
                feed.map((post) => {
                  const likedByCurrentUser = profile
                    ? post.likes.includes(profile.userKey)
                    : false;

                  return (
                    <div
                      key={post._id}
                      className="rounded-3xl bg-white p-6 shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        {post.author.photo ? (
                          <img
                            src={post.author.photo}
                            alt={post.author.name}
                            className="h-12 w-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-700">
                            {post.author.name?.charAt(0)?.toUpperCase()}
                          </div>
                        )}
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {post.author.name}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {new Date(post.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      {post.text ? (
                        <p className="mt-4 whitespace-pre-wrap text-gray-700">
                          {post.text}
                        </p>
                      ) : null}

                      {post.media?.length ? (
                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          {post.media.map((item, index) => (
                            <div
                              key={`${post._id}-media-${index}`}
                              className="overflow-hidden rounded-2xl border border-slate-200"
                            >
                              {item.type === "image" ? (
                                <img
                                  src={item.url}
                                  alt={item.name || "Post media"}
                                  className="h-72 w-full object-cover"
                                />
                              ) : (
                                <video
                                  src={item.url}
                                  controls
                                  className="h-72 w-full object-cover"
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      ) : null}

                      <div className="mt-5 flex flex-wrap gap-3 text-sm">
                        <button
                          type="button"
                          onClick={() => handleLike(post._id)}
                          className={`inline-flex items-center gap-2 rounded-full px-4 py-2 ${
                            likedByCurrentUser
                              ? "bg-rose-50 text-rose-600"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          <Heart className="h-4 w-4" />
                          {post.likes.length} Likes
                        </button>
                        <button
                          type="button"
                          className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-slate-700"
                        >
                          <MessageCircle className="h-4 w-4" />
                          {post.comments.length} Comments
                        </button>
                        <button
                          type="button"
                          onClick={() => handleShare(post._id)}
                          className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-slate-700"
                        >
                          <Share2 className="h-4 w-4" />
                          {post.sharesCount} Shares
                        </button>
                      </div>

                      <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                        <div className="flex gap-3">
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
                            className="flex-1 rounded-2xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          />
                          <button
                            type="button"
                            onClick={() => handleComment(post._id)}
                            className="rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700"
                          >
                            Comment
                          </button>
                        </div>

                        <div className="mt-4 space-y-3">
                          {post.comments.length ? (
                            post.comments.map((comment) => (
                              <div
                                key={comment._id}
                                className="rounded-2xl bg-white px-4 py-3"
                              >
                                <p className="font-medium text-gray-900">
                                  {comment.author.name}
                                </p>
                                <p className="mt-1 text-sm text-gray-600">
                                  {comment.text}
                                </p>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-gray-500">
                              No comments yet. Start the conversation.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-3xl bg-white p-8 text-center text-gray-500 shadow-sm">
                  No public posts yet. Be the first to share something.
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
