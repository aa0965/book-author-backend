import { gql } from "apollo-server-express";

const typeDefs = gql`
  type Author {
    id: ID!
    name: String!
    biography: String
    born_date: String
    image_url: String
    books: [Book]
  }

  type Book {
    id: ID!
    title: String!
    description: String
    published_date: String
    image_url: String
    author: Author
    reviews: [Review]
    averageRating: Float
    preview: Preview
  }

  type Review {
    id: ID!
    bookId: ID!
    username: String!
    rating: Int!
    comment: String
    createdAt: String
  }

  type Preview {
    bookId: ID!
    snippet: String
    previewUrl: String
  }

  type User {
    id: ID!
    username: String!
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  type Query {
    books(limit: Int, offset: Int, title: String): [Book]
    book(id: ID!): Book
    authors(limit: Int, offset: Int, name: String): [Author]
    me: User
    reviews(bookId: ID!): [Review]
    preview(bookId: ID!): Preview
  }

  type Mutation {
    signup(username: String!, password: String!): AuthPayload!
    login(username: String!, password: String!): AuthPayload!

    createAuthor(name: String!, biography: String, born_date: String, image_url: String): Author
    updateAuthor(id: ID!, name: String, biography: String, born_date: String, image_url: String): Author
    deleteAuthor(id: ID!): Boolean

    createBook(
      title: String!
      description: String
      published_date: String
      author_id: ID!
      image_url: String
    ): Book
    updateBook(
      id: ID!
      title: String
      description: String
      published_date: String
      image_url: String
    ): Book
    deleteBook(id: ID!): Boolean

    addReview(bookId: ID!, rating: Int!, comment: String): Review
  }
`;

export default typeDefs;
