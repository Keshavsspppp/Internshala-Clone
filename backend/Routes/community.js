const express = require("express");
const router = express.Router();
const CommunityUser = require("../Model/CommunityUser");
const PublicPost = require("../Model/PublicPost");
const authMiddleware = require("../middleware/auth");

const normalizeEmail = (email = "") => String(email).trim().toLowerCase();
const normalizeUserKey = (value = "") => String(value).trim().toLowerCase();

const buildUserKey = (user = {}) => {
  return normalizeUserKey(user.uid || user.email || user.name || "");
};

const getPostingLimit = (friendsCount) => {
  if (friendsCount <= 0) {
    return 0;
  }

  if (friendsCount > 10) {
    return Infinity;
  }

  return friendsCount;
};

const countTodayPosts = async (userKey) => {
  const getISTMidnight = () => {
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istNow = new Date(now.getTime() + istOffset);
    istNow.setUTCHours(0, 0, 0, 0); // midnight in IST
    return new Date(istNow.getTime() - istOffset); // back to UTC for MongoDB
  };
  const startOfDay = getISTMidnight();

  return PublicPost.countDocuments({
    "author.userKey": userKey,
    createdAt: { $gte: startOfDay },
  });
};

const serializeProfile = async (profile) => {
  const todayPosts = await countTodayPosts(profile.userKey);
  const friendsCount = profile.friends.length;
  const dailyPostLimit = getPostingLimit(friendsCount);

  return {
    _id: profile._id,
    userKey: profile.userKey,
    name: profile.name,
    email: profile.email,
    photo: profile.photo,
    friends: profile.friends,
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
  const email = normalizeEmail(user.email);
  const name = String(user.name || "Community Member").trim();

  if (!userKey || !email) {
    throw new Error("User email is required");
  }

  let profile = await CommunityUser.findOne({ userKey });

  if (!profile) {
    profile = await CommunityUser.create({
      userKey,
      name,
      email,
      photo: user.photo || "",
      friends: [],
    });

    return profile;
  }

  profile.name = name;
  profile.email = email;
  profile.photo = user.photo || profile.photo || "";
  await profile.save();

  return profile;
};

router.post("/profile", authMiddleware, async (req, res) => {
  try {
    const profile = await ensureCommunityUser(req.body.user);
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
  const { user, friend } = req.body;

  try {
    const currentUser = await ensureCommunityUser(user);
    const friendName = String(friend?.name || "").trim();
    const friendEmail = normalizeEmail(friend?.email);

    if (!friendName || !friendEmail) {
      return res.status(400).json({
        message: "Friend name and email are required.",
      });
    }

    const friendUser = await ensureCommunityUser({
      name: friendName,
      email: friendEmail,
      photo: friend?.photo || "",
    });

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

    currentUser.friends.push({
      userKey: friendUser.userKey,
      name: friendUser.name,
      email: friendUser.email,
      photo: friendUser.photo,
    });

    friendUser.friends.push({
      userKey: currentUser.userKey,
      name: currentUser.name,
      email: currentUser.email,
      photo: currentUser.photo,
    });

    await currentUser.save();
    await friendUser.save();

    const serializedProfile = await serializeProfile(currentUser);
    return res.status(201).json({
      message: "Friend added successfully.",
      profile: serializedProfile,
    });
  } catch (error) {
    console.error("Unable to add friend:", error);
    return res.status(500).json({
      message: "Unable to add friend right now.",
    });
  }
});

router.get("/feed", authMiddleware, async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = 20;
    const posts = await PublicPost.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();
    return res.status(200).json(posts);
  } catch (error) {
    console.error("Unable to fetch feed:", error);
    return res.status(500).json({
      message: "Unable to fetch the public feed right now.",
    });
  }
});

router.post("/posts", authMiddleware, async (req, res) => {
  const { user, text, media = [] } = req.body;

  try {
    const profile = await ensureCommunityUser(user);
    const friendsCount = profile.friends.length;
    const dailyPostLimit = getPostingLimit(friendsCount);
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

    const serializedProfile = await serializeProfile(profile);

    return res.status(201).json({
      message: "Post created successfully.",
      post,
      profile: serializedProfile,
    });
  } catch (error) {
    console.error("Unable to create post:", error);
    return res.status(500).json({
      message: "Unable to create the post right now.",
    });
  }
});

router.post("/posts/:id/like", authMiddleware, async (req, res) => {
  const { id } = req.params;

  try {
    const profile = await ensureCommunityUser(req.body.user);
    const post = await PublicPost.findById(id);

    if (!post) {
      return res.status(404).json({ message: "Post not found." });
    }

    const likeIndex = post.likes.findIndex((entry) => entry === profile.userKey);

    if (likeIndex >= 0) {
      post.likes.splice(likeIndex, 1);
    } else {
      post.likes.push(profile.userKey);
    }

    await post.save();

    return res.status(200).json({
      message: likeIndex >= 0 ? "Like removed." : "Post liked.",
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

    const profile = await ensureCommunityUser(req.body.user);
    const post = await PublicPost.findById(id);

    if (!post) {
      return res.status(404).json({ message: "Post not found." });
    }

    post.comments.push({
      author: {
        userKey: profile.userKey,
        name: profile.name,
        email: profile.email,
        photo: profile.photo,
      },
      text,
    });

    await post.save();

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

router.post("/posts/:id/share", authMiddleware, async (req, res) => {
  const { id } = req.params;

  try {
    const post = await PublicPost.findById(id);

    if (!post) {
      return res.status(404).json({ message: "Post not found." });
    }

    post.sharesCount += 1;
    await post.save();

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

    // 2. Size validation (8 MB limit check)
    const MAX_SIZE_BYTES = 8 * 1024 * 1024; // 8 MB
    const sizeEstimate = Buffer.byteLength(base64, "utf8") * 0.75;
    if (sizeEstimate > MAX_SIZE_BYTES) {
      return res.status(413).json({ message: "File too large. Max 8 MB per upload." });
    }

    // Clean up base64 prefix if present
    const base64Data = base64.replace(/^data:image\/\w+;base64,/, "").replace(/^data:video\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    const filename = `media_${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`;
    // Save to separate /public/media folder
    const mediaDir = path.join(__dirname, "../public/media");

    if (!fs.existsSync(mediaDir)) {
      fs.mkdirSync(mediaDir, { recursive: true });
    }

    const localPath = path.join(mediaDir, filename);
    fs.writeFileSync(localPath, buffer);

    // Support absolute domain config or fallback to dynamic host
    const backendUrl = process.env.BACKEND_URL || `${req.protocol}://${req.get("host")}`;
    const downloadUrl = `${backendUrl}/media/${filename}`;
    console.log(`Local media uploaded: ${downloadUrl}`);

    return res.status(200).json({ url: downloadUrl });
  } catch (error) {
    console.error("Local media upload failed:", error);
    return res.status(500).json({ message: "Failed to upload media locally." });
  }
});

module.exports = router;
