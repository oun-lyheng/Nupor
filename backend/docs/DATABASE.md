// ===========================
// Nupor (នព្វ) Database Diagram
// Compatible with dbdiagram.io
// ===========================

// ===========================
// Users table
// ===========================
Table users {
  id int [pk, increment]
  fullName varchar [not null]
  userName varchar [unique, not null]
  email varchar [unique, null]
  phoneNumber varchar [unique, null]
  password varchar [not null]
  gender enum('male', 'female', 'other')
  isVerified boolean [default: false]
  isActive boolean [default: true] // user active or deactivated
  isBlocked boolean [default: false]
  isSeller boolean [default: false]
  role enum('admin', 'user') [default: 'user']
  createdAt timestamp
  updatedAt timestamp
}

// ===========================
// User profiles table (1-to-1)
// ===========================
Table user_profiles {
  id int [pk, increment]
  profile_url varchar
  profile_publicId varchar
  bio text
  commissionRate decimal(5,2) [default: 0.40]
  accountName varchar
  accountNumber varchar
  khqrUrl varchar
  khqrPublic_id varchar
  isVerified boolean [default: false]
  userId int [ref: - users.id, unique, not null]
  createdAt timestamp
  updatedAt timestamp
}

// ===========================
// Otp codes table
// ===========================
Table otpCodes {
  id int [pk, increment]
  code varchar [not null]
  expireAt timestamp [not null]
  type enum('register', 'forgot_password') [not null]
  isUsed boolean [default: false]
  userId int [ref: > users.id, not null]
  createdAt timestamp
  updatedAt timestamp
}

// ===========================
// Refresh tokens table
// ===========================
Table refreshTokens {
  id int [pk, increment]
  token varchar [unique, not null]
  expires_at timestamp [not null]
  userId int [ref: > users.id, not null]
  createdAt timestamp
  updatedAt timestamp
}

// ===========================
// Categories Table
// ===========================
Table categories {
  id int [pk, increment]
  categoryName varchar(50) [not null]
  slug varchar [unique, not null]
  createdAt timestamp
  updatedAt timestamp
}

// ===========================
// Products table
// ===========================
Table products {
  id int [pk, increment]
  slug varchar [unique, not null]
  productName varchar [not null]
  description text
  price decimal(10,2) [not null, default: 0.00]
  originalPrice decimal(10,2) [not null, default: 0.00]
  stock int [not null, default: 0]
  isBestSeller boolean [default: false]
  avgRating decimal(3,2) [default: 0.00]
  isActive boolean [default: true]
  userId int [ref: > users.id, not null]
  createdAt timestamp
  updatedAt timestamp
}

// ===========================
// Product Images table (1 to 4 images per product)
// ===========================
Table productImages {
  id int [pk, increment]
  productImageUrl varchar [not null]
  productPublicId varchar
  position int [not null, default: 1] // 1 to 4, 1 is main thumbnail
  productId int [ref: > products.id, not null]
  createdAt timestamp
  updatedAt timestamp
}

// ===========================
// Product Categories junction table
// ===========================
Table productCategories {
  categoryId int [ref: > categories.id, not null]
  productId int [ref: > products.id, not null]

  Indexes {
    (categoryId, productId) [pk]
  }
}

// ===========================
// Cart table (1 cart per buyer)
// ===========================
Table cart {
  id int [pk, increment]
  buyerId int [ref: - users.id, unique, not null]
  createdAt timestamp
  updatedAt timestamp
}

// ===========================
// Cart Items table
// ===========================
Table cartItems {
  id int [pk, increment]
  cartId int [ref: > cart.id, not null]
  productId int [ref: > products.id, not null]
  qty int [not null, default: 1]
  createdAt timestamp
  updatedAt timestamp

  Indexes {
    (cartId, productId) [unique]
  }
}

// ===========================
// Orders table (1-Buyer-to-1-Seller Shopee Style)
// ===========================
Table orders {
  id int [pk, increment]
  buyerId int [ref: > users.id, not null]
  sellerId int [ref: > users.id, not null]
  orderNumber varchar [unique, not null] // e.g. ORD-1789820524466
  orderStatus varchar [default: 'pending'] // 'pending', 'payment_submitted', 'processing', 'completed', 'cancelled'
  totalAmount decimal(10,2) [not null, default: 0.00]
  shippingAddress text [not null]
  receiverName varchar [not null]
  phoneNumber varchar [not null]
  createdAt timestamp
  updatedAt timestamp
}

// ===========================
// Order Items table (Historical snapshots)
// ===========================
Table orderItems {
  id int [pk, increment]
  orderId int [ref: > orders.id, not null]
  productId int [ref: > products.id, null] // null on delete to preserve history
  sellerId int [ref: > users.id, not null]
  productName varchar [not null]           // historical snapshot
  productImage varchar                     // historical snapshot thumbnail
  unitPrice decimal(10,2) [not null]       // price at moment of purchase
  qty int [not null, default: 1]
  subTotal decimal(10,2) [not null]
  createdAt timestamp
  updatedAt timestamp
}

// ===========================
// Payments table (Direct QR & Receipt Verification)
// ===========================
Table payments {
  id int [pk, increment]
  orderId int [ref: - orders.id, not null]
  amount decimal(10,2) [not null]
  status varchar [default: 'pending'] // 'pending', 'payment_submitted', 'approved', 'rejected'
  transactionId varchar
  paymentMethod varchar [default: 'khqr'] // 'khqr', 'cod'
  receiptUrl varchar                     // Cloudinary payment receipt screenshot
  receiptPublicId varchar
  remark text
  paidAt timestamp
  createdAt timestamp
  updatedAt timestamp
}

// ===========================
// Reviews table
// ===========================
Table reviews {
  id int [pk, increment]
  userId int [ref: > users.id, not null]
  productId int [ref: > products.id, not null]
  rating decimal(2,1) [not null] // 1.0 to 5.0
  comment text
  isVerifiedPurchase boolean [default: false]
  createdAt timestamp
  updatedAt timestamp

  Indexes {
    (userId, productId) [unique] // Buyer can only leave 1 review per product
  }
}

// ===========================
// Wishlists table (Favorites)
// ===========================
Table wishlists {
  id int [pk, increment]
  userId int [ref: > users.id, not null]
  productId int [ref: > products.id, not null]
  createdAt timestamp
  updatedAt timestamp

  Indexes {
    (userId, productId) [unique] // Unique composite index
  }
}
