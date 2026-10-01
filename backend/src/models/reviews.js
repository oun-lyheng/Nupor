'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class reviews extends Model {
    static associate(models) {
      // Belongs to user
      this.belongsTo(models.users, {
        foreignKey: 'userId',
        as: 'user',
        onDelete: 'CASCADE'
      });

      // Belongs to product
      this.belongsTo(models.products, {
        foreignKey: 'productId',
        as: 'product',
        onDelete: 'CASCADE'
      });
    }
  }

  reviews.init({
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    productId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    rating: {
      type: DataTypes.DECIMAL(2, 1),
      allowNull: false,
      validate: {
        min: 1.0,
        max: 5.0
      }
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    isVerifiedPurchase: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'reviews',
    tableName: 'reviews',
  });

  return reviews;
};
