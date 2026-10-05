'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Create product_variants table
    await queryInterface.createTable('product_variants', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      productId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'products',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      variantName: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00,
      },
      originalPrice: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      },
      stock: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      sku: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      attributes: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      imageUrl: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });

    await queryInterface.addIndex('product_variants', ['productId']);

    // 2. Add variantId to cartItems
    await queryInterface.addColumn('cartItems', 'variantId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'product_variants',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });

    // Remove old unique index on (cartId, productId) if exists
    try {
      await queryInterface.removeIndex('cartItems', 'unique_cart_product');
    } catch (e) {
      console.log('Index unique_cart_product removal note:', e.message);
    }

    // Add new unique index on (cartId, productId, variantId)
    await queryInterface.addIndex('cartItems', ['cartId', 'productId', 'variantId'], {
      unique: true,
      name: 'unique_cart_product_variant',
    });

    // 3. Add variantId & variantName to orderItems
    await queryInterface.addColumn('orderItems', 'variantId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'product_variants',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });

    await queryInterface.addColumn('orderItems', 'variantName', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    // 1. Remove from orderItems
    await queryInterface.removeColumn('orderItems', 'variantName');
    await queryInterface.removeColumn('orderItems', 'variantId');

    // 2. Remove from cartItems
    try {
      await queryInterface.removeIndex('cartItems', 'unique_cart_product_variant');
    } catch (e) {}
    await queryInterface.removeColumn('cartItems', 'variantId');
    await queryInterface.addIndex('cartItems', ['cartId', 'productId'], {
      unique: true,
      name: 'unique_cart_product',
    });

    // 3. Drop product_variants
    await queryInterface.dropTable('product_variants');
  },
};
