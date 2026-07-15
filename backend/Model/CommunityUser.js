const mongoose = require("mongoose");

const FriendSchema = new mongoose.Schema(
  {
    userKey: {
      type: String,
      required: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    photo: {
      type: String,
      default: "",
    },
  },
  { _id: false }
);

const FriendRequestSchema = new mongoose.Schema(
  {
    userKey: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    photo: { type: String, default: "" },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const CommunityUserSchema = new mongoose.Schema(
  {
    userKey: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    registeredUid: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    photo: {
      type: String,
      default: "",
    },
    friends: {
      type: [FriendSchema],
      default: [],
    },
    friendRequests: {
      type: [FriendRequestSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("CommunityUser", CommunityUserSchema);
