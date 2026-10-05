'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class productVariants extends Model {
    static associate(models) {
      // Belongs to product
      this.belongsTo(models.products, {
        foreignKey: 'productId',
        as: 'product',
        onDelete: 'CASCADE',
      });

      // One-to-many with cartItems
      this.hasMany(models.cartItems, {
        foreignKey: 'variantId',
        as: 'cartItems',
        onDelete: 'CASCADE',
      });

      // One-to-many with orderItems
      this.hasMany(models.orderItems, {
        foreignKey: 'variantId',
        as: 'orderItems',
        onDelete: 'SET NULL',
      });
    }
  }

  productVariants.init(
    {
      productId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      variantName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00,
      },
      originalPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      stock: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      sku: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      attributes: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      imageUrl: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    },
    {
      sequelize,
      modelName: 'product_variants',
      tableName: 'product_variants',
      timestamps: true,
    }
  );

  return productVariants;
};
