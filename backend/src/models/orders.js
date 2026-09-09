'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class orders extends Model {
    static associate(models) {
      // Belongs-to buyer (users)
      this.belongsTo(models.users, {
        foreignKey: 'buyerId',
        as: 'buyer',
        onDelete: 'RESTRICT'
      });

      // One-to-many with orderItems
      this.hasMany(models.orderItems, {
        foreignKey: 'orderId',
        as: 'items',
        onDelete: 'CASCADE'
      });

      // One-to-one with payments
      this.hasOne(models.payments, {
        foreignKey: 'orderId',
        as: 'payment',
        onDelete: 'CASCADE'
      });
    }
  }

  orders.init({
    buyerId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    orderNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    orderStatus: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'pending'
    },
    totalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00
    },
    shippingAddress: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    receiverName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    phoneNumber: {
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'orders',
    tableName: 'orders',
  });

  return orders;
};
