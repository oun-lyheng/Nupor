'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class orderItems extends Model {
    static associate(models) {
      // Belongs to order
      this.belongsTo(models.orders, {
        foreignKey: 'orderId',
        as: 'order',
        onDelete: 'CASCADE'
      });

      // Belongs to product (optional reference, retains snapshot if product deleted)
      this.belongsTo(models.products, {
        foreignKey: 'productId',
        as: 'product',
        onDelete: 'SET NULL'
      });

      // Belongs to seller (users)
      this.belongsTo(models.users, {
        foreignKey: 'sellerId',
        as: 'seller',
        onDelete: 'RESTRICT'
      });

      // Belongs to Variant (optional snapshot reference)
      this.belongsTo(models.product_variants, {
        foreignKey: 'variantId',
        as: 'variant',
        onDelete: 'SET NULL'
      });
    }
  }

  orderItems.init({
    orderId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    productId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    variantId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    variantName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    sellerId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    productName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    productImage: {
      type: DataTypes.STRING,
      allowNull: true
    },
    unitPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00
    },
    qty: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    subTotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00
    }
  }, {
    sequelize,
    modelName: 'orderItems',
    tableName: 'orderItems',
  });

  return orderItems;
};
