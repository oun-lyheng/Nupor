'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class products extends Model {
    static associate(models) {
      // Many-to-One with users (Seller)
      this.belongsTo(models.users, {
        foreignKey: 'userId',
        as: 'seller',
        onDelete: 'CASCADE'
      });

      // One-to-Many with productImages
      this.hasMany(models.productImages, {
        foreignKey: 'productId',
        as: 'images'
      });

      // Many-to-Many with categories
      this.belongsToMany(models.categories, {
        through: 'productCategories',
        foreignKey: 'productId',
        as: 'categories',
        onDelete: 'CASCADE'
      });

      // One-to-Many with cartItems
      this.hasMany(models.cartItems, {
        foreignKey: 'productId',
        as: 'cartItems',
        onDelete: 'CASCADE'
      });

      // One-to-Many with orderItems
      this.hasMany(models.orderItems, {
        foreignKey: 'productId',
        as: 'orderItems',
        onDelete: 'SET NULL'
      });

      // One-to-Many with reviews
      this.hasMany(models.reviews, {
        foreignKey: 'productId',
        as: 'reviews',
        onDelete: 'CASCADE'
      });

      // One-to-Many with wishlists
      this.hasMany(models.wishlists, {
        foreignKey: 'productId',
        as: 'wishlists',
        onDelete: 'CASCADE'
      });
    }
  }

  products.init({
    slug: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    productName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00
    },
    originalPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00
    },
    stock: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    isBestSeller: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    },
    avgRating: {
      type: DataTypes.DECIMAL(3, 2),
      allowNull: false,
      defaultValue: 0.00
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'products',
    tableName: 'products',
  });

  return products;
};
