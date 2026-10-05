'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class addresses extends Model {
    static associate(models) {
      this.belongsTo(models.users, {
        foreignKey: 'userId',
        as: 'user',
        onDelete: 'CASCADE'
      });
    }
  }

  addresses.init({
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    label: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'Home'
    },
    receiverName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    phoneNumber: {
      type: DataTypes.STRING,
      allowNull: false
    },
    streetAddress: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    city: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'Phnom Penh'
    },
    isDefault: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    }
  }, {
    sequelize,
    modelName: 'addresses',
    tableName: 'addresses',
    timestamps: true
  });

  return addresses;
};
