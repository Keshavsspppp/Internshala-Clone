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

const CommunityUserSchema = new mongoose.Schema(
  {
    userKey: {
      type: String,
      required: true,
      unique: true,
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
    friends: {
      type: [FriendSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("CommunityUser", CommunityUserSchema);
