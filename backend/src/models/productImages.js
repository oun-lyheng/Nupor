'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class productImages extends Model {
    static associate(models) {
      // Many-to-One with products
      this.belongsTo(models.products, {
        foreignKey: 'productId',
        as : "products" ,
        onDelete: 'CASCADE'
      });
    }
  }

  productImages.init({
    productImageUrl: {
      type: DataTypes.STRING,
      allowNull: false
    },
    productPublicId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    position: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: {
        min: 1,
        max: 4
      }
    },
    productId: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'productImages',
    tableName: 'productImages',
  });

  return productImages;
};
