# Nupor (នព្វ) Backend Context

## Project Overview
Nupor (នព្វ) is a Cambodian project marketplace named after the collection of the nine cosmic planetary forces, symbolizing structural balance, completeness, and cultural elegance. By default, every user is a buyer. A buyer can become a seller by agreeing to the terms and conditions in a modal. The platform uses a Virtual Wallet (Platform Ledger) model for payments.

## Tech Stack
- Runtime: Node.js (v22.16.0)
- Framework: Express.js
- ORM: Sequelize
- Database: PostgreSQL
- Authentication: JWT (Access Token: 15m, Refresh Token: 7d)
- Email: Nodemailer + Gmail App Password for OTP
- SMS: Plasgate REST API via native Node.js `fetch()` (fallback to console logs locally)

## Environment Variables
```env
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=Nupor Database
DB_HOST=127.0.0.1
DB_PORT=5432

JWT_SECRET=your_secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your_refresh_secret
JWT_REFRESH_EXPIRES_IN=7d
JWT_RESET_SECRET=your_reset_secret

EMAIL_USER=your_gmail
EMAIL_PASSWORD=your_app_password

PLASGATE_PRIVATE_KEY=your_private_key
PLASGATE_SECRET_KEY=your_secret_key
PLASGATE_SENDER_NAME=PlasGateUAT
```

## Project Structure
```
backend/
├── docs/
│   ├── CONTEXT.md
│   ├── Nupor.md
│   └── auth_flow.md
├── Agents/
│   ├── api-routes-builder.md
│   ├── service-expert.md
│   ├── test-automation-engineer.md
│   └── write-doc-expert.md
├── src/
│   ├── config/
│   │   └── db.js
│   ├── Features/
│   │   └── Auth/
│   │       ├── Auth.controller.js
│   │       ├── Auth.routes.js
│   │       └── Auth.service.js
│   ├── middlewares/
│   │   └── authenticate.js
│   ├── models/
│   │   ├── index.js
│   │   ├── users.js
│   │   ├── user_profiles.js
│   │   ├── refreshTokens.js
│   │   └── otp_codes.js
│   ├── utils/
│   │   ├── sendEmail.js
│   │   ├── sendSms.js
│   │   └── generateForUser.js
│   └── migrations/
└── server.js
```

---

## Database Tables (Focusing on Users & Auth First)

### Group 1 — Users & Auth

**users**
- `id` (PK, INTEGER)
- `fullName` (STRING, not null)
- `userName` (STRING, unique, not null)
- `email` (STRING, unique, nullable)
- `phoneNumber` (STRING, unique, nullable)
- `password` (STRING, not null)
- `gender` (ENUM: 'male', 'female', 'other')
- `isVerified` (BOOLEAN, default: false)
- `isActive` (BOOLEAN, default: true)
- `isBlocked` (BOOLEAN, default: false)
- `isSeller` (BOOLEAN, default: false)
- `role` (ENUM: 'admin', 'user', default: 'user')
- `createdAt` (DATE)
- `updatedAt` (DATE)

**refreshTokens**
- `id` (PK, INTEGER)
- `token` (STRING, unique, not null)
- `expires_at` (DATE, not null)
- `isRevoked` (BOOLEAN, default: false)
- `userId` (FK to users.id, not null)
- `createdAt` (DATE)
- `updatedAt` (DATE)

**user_profiles** — one-to-one with Users
- `id` (PK, INTEGER)
- `profile_url` (STRING, nullable)
- `profile_publicId` (STRING, nullable)
- `bio` (TEXT, nullable)
- `commissionRate` (DECIMAL(5,2), default: 0.40)
- `accountName` (STRING, nullable)
- `accountNumber` (STRING, nullable)
- `khqrUrl` (STRING, nullable)
- `khqrPublic_id` (STRING, nullable)
- `isVerified` (BOOLEAN, default: false)
- `userId` (FK to users.id, unique, not null)
- `createdAt` (DATE)
- `updatedAt` (DATE)

**otpCodes**
- `id` (PK, INTEGER)
- `code` (STRING, not null)
- `expireAt` (DATE, not null)
- `type` (ENUM: 'register', 'forgot_password', not null)
- `isUsed` (BOOLEAN, default: false)
- `userId` (FK to users.id, not null)
- `createdAt` (DATE)
- `updatedAt` (DATE)

### Group 2 — Categories & Products
**categories**: `id`, `name`, `slug`, `icon`, `createdAt`, `updatedAt`
**products**: `id`, `slug`, `productName`, `description`, `price`, `originalPrice`, `stock`, `isBestSeller`, `avgRating`, `isActive`, `userId` (FK to users.id), timestamps
**productImages**: `id`, `imageUrl`, `public_id`, `position` (1-4), `productId` (FK to products.id), timestamps
**productCategories**: `productId`, `categoryId`

