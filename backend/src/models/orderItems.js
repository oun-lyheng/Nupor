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
