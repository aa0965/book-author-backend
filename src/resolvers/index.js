import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Op } from "sequelize";
import Author from "../models/Author.js";
import Book from "../models/Book.js";
import User from "../models/User.js";
import Review from "../models/Review.js";
import Preview from "../models/Preview.js";
const SECRET_KEY = process.env.JWT_SECRET || "local_secret_key";

const resolvers = {
  Query: {
    books: async (_, { limit, offset = 0, title }) => {
      const where = {};
      if (title && title.trim()) {
        // Use case-insensitive partial matching for PostgreSQL
        // This works for both existing and newly created books
        where.title = {
          [Op.iLike]: `%${title.trim()}%`,
        };
      }
      return Book.findAll({
        where,
        limit: limit || undefined,
        offset,
        include: Author,
      });
    },
    book: async (_, { id }) => {
      return Book.findByPk(id, { include: Author });
    },
    authors: async (_, { limit, offset = 0, name }) => {
      const where = {};
      if (name && name.trim()) {
        // Use case-insensitive partial matching for PostgreSQL
        where.name = {
          [Op.iLike]: `%${name.trim()}%`,
        };
      }
      return Author.findAll({ 
        where, 
        limit, 
        offset, 
        include: Book,
      });
    },
    me: async (_, __, { user }) => {
      if (!user) throw new Error("Not authenticated");
      return await User.findByPk(user.id);
    },
  },

  Mutation: {
    // 🧑‍💻 AUTH: Signup
    signup: async (_, { username, password }) => {
      const existing = await User.findOne({ where: { username } });
      if (existing) throw new Error("User already exists");

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await User.create({ username, password: hashedPassword });
      const token = jwt.sign(
        { id: user.id, username: user.username },
        SECRET_KEY
      );
      return { token, user };
    },

    // 🔐 AUTH: Login
    login: async (_, { username, password }) => {
      const user = await User.findOne({ where: { username } });
      if (!user) throw new Error("Invalid credentials");

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) throw new Error("Invalid credentials");

      const token = jwt.sign(
        { id: user.id, username: user.username },
        SECRET_KEY
      );
      return { token, user };
    },

    // ✍️ AUTHORIZED CRUD
    createAuthor: async (_, args, { user }) => {
      if (!user) throw new Error("Not authenticated");
      return Author.create(args);
    },
    updateAuthor: async (_, { id, ...updates }, { user }) => {
      if (!user) throw new Error("Not authenticated");
      await Author.update(updates, { where: { id } });
      return Author.findByPk(id);
    },
    deleteAuthor: async (_, { id }, { user }) => {
      if (!user) throw new Error("Not authenticated");
      return (await Author.destroy({ where: { id } })) > 0;
    },

    createBook: async (_, args, { user }) => {
      if (!user) throw new Error("Not authenticated");
      return Book.create(args);
    },
    updateBook: async (_, { id, ...updates }, { user }) => {
      if (!user) throw new Error("Not authenticated");
      await Book.update(updates, { where: { id } });
      return Book.findByPk(id);
    },
    deleteBook: async (_, { id }, { user }) => {
      if (!user) throw new Error("Not authenticated");
      return (await Book.destroy({ where: { id } })) > 0;
    },
    addReview: async (_, { bookId, rating, comment }, { user }) => {
      if (!user) throw new Error("Not authenticated");
      const review = await Review.create({
        bookId: String(bookId),
        username: user.username,
        rating,
        comment,
      });
      return review;
    },


  },

  Author: {
    books: (author) => Book.findAll({ where: { author_id: author.id } }),
  },
  Book: {
    author: (book) => Author.findByPk(book.author_id),
    reviews: async (book) => {
      return Review.find({ bookId: String(book.id) });
    },
    averageRating: async (book) => {
      const reviews = await Review.find({ bookId: String(book.id) });
      if (reviews.length === 0) return 0;
      const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
      return parseFloat(avg.toFixed(1));
    },
    preview: async (book) => {
      try {
        return await Preview.findOne({ bookId: String(book.id) });
      } catch (error) {
        console.error("Error fetching preview:", error);
        return null;
      }
    },
  },

};

export default resolvers;
