const mongoose = require("mongoose");

const MediaSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["image", "video"],
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      default: "",
    },
  },
  { _id: false }
);

const AuthorSchema = new mongoose.Schema(
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

const CommentSchema = new mongoose.Schema(
  {
    author: {
      type: AuthorSchema,
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const PublicPostSchema = new mongoose.Schema(
  {
    author: {
      type: AuthorSchema,
      required: true,
    },
    text: {
      type: String,
      default: "",
      trim: true,
    },
    media: {
      type: [MediaSchema],
      default: [],
    },
    likes: {
      type: [String],
      default: [],
    },
    comments: {
      type: [CommentSchema],
      default: [],
    },
    sharesCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("PublicPost", PublicPostSchema);
