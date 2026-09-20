'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class payments extends Model {
    static associate(models) {
      // Belongs to order
      this.belongsTo(models.orders, {
        foreignKey: 'orderId',
        as: 'order',
        onDelete: 'CASCADE'
      });
    }
  }

  payments.init({
    orderId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'pending'
    },
    transactionId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    paymentMethod: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'cod'
    },
    remark: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    receiptUrl: {
      type: DataTypes.STRING,
      allowNull: true
    },
    receiptPublicId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    paidAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'payments',
    tableName: 'payments',
  });

  return payments;
};
