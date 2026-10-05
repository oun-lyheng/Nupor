'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class adminNotifications extends Model {
    static associate(models) {
      // Define associations here if needed
    }
  }

  adminNotifications.init(
    {
      type: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      data: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      isRead: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      readAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'admin_notifications',
      tableName: 'admin_notifications',
      timestamps: true,
    }
  );

  return adminNotifications;
};
