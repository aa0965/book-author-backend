import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
  bookId: { type: String, required: true },
  username: { type: String, required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  comment: { type: String },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Review", reviewSchema);
