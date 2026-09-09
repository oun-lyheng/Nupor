'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class cart extends Model {
    static associate(models) {
      // Belongs to a Buyer (User)
      this.belongsTo(models.users, {
        foreignKey: 'buyerId',
        as: 'buyer',
        onDelete: 'CASCADE'
      });

      // Has many Cart Items
      this.hasMany(models.cartItems, {
        foreignKey: 'cartId',
        as: 'items',
        onDelete: 'CASCADE'
      });
    }
  }

  cart.init({
    buyerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true
    }
  }, {
    sequelize,
    modelName: 'cart',
    tableName: 'cart',
  });

  return cart;
};
