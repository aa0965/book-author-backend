import mongoose from "mongoose";

const previewSchema = new mongoose.Schema({
  bookId: { type: String, required: true },
  snippet: String, // short text preview
  previewUrl: String // link to external preview or image
});

export default mongoose.model("Preview", previewSchema);
