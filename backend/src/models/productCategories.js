'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class productCategories extends Model {
    static associate(models) {
      // Junction tables can have direct belongsTo associations if queried directly
      this.belongsTo(models.categories, { foreignKey: 'categoryId' });
      this.belongsTo(models.products, { foreignKey: 'productId' });
    }
  }

  productCategories.init({
    categoryId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    productId: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'productCategories',
    tableName: 'productCategories',
  });

  return productCategories;
};
