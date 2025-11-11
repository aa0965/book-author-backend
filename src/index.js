import express from "express";
import { ApolloServer } from "apollo-server-express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import typeDefs from "./typeDefs/index.js";
import resolvers from "./resolvers/index.js";
import sequelize from "./db/sequelize.js";
import connectMongo from "./db/mongoose.js";
import cors from "cors";

// Import models to ensure associations are set up before sync
import "./models/Author.js";
import "./models/Book.js";
import "./models/User.js"; 

dotenv.config();
const SECRET_KEY = process.env.JWT_SECRET || "local_secret_key";

const app = express();
// app.use(
//   cors({
//     origin: [
//       "http://localhost:3000", // local dev
//       "https://your-frontend-domain.vercel.app", // replace with actual deployed frontend
//     ],
//     credentials: true,
//   })
// );

const startServer = async () => {
  try {
    // ✅ Connect to PostgreSQL
    await sequelize.authenticate();
    console.log("✅ PostgreSQL connection authenticated");
    
    // Sync schema: Use alter: true to add new columns without dropping data
    // This is safer than force: true which drops all tables
    try {
      await sequelize.sync({ alter: true });
      console.log("✅ PostgreSQL schema synced (alter mode - safe for production)");
    } catch (syncError) {
      console.error("⚠️  Schema sync warning:", syncError.message);
      console.log("Continuing with existing schema...");
    }

    // ✅ Connect to MongoDB
    await connectMongo();
    console.log("✅ MongoDB connected");

    // ✅ Start Apollo Server
    const server = new ApolloServer({
      typeDefs,
      resolvers,
      context: ({ req }) => {
        const auth = req.headers.authorization || "";
        if (auth.startsWith("Bearer ")) {
          try {
            const token = auth.replace("Bearer ", "");
            const decoded = jwt.verify(token, SECRET_KEY);
            return { user: decoded };
          } catch (err) {
            console.error("Invalid token");
          }
        }
        return {};
      },
    });

    await server.start();
    server.applyMiddleware({ app });

    const PORT = process.env.PORT || 4000;
    app.listen(PORT, () =>
      console.log(`🚀 Server ready at http://localhost:${PORT}${server.graphqlPath}`)
    );
  } catch (err) {
    console.error("❌ Server startup failed:", err);
  }
};

startServer();
