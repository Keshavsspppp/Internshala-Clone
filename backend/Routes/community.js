const express = require("express");
const crypto = require("crypto");
const cloudinary = require("cloudinary").v2;
const router = express.Router();
const CommunityUser = require("../Model/CommunityUser");
const PublicPost = require("../Model/PublicPost");
const { verifiedAuthMiddleware: authMiddleware } = require("../middleware/auth");
const { getEndOfISTDayUTC, getISTDateKey, getStartOfISTDayUTC } = require("../utils/istTime");
const { getDailyPostingLimit } = require("../utils/communityLimits");
const { reserveUsage, releaseUsage } = require("../utils/usageQuota");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const normalizeEmail = (email = "") => String(email).trim().toLowerCase();
const normalizeUserKey = (value = "") => String(value).trim().toLowerCase();

const buildUserKey = (user = {}) => {
  return normalizeUserKey(user.uid || user.email || user.name || "");
};

const countTodayPosts = async (userKey) => {
  const startOfDay = getStartOfISTDayUTC();

  return PublicPost.countDocuments({
    "author.userKey": userKey,
    createdAt: { $gte: startOfDay },
  });
};

const serializeProfile = async (profile) => {
  const todayPosts = await countTodayPosts(profile.userKey);
  const friendsCount = profile.friends.length;
  const dailyPostLimit = getDailyPostingLimit(friendsCount);

  return {
    _id: profile._id,
    userKey: profile.userKey,
    name: profile.name,
    email: profile.email,
    photo: profile.photo,
    friends: profile.friends,
    friendRequests: profile.friendRequests || [],
    friendsCount,
    todayPosts,
    remainingPosts:
      dailyPostLimit === Infinity
        ? null
        : Math.max(dailyPostLimit - todayPosts, 0),
    dailyPostLimit:
      dailyPostLimit === Infinity ? "unlimited" : dailyPostLimit,
  };
};

const ensureCommunityUser = async (user = {}) => {
  const userKey = buildUserKey(user);
  const registeredUid = String(user.uid || "").trim();
  const email = normalizeEmail(user.email);
  const name = String(user.name || "Community Member").trim();

  if (!userKey || !email) {
    throw new Error("User email is required");
  }

  const identityMatches = [{ userKey }, { email }];
  if (registeredUid) identityMatches.push({ registeredUid });
  let profile = await CommunityUser.findOne({ $or: identityMatches });

  if (!profile) {
    profile = await CommunityUser.create({
      userKey,
      registeredUid: registeredUid || undefined,
      name,
      email,
      photo: user.photo || "",
      friends: [],
    });

    return profile;
  }

  profile.name = name;
  profile.email = email;
  if (registeredUid) profile.registeredUid = registeredUid;
  profile.photo = user.photo || profile.photo || "";
  await profile.save();

  return profile;
};

router.post("/profile", authMiddleware, async (req, res) => {
  try {
    const profile = await ensureCommunityUser({
      uid: req.user.uid,
      email: req.user.email,
      name: req.user.name,
      photo: req.user.picture || req.user.photo || "",
    });
    const serializedProfile = await serializeProfile(profile);
    return res.status(200).json(serializedProfile);
  } catch (error) {
    console.error("Unable to save community profile:", error);
    return res.status(400).json({
      message: "A signed-in user with a valid email is required.",
    });
  }
});

