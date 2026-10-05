# Seller Dashboard, Saved Addresses & Admin Moderation (Features 1 - 3)

This document provides complete technical specifications for the Seller Dashboard, Saved Addresses Book, and Admin Platform Management modules implemented in **Nupor (នព្វ) Marketplace**.

---

## 1. Feature 1: Seller Shop Dashboard & Analytics

**Base Path**: `/api/seller/dashboard`  
**Authorization**: `Bearer <token>` (`requireSeller` middleware: `isSeller: true` or `role: 'admin'`)

### 1.1 Overview Statistics
- **Endpoint**: `GET /api/seller/dashboard/overview`
- **Description**: Returns order counts by status, revenue metrics (earned vs pending), inventory alerts (low stock & out of stock), and store rating.
- **Response**:
```json
{
  "message": "Seller overview stats fetched successfully",
  "data": {
    "orders": {
      "total": 12,
      "pending": 2,
      "processing": 3,
      "completed": 6,
      "cancelled": 1
    },
    "revenue": {
      "total": 450.00,
      "pending": 120.00,
      "currency": "USD"
    },
    "inventory": {
      "totalProducts": 15,
      "lowStock": 2,
      "outOfStock": 1
    },
    "rating": {
      "avgRating": 4.85
    }
  }
}
```

### 1.2 Top Selling Products
- **Endpoint**: `GET /api/seller/dashboard/top-products?limit=5`
- **Description**: Aggregates sold items for this seller excluding cancelled orders, sorted by total quantity sold.
- **Query Params**: `limit` (default: 5)
- **Response**:
```json
{
  "message": "Top selling products fetched successfully",
  "data": [
    {
      "productId": 4,
      "productName": "Iphone 18 Pro Max",
      "productImage": "https://res.cloudinary.com/.../img.png",
      "totalSold": 24,
      "totalRevenue": 28800.00
    }
  ]
}
```

### 1.3 Recent Orders
- **Endpoint**: `GET /api/seller/dashboard/recent-orders?limit=10`
- **Description**: Retrieves recent customer orders placed with this seller, with buyer contact details, purchased items, and payment info.
- **Query Params**: `limit` (default: 10)

### 1.4 Daily Sales Chart
- **Endpoint**: `GET /api/seller/dashboard/sales-chart?days=7`
- **Description**: Generates day-by-day completed order counts and revenue trends for charts/graphs.
- **Query Params**: `days` (default: 7, e.g. 7, 14, 30)

---

## 2. Feature 2: Buyer Saved Shipping Addresses

**Base Path**: `/api/addresses`  
**Authorization**: `Bearer <token>` (Authenticated buyer)

Addresses are persisted in the `addresses` table and linked to `userId`.

### Address Rules:
1. **Automatic First Default**: The first address created by a user automatically defaults to `isDefault: true`.
2. **Single Default Guarantee**: When an address is marked or set as `isDefault: true`, all other addresses belonging to that user are automatically toggled to `isDefault: false`.
3. **Smart Deletion**: If a user deletes their default address and still has other addresses, the newest remaining address is automatically promoted to `isDefault: true`.

### 2.1 List Addresses
- **Endpoint**: `GET /api/addresses`
- **Response**:
```json
{
  "message": "Addresses fetched successfully",
  "data": [
    {
      "id": 1,
      "userId": 5,
      "label": "Home",
      "receiverName": "Bong Lyheng",
      "phoneNumber": "012345678",
      "streetAddress": "St 271, Sangkat Boeung Tumpun, Khan Mean Chey",
      "city": "Phnom Penh",
      "isDefault": true,
      "createdAt": "2026-10-01T12:00:00.000Z"
    }
  ]
}
```

### 2.2 Add Address
- **Endpoint**: `POST /api/addresses`
- **Payload**:
```json
{
  "label": "Work Office",
  "receiverName": "Bong Lyheng",
  "phoneNumber": "098765432",
  "streetAddress": "Exchange Square, Floor 8, Daun Penh",
  "city": "Phnom Penh",
  "isDefault": false
}
```

### 2.3 Update Address
- **Endpoint**: `PUT /api/addresses/:id`
- **Payload**: Partial or full fields (`label`, `receiverName`, `phoneNumber`, `streetAddress`, `city`, `isDefault`).

### 2.4 Set Default Address
- **Endpoint**: `PATCH /api/addresses/:id/default`
- **Response**:
```json
{
  "message": "Default address updated successfully",
  "data": { ... }
}
```

### 2.5 Delete Address
- **Endpoint**: `DELETE /api/addresses/:id`

---

## 3. Feature 3: Admin Management & Platform Moderation

**Base Path**: `/api/admin`  
**Authorization**: `Bearer <token>` (`requireAdmin` middleware: `role === 'admin'`)

### 3.1 Platform Overview & KPIs
- **Endpoint**: `GET /api/admin/overview`
- **Description**: Returns marketplace-wide metrics: user counts (sellers, buyers, blocked), product status counts, order pipeline counts, GMV (Gross Merchandise Volume in USD), and total review count.
- **Response**:
```json
{
  "message": "Platform overview fetched successfully",
  "data": {
    "users": {
      "total": 150,
      "sellers": 35,
      "buyers": 115,
      "blocked": 2
    },
    "products": {
      "total": 320,
      "active": 310,
      "inactive": 10
    },
    "orders": {
      "total": 850,
      "completed": 780,
      "pending": 25,
      "processing": 30,
      "cancelled": 15
    },
    "financials": {
      "gmv": 12850.00,
      "currency": "USD"
    },
    "reviews": {
      "total": 420
    }
  }
}
```

### 3.2 User List & Search
- **Endpoint**: `GET /api/admin/users`
- **Query Params**:
  - `search`: Filter by name, username, email, or phone number
  - `role`: Filter by `admin` or `user`
  - `isSeller`: Filter by `true` or `false`
  - `isBlocked`: Filter by `true` or `false`
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 10)

### 3.3 Block / Unblock User
- **Endpoint**: `PATCH /api/admin/users/:id/block`
- **Payload**:
```json
{
  "isBlocked": true
}
```
*Note: Admins cannot block their own account.*

### 3.4 Product Moderation List
- **Endpoint**: `GET /api/admin/products`
- **Query Params**:
  - `search`: Search product name or slug
  - `isActive`: Filter active vs hidden/banned listings (`true` / `false`)
  - `sellerId`: Filter listings of a specific seller
  - `page` & `limit`

### 3.5 Ban / Activate Product Listing
- **Endpoint**: `PATCH /api/admin/products/:id/status`
- **Payload**:
```json
{
  "isActive": false
}
```
*Setting `isActive: false` immediately hides the product from buyer searches and marketplace catalog.*

### 3.6 Platform Order Oversight
- **Endpoint**: `GET /api/admin/orders`
- **Query Params**:
  - `status`: `pending`, `payment_submitted`, `processing`, `completed`, `cancelled`
  - `search`: Search by order number, customer name, or phone
  - `page` & `limit`
