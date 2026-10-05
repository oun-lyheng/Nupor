'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('addresses', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      label: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'Home'
      },
      receiverName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      phoneNumber: {
        type: Sequelize.STRING,
        allowNull: false
      },
      streetAddress: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      city: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'Phnom Penh'
      },
      isDefault: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    await queryInterface.addIndex('addresses', ['userId']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('addresses');
  }
};