router.post("/friends", authMiddleware, async (req, res) => {
  const { friend } = req.body;

  try {
    const currentUser = await ensureCommunityUser({
      uid: req.user.uid,
      email: req.user.email,
      name: req.user.name,
      photo: req.user.picture || req.user.photo || "",
    });
    const friendEmail = normalizeEmail(friend?.email);

    if (!friendEmail) {
      return res.status(400).json({
        message: "Friend email is required.",
      });
    }

    const friendUser = await CommunityUser.findOne({
      email: friendEmail,
      registeredUid: { $exists: true, $ne: "" },
    });
    if (!friendUser) {
      return res.status(404).json({
        message: "No registered Public Space user was found with that email.",
      });
    }

    if (friendUser.userKey === currentUser.userKey) {
      return res.status(400).json({
        message: "You cannot add yourself as a friend.",
      });
    }

    const alreadyFriend = currentUser.friends.some(
      (entry) => entry.userKey === friendUser.userKey
    );

    if (alreadyFriend) {
      return res.status(400).json({
        message: "This user is already in your friend list.",
      });
    }

    const updatedFriend = await CommunityUser.findOneAndUpdate(
      {
        _id: friendUser._id,
        "friendRequests.userKey": { $ne: currentUser.userKey },
      },
      {
        $push: {
          friendRequests: {
            userKey: currentUser.userKey,
            name: currentUser.name,
            email: currentUser.email,
            photo: currentUser.photo,
          },
        },
      },
      { new: true }
    );
    if (!updatedFriend) {
      return res.status(400).json({ message: "A friend request is already pending." });
    }

    const serializedProfile = await serializeProfile(currentUser);
    return res.status(201).json({
      message: "Friend request sent. It will count after the user accepts it.",
      profile: serializedProfile,
    });
  } catch (error) {
    console.error("Unable to add friend:", error);
    return res.status(500).json({
      message: "Unable to add friend right now.",
    });
  }
});

router.post("/friends/requests/:requesterKey/accept", authMiddleware, async (req, res) => {
  try {
    const currentUser = await ensureCommunityUser({
      uid: req.user.uid,
      email: req.user.email,
      name: req.user.name,
      photo: req.user.picture || req.user.photo || "",
    });
    const requesterKey = normalizeUserKey(req.params.requesterKey);
    const request = currentUser.friendRequests.find((entry) => entry.userKey === requesterKey);
    if (!request) return res.status(404).json({ message: "Friend request not found." });

    const requester = await CommunityUser.findOne({ userKey: requesterKey });
    if (!requester) return res.status(404).json({ message: "Requesting user no longer exists." });

    // Update the requester first. If the second write is interrupted, the
    // request remains visible and accepting it again safely completes both sides.
    await CommunityUser.updateOne(
      { _id: requester._id },
      { $addToSet: { friends: { userKey: currentUser.userKey, name: currentUser.name, email: currentUser.email, photo: currentUser.photo } } }
    );
    await CommunityUser.updateOne(
      { _id: currentUser._id, "friendRequests.userKey": requesterKey },
      {
        $pull: { friendRequests: { userKey: requesterKey } },
        $addToSet: { friends: { userKey: requester.userKey, name: requester.name, email: requester.email, photo: requester.photo } },
      }
    );

    const refreshed = await CommunityUser.findById(currentUser._id);
    return res.status(200).json({
      message: "Friend request accepted.",
      profile: await serializeProfile(refreshed),
    });
  } catch (error) {
    console.error("Unable to accept friend request:", error);
    return res.status(500).json({ message: "Unable to accept friend request right now." });
  }
});

router.get("/feed", authMiddleware, async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = 20;
    const totalCount = await PublicPost.estimatedDocumentCount();
    const posts = await PublicPost.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();
    return res.status(200).json({ posts, totalCount, hasMore: (page * limit) < totalCount });
  } catch (error) {
    console.error("Unable to fetch feed:", error);
    return res.status(500).json({
      message: "Unable to fetch the public feed right now.",
    });
  }
});