### Group 3 — Cart
**cart**: `id`, `buyerId` (FK to users.id, unique), timestamps
**cartItems**: `id`, `cartId` (FK to cart.id), `productId` (FK to products.id), `qty`, timestamps. Unique constraint on `(cartId, productId)`.

### Group 4 — Orders & Direct Payments (Shopee Style)
> See full details in [CHECKOUT_AND_PAYMENT_FLOW.md](./CHECKOUT_AND_PAYMENT_FLOW.md)

**orders**: `id`, `buyerId` (FK to users.id), `sellerId` (FK to users.id), `orderNumber` (STRING, unique), `orderStatus` ('pending', 'payment_submitted', 'processing', 'completed', 'cancelled'), `totalAmount`, `shippingAddress`, `receiverName`, `phoneNumber`, timestamps
**orderItems**: `id`, `orderId` (FK to orders.id), `productId` (FK to products.id, nullable), `sellerId` (FK to users.id), `productName`, `productImage`, `unitPrice`, `qty`, `subTotal`, timestamps
**payments**: `id`, `orderId` (FK to orders.id), `amount`, `status` ('pending', 'payment_submitted', 'approved', 'rejected'), `paymentMethod` ('khqr', 'cod'), `receiptUrl`, `receiptPublicId`, `paidAt`, `remark`, timestamps

### Group 5 — Reviews, Wishlists & User Profiles
> See full details in [REVIEWS_WISHLISTS_AND_USERS.md](./REVIEWS_WISHLISTS_AND_USERS.md)

**reviews**: `id`, `userId` (FK to users.id), `productId` (FK to products.id), `rating` (DECIMAL(2,1)), `comment`, `isVerifiedPurchase`, timestamps. Unique constraint on `(userId, productId)`.
**wishlists**: `id`, `userId` (FK to users.id), `productId` (FK to products.id), timestamps. Unique constraint on `(userId, productId)`.
**user_profiles**: `id`, `userId` (FK to users.id, unique), `profile_url`, `profile_publicId`, `bio`, `accountName`, `accountNumber`, `khqrUrl`, `khqrPublic_id`, `isVerified`, `commissionRate`, timestamps.

---

## Auth Flow

### Registration Flow
1. **Register**: User submits registration form -> backend creates a record in `users` with `isVerified = false`. Generates a 4-digit OTP code -> sends OTP to the user's email or via Plasgate SMS.
2. **Verify OTP**: User submits the OTP -> backend checks validity and expiration. If correct:
   - Sets `isVerified = true` in the user's record.
   - Immediately generates an `accessToken` (15m life) and `refreshToken` (7d life).
   - Returns tokens to client so the user is logged in automatically.

### Login Flow
1. User provides email/phoneNumber and password.
2. Check user exists -> compare password -> check `isActive === true` -> check `isBlocked === false`.
3. If verified (`isVerified === true`), generate access token + refresh token.
4. Save refresh token in database and return tokens.

### Forgot & Reset Password Flow
1. **Request Reset**: User inputs registered email/phoneNumber -> generates and sends OTP (`type: 'forgot_password'`).
2. **Verify OTP**: User submits OTP -> backend verifies OTP -> if correct, generates a unique, short-lived JWT `resetToken` signed using `JWT_RESET_SECRET + user.password` as the secret (making it single-use) -> returns `resetToken` to client.
3. **Reset Password**: Client submits the `resetToken` along with `newPassword` -> backend validates `resetToken` signature using the user's current password hash -> if valid, hashes the new password, updates the user's credentials, and destroys all active `refreshTokens` for the user.

### Change Password Flow (Authenticated)
1. User submits `currentPassword` and `newPassword`.
2. Backend checks `currentPassword` against stored hashed password.
3. If matched, updates password to new hashed value and marks all active refresh tokens for the user as revoked (`isRevoked = true`).

### Account Withdrawal / Deactivation (Authenticated)
1. User accepts the terms and conditions warning modal.
2. User submits withdrawal request.
3. Backend marks `isActive = false` (soft delete) and deactivates any active listings owned by this seller.

---

## Key Business & Coding Rules

### Error Handling
Errors are thrown using `throwError("Message details", statusCode)` and handled by global handlers.

### Success Response Format
Standard JSON responses are returned from the controllers directly (e.g. `{ result: ... }`).

### Token Handling
- Access Token lifespan: 15 minutes.
- Refresh Token lifespan: 7 days.
- Refresh tokens are rotation-ready and validated against the database.