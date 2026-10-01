# Nupor Marketplace - Reviews, Wishlists, User Profile & Product Catalog

> **Documentation**: Details the business rules, endpoints, and data contracts for **Reviews & Ratings**, **Wishlists**, **User & Seller Profile Setup**, and **Advanced Product Search**.

---

## 1. Reviews & Ratings System

### Overview
- Every buyer can leave **1 review per product** (enforced by a composite unique index on `(userId, productId)`).
- **Verified Purchase**: The backend automatically checks if the buyer has a completed order (`orders.orderStatus = 'completed'`) containing this product and awards the `isVerifiedPurchase: true` badge.
- **Automatic Rating Calculation**: When a review is created, edited, or deleted, `products.avgRating` is automatically recalculated and updated in the database:
  $$\text{avgRating} = \frac{\sum \text{ratings}}{\text{total reviews}}$$

### Endpoints

#### `POST /api/products/:productId/reviews`
- **Auth**: Buyer
- **Body**:
  ```json
  {
    "rating": 4.5,
    "comment": "Fast delivery and great condition!"
  }
  ```
- **Response**: `201 Created` with created review and updated `productAvgRating`.

#### `GET /api/products/:productId/reviews`
- **Auth**: Public
- **Query Params**: `page=1`, `limit=10`
- **Response**:
  ```json
  {
    "message": "Reviews retrieved successfully",
    "data": {
      "summary": {
        "totalReviews": 15,
        "avgRating": 4.67,
        "starBreakdown": {
          "5": 10,
          "4": 3,
          "3": 2,
          "2": 0,
          "1": 0
        }
      },
      "reviews": [ ... ],
      "pagination": {
        "currentPage": 1,
        "totalPages": 2,
        "totalItems": 15,
        "limit": 10
      }
    }
  }
  ```

#### `PUT /api/reviews/:id`
- **Auth**: Review Author
- **Body**: `{ "rating": 5.0, "comment": "Updated comment" }`
- Recalculates `products.avgRating`.

#### `DELETE /api/reviews/:id`
- **Auth**: Review Author or Admin
- Deletes review and restores `products.avgRating` (or resets to `0.00` if no reviews remain).

---

## 2. Wishlists (Favorites) System

### Overview
- Stores a buyer's favorite products.
- Uses a unique composite index on `(userId, productId)` to prevent duplicate entries.

### Endpoints

#### `POST /api/wishlist/:productId/toggle`
- **Auth**: Buyer
- **Behavior**: 1-click heart toggle. If the product is already in the wishlist, it removes it (`inWishlist: false`). If not in the wishlist, it adds it (`inWishlist: true`).
- **Response**:
  ```json
  {
    "message": "Product added to wishlist",
    "data": {
      "productId": 4,
      "inWishlist": true
    }
  }
  ```

#### `GET /api/wishlist`
- **Auth**: Buyer
- **Query Params**: `page=1`, `limit=20`
- **Response**: Returns favorited products formatted with primary thumbnail image, current price, original price, stock, and average rating.

#### `DELETE /api/wishlist/:productId`
- **Auth**: Buyer
- Explicit removal of a product from the wishlist.

---

## 3. User & Seller Payment Profile Setup

### Overview
Allows regular users to manage their personal profile and allows sellers to set up their direct payment info (Bakong / ABA KHQR code and bank account details) needed for the Shopee-style checkout flow.

### Endpoints

#### `GET /api/users/profile`
- **Auth**: Logged-in User
- **Response**: Returns full user info (`fullName`, `userName`, `email`, `phoneNumber`, `gender`, `isSeller`, `role`) and associated `profile` (`profile_url`, `bio`, `accountName`, `accountNumber`, `khqrUrl`).

#### `PATCH /api/users/profile`
- **Auth**: Logged-in User
- **Content-Type**: `multipart/form-data`
- **Fields**:
  - `fullName` (optional)
  - `phoneNumber` (optional)
  - `gender` (optional)
  - `bio` (optional)
  - `profileImage` (optional image file — uploaded to Cloudinary folder `nupor/avatars`)

#### `PATCH /api/users/seller/payment-info`
- **Auth**: Logged-in User / Seller
- **Content-Type**: `multipart/form-data`
- **Fields**:
  - `accountName`: Bank account holder name (e.g. `"BONG LYHENG"`)
  - `accountNumber`: Bank account number (e.g. `"001 234 567"`)
  - `khqr`: KHQR code image file (uploaded to Cloudinary folder `nupor/seller_khqr`)
- **Note**: Calling this endpoint automatically activates `users.isSeller = true`.

#### `POST /api/users/become-seller`
- **Auth**: Logged-in User
- Flips `isSeller: true` when a user accepts the terms & conditions modal.

---

## 4. Advanced Product Search, Filter, Sort & Catalog

### Endpoint: `GET /api/products`
- **Auth**: Public

### Supported Query Parameters:
| Parameter | Type | Example | Description |
| :--- | :--- | :--- | :--- |
| `q` | string | `q=iphone` | Case-insensitive keyword search matching `productName` or `description` |
| `categoryId` | integer | `categoryId=2` | Filter by category ID |
| `categorySlug` | string | `categorySlug=smartphones` | Filter by category slug |
| `minPrice` | number | `minPrice=500` | Minimum price boundary |
| `maxPrice` | number | `maxPrice=1500` | Maximum price boundary |
| `minRating` | number | `minRating=4.0` | Minimum product rating (e.g. 4 stars and up) |
| `inStock` | boolean | `inStock=true` | Show only products with `stock > 0` |
| `sellerId` | integer | `sellerId=3` | Filter products belonging to a specific shop |
| `sortBy` | string | `sortBy=top_rated` | Sorting options (see below) |
| `page` | integer | `page=1` | Current page number (default: 1) |
| `limit` | integer | `limit=12` | Items per page (default: 12) |

### Sorting Options (`sortBy`):
- `newest` (default): `createdAt DESC`
- `price_asc`: Lowest price first
- `price_desc`: Highest price first
- `top_rated`: Highest average rating first (`avgRating DESC`)
- `best_seller`: Best-selling products first (`isBestSeller DESC`)

### Example Response:
```json
{
  "message": "Get all products successfully!",
  "data": {
    "totalItems": 48,
    "products": [ ... ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 4,
      "totalItems": 48,
      "limit": 12
    }
  }
}
```