router.post("/posts", authMiddleware, async (req, res) => {
  const { text, media = [] } = req.body;
  let reservedQuotaKey = null;

  try {
    const profile = await ensureCommunityUser({
      uid: req.user.uid,
      email: req.user.email,
      name: req.user.name,
      photo: req.user.picture || req.user.photo || "",
    });
    const friendsCount = profile.friends.length;
    const dailyPostLimit = getDailyPostingLimit(friendsCount);
    const todayPosts = await countTodayPosts(profile.userKey);

    if (dailyPostLimit === 0) {
      return res.status(403).json({
        message: "Add at least one friend before creating a public post.",
      });
    }

    if (dailyPostLimit !== Infinity && todayPosts >= dailyPostLimit) {
      return res.status(429).json({
        message: `You have reached your daily posting limit of ${dailyPostLimit}.`,
      });
    }

    if (!String(text || "").trim() && (!Array.isArray(media) || media.length === 0)) {
      return res.status(400).json({
        message: "Add some text or upload at least one photo or video.",
      });
    }

    const sanitizedMedia = Array.isArray(media)
      ? media
          .filter((item) => item?.url && item?.type)
          .map((item) => ({
            type: item.type === "video" ? "video" : "image",
            url: item.url,
            name: item.name || "",
          }))
      : [];

    if (dailyPostLimit !== Infinity) {
      const quotaKey = `public-post:${profile.userKey}:${getISTDateKey()}`;
      const reservation = await reserveUsage({
        key: quotaKey,
        limit: dailyPostLimit,
        initialCount: todayPosts,
        expiresAt: getEndOfISTDayUTC(),
      });
      if (reservation.limitReached) {
        return res.status(429).json({
          message: `You have reached your daily posting limit of ${dailyPostLimit}.`,
        });
      }
      reservedQuotaKey = quotaKey;
    }

    const post = await PublicPost.create({
      author: {
        userKey: profile.userKey,
        name: profile.name,
        email: profile.email,
        photo: profile.photo,
      },
      text: String(text || "").trim(),
      media: sanitizedMedia,
    });
    // The quota represents a posting action. Once persisted it must not be
    // released merely because a later response-enrichment query fails.
    reservedQuotaKey = null;

    const serializedProfile = await serializeProfile(profile);

    return res.status(201).json({
      message: "Post created successfully.",
      post,
      profile: serializedProfile,
    });
  } catch (error) {
    if (reservedQuotaKey) await releaseUsage({ key: reservedQuotaKey }).catch(() => null);
    console.error("Unable to create post:", error);
    return res.status(500).json({
      message: "Unable to create the post right now.",
    });
  }
});

router.delete("/posts/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;

  try {
    const profile = await ensureCommunityUser({
      uid: req.user.uid,
      email: req.user.email,
      name: req.user.name,
      photo: req.user.picture || req.user.photo || "",
    });
    const post = await PublicPost.findById(id);

    if (!post) {
      return res.status(404).json({ message: "Post not found." });
    }

    if (post.author.userKey !== profile.userKey) {
      return res.status(403).json({ message: "You are not authorized to delete this post." });
    }

    await PublicPost.findByIdAndDelete(id);

    return res.status(200).json({ message: "Post deleted successfully." });
  } catch (error) {
    console.error("Unable to delete post:", error);
    return res.status(500).json({ message: "Unable to delete the post right now." });
  }
});

router.post("/posts/:id/like", authMiddleware, async (req, res) => {
  const { id } = req.params;

  try {
    const profile = await ensureCommunityUser({
      uid: req.user.uid,
      email: req.user.email,
      name: req.user.name,
      photo: req.user.picture || req.user.photo || "",
    });
    let removed = true;
    let post = await PublicPost.findOneAndUpdate(
      { _id: id, likes: profile.userKey },
      { $pull: { likes: profile.userKey } },
      { new: true }
    );
    if (!post) {
      removed = false;
      post = await PublicPost.findByIdAndUpdate(
        id,
        { $addToSet: { likes: profile.userKey } },
        { new: true }
      );
    }
    if (!post) return res.status(404).json({ message: "Post not found." });

    return res.status(200).json({
      message: removed ? "Like removed." : "Post liked.",
      post,
    });
  } catch (error) {
    console.error("Unable to toggle like:", error);
    return res.status(500).json({
      message: "Unable to update likes right now.",
    });
  }
});

router.post("/posts/:id/comment", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const text = String(req.body.text || "").trim();

  try {
    if (!text) {
      return res.status(400).json({
        message: "Comment text is required.",
      });
    }

    const profile = await ensureCommunityUser({
      uid: req.user.uid,
      email: req.user.email,
      name: req.user.name,
      photo: req.user.picture || req.user.photo || "",
    });
    const post = await PublicPost.findByIdAndUpdate(
      id,
      {
        $push: {
          comments: {
            author: {
              userKey: profile.userKey,
              name: profile.name,
              email: profile.email,
              photo: profile.photo,
            },
            text,
          },
        },
      },
      { new: true, runValidators: true }
    );
    if (!post) return res.status(404).json({ message: "Post not found." });

    return res.status(201).json({
      message: "Comment added successfully.",
      post,
    });
  } catch (error) {
    console.error("Unable to add comment:", error);
    return res.status(500).json({
      message: "Unable to add the comment right now.",
    });
  }
});

