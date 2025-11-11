import { DataTypes } from 'sequelize';
import sequelize from '../db/sequelize.js';
import Author from './Author.js';

const Book = sequelize.define('Book', {
  title: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT },
  published_date: { type: DataTypes.DATE },
  image_url: { type: DataTypes.STRING },
});

Author.hasMany(Book, { foreignKey: 'author_id' });
Book.belongsTo(Author, { foreignKey: 'author_id' });

export default Book;
