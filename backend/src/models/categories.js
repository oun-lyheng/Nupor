'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class categories extends Model {
    static associate(models) {
      // Many-to-Many relationship with products
      this.belongsToMany(models.products, {
        through: 'productCategories',
        foreignKey: 'categoryId',
        as: 'products',
        onDelete: 'CASCADE'
      });
    }
  }

  categories.init({
    categoryName: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    slug: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    }
  }, {
    sequelize,
    modelName: 'categories',
    tableName: 'categories',
  });

  return categories;
};