router.delete("/posts/:postId/comment/:commentId", authMiddleware, async (req, res) => {
  const { postId, commentId } = req.params;

  try {
    const profile = await ensureCommunityUser({
      uid: req.user.uid,
      email: req.user.email,
      name: req.user.name,
      photo: req.user.picture || req.user.photo || "",
    });

    const post = await PublicPost.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found." });
    }

    const comment = post.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found." });
    }

    if (comment.author.userKey !== profile.userKey && post.author.userKey !== profile.userKey) {
      return res.status(403).json({ message: "You are not authorized to delete this comment." });
    }

    comment.deleteOne();
    await post.save();

    return res.status(200).json({
      message: "Comment deleted successfully.",
      post,
    });
  } catch (error) {
    console.error("Unable to delete comment:", error);
    return res.status(500).json({
      message: "Unable to delete the comment right now.",
    });
  }
});

router.post("/posts/:id/share", authMiddleware, async (req, res) => {
  const { id } = req.params;

  try {
    const post = await PublicPost.findByIdAndUpdate(
      id,
      { $inc: { sharesCount: 1 } },
      { new: true }
    );
    if (!post) return res.status(404).json({ message: "Post not found." });

    return res.status(200).json({
      message: "Post shared successfully.",
      post,
    });
  } catch (error) {
    console.error("Unable to share post:", error);
    return res.status(500).json({
      message: "Unable to share the post right now.",
    });
  }
});

router.post("/upload-media", authMiddleware, async (req, res) => {
  const { name, base64 } = req.body;
  try {
    if (!base64 || !name) {
      return res.status(400).json({ message: "File name and base64 data are required." });
    }

    const fs = require("fs");
    const path = require("path");

    // 1. Extension and MIME type validation
    const ALLOWED_EXTS = ['.jpg','.jpeg','.png','.gif','.webp','.mp4','.mov','.webm','.avi'];
    const ext = path.extname(name).toLowerCase();
    if (!ALLOWED_EXTS.includes(ext)) {
      return res.status(400).json({ message: "Only image and video files are allowed." });
    }

    const isImage = base64.startsWith("data:image/");
    const isVideo = base64.startsWith("data:video/");
    if (!isImage && !isVideo) {
      return res.status(400).json({ message: "Invalid file type." });
    }

    // Clean up base64 prefix if present
    const base64Data = base64.replace(/^data:image\/\w+;base64,/, "").replace(/^data:video\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    // 2. Size validation (8 MB limit check)
    const MAX_SIZE_BYTES = 8 * 1024 * 1024; // 8 MB
    if (buffer.length > MAX_SIZE_BYTES) {
      return res.status(413).json({ message: "File too large. Max 8 MB per upload." });
    }

    const filename = `media_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    let downloadUrl = "";

    try {
      const uploadResult = await cloudinary.uploader.upload(base64, {
        resource_type: "auto",
        public_id: `public-space/${filename}`,
      });
      downloadUrl = uploadResult.secure_url;
    } catch (storageError) {
      console.error("Cloudinary upload failed:", storageError);
      
      if (process.env.NODE_ENV !== "production") {
        console.warn("Development mode: Falling back to local storage for media.");
        const mediaDir = path.join(__dirname, "../public/media");

        if (!fs.existsSync(mediaDir)) {
          fs.mkdirSync(mediaDir, { recursive: true });
        }

        const localPath = path.join(mediaDir, filename + ext);
        fs.writeFileSync(localPath, buffer);

        const backendUrl = process.env.BACKEND_URL || `${req.protocol}://${req.get("host")}`;
        downloadUrl = `${backendUrl}/media/${filename}${ext}`;
        console.log(`Local fallback media URL: ${downloadUrl}`);
      } else {
        return res.status(500).json({
          message: `Media upload failed: ${storageError.message || JSON.stringify(storageError)}`
        });
      }
    }

    return res.status(200).json({ url: downloadUrl });
  } catch (error) {
    console.error("Local media upload failed:", error);
    return res.status(500).json({ message: "Failed to upload media locally." });
  }
});

module.exports = router;
