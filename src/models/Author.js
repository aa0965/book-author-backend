import { DataTypes } from 'sequelize';
import sequelize from '../db/sequelize.js';

const Author = sequelize.define('Author', {
  name: { type: DataTypes.STRING, allowNull: false },
  biography: { type: DataTypes.TEXT },
  born_date: { type: DataTypes.DATE },
  image_url: { type: DataTypes.TEXT },
});

export default Author;
