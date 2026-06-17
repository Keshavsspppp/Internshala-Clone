const express = require("express");
const router = express.Router();
const CommunityUser = require("../Model/CommunityUser");
const PublicPost = require("../Model/PublicPost");

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
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

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

router.post("/profile", async (req, res) => {
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

router.post("/friends", async (req, res) => {
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

router.get("/feed", async (req, res) => {
  try {
    const posts = await PublicPost.find().sort({ createdAt: -1 });
    return res.status(200).json(posts);
  } catch (error) {
    console.error("Unable to fetch feed:", error);
    return res.status(500).json({
      message: "Unable to fetch the public feed right now.",
    });
  }
});

router.post("/posts", async (req, res) => {
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

router.post("/posts/:id/like", async (req, res) => {
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

router.post("/posts/:id/comment", async (req, res) => {
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

router.post("/posts/:id/share", async (req, res) => {
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

module.exports = router;
