'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class cartItems extends Model {
    static associate(models) {
      // Belongs to Cart
      this.belongsTo(models.cart, {
        foreignKey: 'cartId',
        as: 'cart',
        onDelete: 'CASCADE'
      });

      // Belongs to Product
      this.belongsTo(models.products, {
        foreignKey: 'productId',
        as: 'product',
        onDelete: 'CASCADE'
      });

      // Belongs to Variant (optional)
      this.belongsTo(models.product_variants, {
        foreignKey: 'variantId',
        as: 'variant',
        onDelete: 'CASCADE'
      });
    }
  }

  cartItems.init({
    cartId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    productId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    variantId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    qty: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: {
        min: 1
      }
    }
  }, {
    sequelize,
    modelName: 'cartItems',
    tableName: 'cartItems',
    indexes: [
      {
        unique: true,
        fields: ['cartId', 'productId', 'variantId']
      }
    ]
  });

  return cartItems;
};
