'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class user_profiles extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // 1-to-1 association with users
      this.belongsTo(models.users, {
        foreignKey: 'userId',
        as: 'user',
        onDelete: 'CASCADE'
      });
    }
  }
  user_profiles.init({
    profile_url: {
      type: DataTypes.STRING,
      allowNull: true
    },
    profile_publicId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    commissionRate: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0.40,
      allowNull: false
    },
    accountName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    accountNumber: {
      type: DataTypes.STRING,
      allowNull: true
    },
    khqrUrl: {
      type: DataTypes.STRING,
      allowNull: true
    },
    khqrPublic_id: {
      type: DataTypes.STRING,
      allowNull: true
    },
    telegramUsername: {
      type: DataTypes.STRING,
      allowNull: true
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true
    }
  }, {
    sequelize,
    modelName: 'user_profiles',
    tableName: 'user_profiles',
  });
  return user_profiles;
};
