'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class users extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this m
     * ethod automatically.
     */
    static associate(models) {
      // One-to-One with UserProfile
      this.hasOne(models.user_profiles, {
        foreignKey: 'userId',
        as: 'profile'
      });
      // One-to-Many with OtpCodes
      this.hasMany(models.otpCodes, {
        foreignKey: 'userId',
        as: 'otpCodes'
      });
      // One-to-Many with refreshTokens
      this.hasMany(models.refreshTokens, {
        foreignKey: 'userId',
        as: 'refreshTokens'
      });
      // One-to-Many with products (Seller listings)
      this.hasMany(models.products, {
        foreignKey: 'userId',
        as: 'products'
      });
      // One-to-One with Cart
      this.hasOne(models.cart, {
        foreignKey: 'buyerId',
        as: 'cart',
        onDelete: 'CASCADE'
      });
      // One-to-Many with Orders (as buyer)
      this.hasMany(models.orders, {
        foreignKey: 'buyerId',
        as: 'orders',
        onDelete: 'RESTRICT'
      });
      // One-to-Many with OrderItems (as seller)
      this.hasMany(models.orderItems, {
        foreignKey: 'sellerId',
        as: 'soldItems',
        onDelete: 'RESTRICT'
      });
      // One-to-Many with Orders (as seller)
      this.hasMany(models.orders, {
        foreignKey: 'sellerId',
        as: 'sellerOrders',
        onDelete: 'RESTRICT'
      });
      // One-to-Many with reviews
      this.hasMany(models.reviews, {
        foreignKey: 'userId',
        as: 'reviews',
        onDelete: 'CASCADE'
      });
      // One-to-Many with wishlists
      this.hasMany(models.wishlists, {
        foreignKey: 'userId',
        as: 'wishlists',
        onDelete: 'CASCADE'
      });
    }
  }
  users.init({
    fullName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    userName: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true
    },
    phoneNumber: {
      type: DataTypes.STRING,
      allowNull: true
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    gender: {
      type: DataTypes.ENUM('male', 'female', 'other')
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    isBlocked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    isSeller: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    role: {
      type: DataTypes.ENUM('admin', 'user'),
      defaultValue: 'user'
    }
  }, {
    sequelize,
    modelName: 'users',
    tableName: 'users',
  });
  return users;
};