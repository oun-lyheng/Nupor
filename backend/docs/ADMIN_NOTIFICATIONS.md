# 🔔 In-App Admin Notifications Documentation

## Overview
The In-App Admin Notification system gives platform administrators immediate, actionable visibility into critical events occurring across the Nupor Marketplace without relying on third-party messaging services.

---

## Implemented Triggers

### 1. ⭐ 1-Star Review / Negative Customer Feedback
- **Type**: `low_rating_review`
- **Condition**: A customer submits or updates a product review with `rating <= 1.0`.
- **Title**: `⭐ 1-Star Review Alert!`
- **Message format**:
  ```text
  Customer left a 1.0 rating on 'AirPods Pro 2': 'Item is fake, not original'. Seller: TechStore.
  ```
- **Payload (`data` JSONB)**:
  ```json
  {
    "reviewId": 45,
    "productId": 12,
    "productName": "AirPods Pro 2",
    "rating": 1.0,
    "comment": "Item is fake, not original",
    "sellerId": 3,
    "sellerName": "TechStore",
    "buyerId": 14
  }
  ```
- **Why it matters**: Admin can immediately investigate if the seller is selling counterfeit or defective goods and ban the product or suspend the seller if necessary.

---

### 2. 📦 New Product Listing for Moderation
- **Type**: `new_product_listing`
- **Condition**: A seller publishes a new product to the catalog.
- **Title**: `📦 New Product Listed`
- **Message format**:
  ```text
  📦 New Product Listed: 'iPhone 16 Pro Special Edition' ($1199.00) added by seller Bong Lyheng.
  ```
- **Payload (`data` JSONB)**:
  ```json
  {
    "productId": 28,
    "productName": "iPhone 16 Pro Special Edition",
    "price": "1199.00",
    "sellerId": 3,
    "sellerName": "Bong Lyheng"
  }
  ```
- **Why it matters**: Gives admin direct data to review photos, check pricing accuracy, and ensure no illegal or restricted items are published.

---

## Database Schema (`admin_notifications`)

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `id` | INTEGER | No | AUTO_INCREMENT | Primary Key |
| `type` | VARCHAR(100) | No | - | Notification category (e.g., `low_rating_review`, `new_product_listing`) |
| `title` | VARCHAR(255) | No | - | Short alert title with emoji |
| `message` | TEXT | No | - | Formatted human-readable alert message |
| `data` | JSONB | Yes | NULL | Structured context metadata |
| `isRead` | BOOLEAN | No | `false` | Read status |
| `readAt` | TIMESTAMP WITH TIME ZONE | Yes | NULL | Timestamp when marked as read |
| `createdAt` | TIMESTAMP WITH TIME ZONE | No | `NOW()` | Creation timestamp |
| `updatedAt` | TIMESTAMP WITH TIME ZONE | No | `NOW()` | Update timestamp |

**Indexes**:
- `admin_notifications_type_idx` on `type`
- `admin_notifications_is_read_idx` on `isRead`
- `admin_notifications_created_at_idx` on `createdAt DESC`

---

## Admin API Endpoints

All endpoints require authentication (`Bearer <token>`) with `role: "admin"`.

### 1. Get Notifications
- **Route**: `GET /api/admin/notifications`
- **Query Params**:
  - `page` (optional, default: `1`)
  - `limit` (optional, default: `10`, max: `100`)
  - `type` (optional, filter by type: `low_rating_review` | `new_product_listing`)
  - `isRead` (optional, filter by boolean: `true` | `false`)
- **Response**: `200 OK`
  ```json
  {
    "message": "Admin notifications fetched successfully",
    "data": {
      "notifications": [
        {
          "id": 1,
          "type": "low_rating_review",
          "title": "⭐ 1-Star Review Alert!",
          "message": "Customer left a 1.0 rating on 'AirPods Pro 2': 'Item is fake, not original'. Seller: TechStore.",
          "data": {
            "reviewId": 4,
            "productId": 10,
            "productName": "AirPods Pro 2",
            "rating": 1,
            "comment": "Item is fake, not original",
            "sellerId": 3,
            "sellerName": "TechStore",
            "buyerId": 4
          },
          "isRead": false,
          "readAt": null,
          "createdAt": "2026-10-04T12:22:44.209Z",
          "updatedAt": "2026-10-04T12:22:44.209Z"
        }
      ],
      "unreadCount": 1,
      "pagination": {
        "totalCount": 1,
        "totalPages": 1,
        "currentPage": 1,
        "limit": 10
      }
    }
  }
  ```

---

### 2. Mark Single Notification as Read
- **Route**: `PATCH /api/admin/notifications/:id/read`
- **Response**: `200 OK`
  ```json
  {
    "message": "Notification marked as read successfully",
    "data": {
      "id": 1,
      "isRead": true,
      "readAt": "2026-10-04T12:25:00.000Z"
    }
  }
  ```

---

### 3. Mark All Notifications as Read
- **Route**: `PATCH /api/admin/notifications/read-all`
- **Response**: `200 OK`
  ```json
  {
    "message": "All notifications marked as read successfully",
    "data": {
      "updatedCount": 4
    }
  }
  ```
