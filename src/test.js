import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://book_user:password123@cluster0.abcd123.mongodb.net/book_metadata";

(async () => {
  try {
    console.log("🔄 Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("✅ MongoDB connected successfully!");

    // Optional: create a test collection
    const Test = mongoose.model("Test", new mongoose.Schema({ name: String }));
    await Test.create({ name: "Hello Mongo!" });
    const docs = await Test.find();
    console.log("📄 Sample data:", docs);

    await mongoose.disconnect();
    console.log("🔌 Connection closed.");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
  }
})();
