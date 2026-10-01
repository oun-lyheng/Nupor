'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class wishlists extends Model {
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

  wishlists.init({
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    productId: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'wishlists',
    tableName: 'wishlists',
  });

  return wishlists;
};
