# Product Variants Architecture (Color, Size, Storage, etc.)

This document specifies the technical design, database schema, and API contracts for **Product Variants** in **Nupor (នព្វ) Marketplace**.

---

## 1. Overview
Products on Nupor can be either **Simple Products** (single price and single inventory stock) or **Variable Products** (multiple combinations such as Color, Size, Storage, RAM, etc., with dedicated stock, pricing, SKU, and photos).

### Key Business Logic
1. **Total Stock Synchronization**: When a product has variants, the parent product's `stock` automatically equals the sum of all active variant stocks.
2. **Dedicated Pricing**: Each variant can have its own `price` and `originalPrice` (e.g. 128GB is $1,199, 256GB is $1,299).
3. **Cart Integration**: Buyers can add different variants of the same product into their cart as distinct line items. Subtotals are dynamically calculated using the variant price.
4. **Atomic Checkout & Stock Deduction**: At checkout, inventory is atomically deducted from both `product_variants.stock` and `products.stock`.
5. **Historical Snapshotting**: The variant's title (e.g. `"Natural Titanium / 256GB"`) is permanently snapshotted in `orderItems.variantName` and reflected in Telegram receipts.

---

## 2. Database Schema

### Table: `product_variants`
```sql
Table product_variants {
  id int [pk, increment]
  productId int [ref: > products.id, not null]
  variantName varchar [not null]        // e.g. "Natural Titanium / 256GB"
  price decimal(10,2) [not null, default: 0.00]
  originalPrice decimal(10,2) [null]    // strikethrough comparison price
  stock int [not null, default: 0]
  sku varchar [null]                    // Stock Keeping Unit
  attributes jsonb [null]               // e.g. {"color": "Natural Titanium", "storage": "256GB"}
  imageUrl varchar [null]               // specific variant photo
  isActive boolean [not null, default: true]
  createdAt timestamp
  updatedAt timestamp

  Indexes {
    productId
  }
}
```

### Updates to Existing Tables
- **`cartItems`**:
  - `variantId`: `INTEGER`, nullable (references `product_variants.id`).
  - Unique index: `(cartId, productId, variantId)`.
- **`orderItems`**:
  - `variantId`: `INTEGER`, nullable (references `product_variants.id`, `ON DELETE SET NULL`).
  - `variantName`: `VARCHAR`, nullable (snapshot of the option name).

---

## 3. API Endpoints

### 3.1 Create Product with Variants
Sellers can create a product and its variants in a single API call.

- **Endpoint**: `POST /api/product`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
```json
{
  "productName": "iPhone 16 Pro",
  "description": "Latest aerospace titanium phone",
  "price": 1199.00,
  "categoryIds": [1],
  "variants": [
    {
      "variantName": "Natural Titanium / 256GB",
      "price": 1199.00,
      "originalPrice": 1299.00,
      "stock": 10,
      "sku": "IPH16P-TIT-256",
      "attributes": { "color": "Natural Titanium", "storage": "256GB" }
    },
    {
      "variantName": "Black Titanium / 512GB",
      "price": 1399.00,
      "originalPrice": 1499.00,
      "stock": 5,
      "sku": "IPH16P-BLK-512",
      "attributes": { "color": "Black Titanium", "storage": "512GB" }
    }
  ]
}
```

---

### 3.2 Individual Variant Management (Seller Only)

#### 1. Add Variant to Existing Product
- **Endpoint**: `POST /api/product/:id/variants`
- **Request Body**:
```json
{
  "variantName": "White Titanium / 1TB",
  "price": 1599.00,
  "stock": 4,
  "sku": "IPH16P-WHT-1TB",
  "attributes": { "color": "White Titanium", "storage": "1TB" }
}
```

#### 2. Update Variant
- **Endpoint**: `PUT /api/product/:id/variants/:variantId`
- **Request Body**:
```json
{
  "price": 1549.00,
  "stock": 6,
  "isActive": true
}
```

#### 3. Delete Variant
- **Endpoint**: `DELETE /api/product/:id/variants/:variantId`

---

### 3.3 Buyer View Product Details
- **Endpoint**: `GET /api/product/:id`
- **Response**: Returns product object including `variants`:
```json
{
  "id": 6,
  "productName": "iPhone 16 Pro",
  "price": "1199.00",
  "stock": 15,
  "variants": [
    {
      "id": 1,
      "variantName": "Natural Titanium / 256GB",
      "price": "1199.00",
      "stock": 10,
      "attributes": { "color": "Natural Titanium", "storage": "256GB" }
    },
    {
      "id": 2,
      "variantName": "Black Titanium / 512GB",
      "price": "1399.00",
      "stock": 5,
      "attributes": { "color": "Black Titanium", "storage": "512GB" }
    }
  ]
}
```

---

### 3.4 Add Variant to Cart
- **Endpoint**: `POST /api/cart/items`
- **Request Body**:
```json
{
  "productId": 6,
  "variantId": 2,
  "qty": 1
}
```
*Note: Subtotal is automatically computed using `$1399.00`.*
