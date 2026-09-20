'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Add sellerId to orders
    await queryInterface.addColumn('orders', 'sellerId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT'
    });

    // Populate sellerId for any existing orders from orderItems if available
    await queryInterface.sequelize.query(`
      UPDATE "orders" o
      SET "sellerId" = oi."sellerId"
      FROM "orderItems" oi
      WHERE o.id = oi."orderId" AND o."sellerId" IS NULL
    `);

    await queryInterface.addIndex('orders', ['sellerId']);

    // 2. Add receiptUrl and receiptPublicId to payments
    await queryInterface.addColumn('payments', 'receiptUrl', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('payments', 'receiptPublicId', {
      type: Sequelize.STRING,
      allowNull: true
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('payments', 'receiptPublicId');
    await queryInterface.removeColumn('payments', 'receiptUrl');
    await queryInterface.removeIndex('orders', ['sellerId']);
    await queryInterface.removeColumn('orders', 'sellerId');
  }
};
