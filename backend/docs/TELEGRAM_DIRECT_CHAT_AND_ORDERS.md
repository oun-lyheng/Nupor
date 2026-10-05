# Telegram Direct Chat & Product Order Flow (Cambodian E-Commerce Model)

This document describes the Telegram direct chatting and order summary integration implemented for **Nupor (នព្វ) Marketplace**.

---

## 1. Overview & Real-World Flow
In Cambodia, online shopping is conversational. Buyers order products, contact sellers directly on Telegram, discuss specifics (color, size, delivery via Virak Buntham/Grab/J&T), and exchange KHQR payment confirmations.

This feature enables:
1. **Sellers** to register their Telegram username (`@username` or `username`).
2. **Buyers** to chat directly with sellers before and after checkout.
3. **One-Tap Pre-Filled Telegram Links**: When an order is placed, Nupor automatically generates a deep-link `https://t.me/<seller>?text=<encoded_summary>` that opens Telegram with the entire itemized product receipt already typed into the message box!
4. **Instant Push Notifications**: Since it operates on native Telegram 1-on-1 chats, both parties receive native Telegram alerts (sound, banners, vibrations) without requiring third-party bot permissions.

---

## 2. Database Changes
- **Table**: `user_profiles`
- **New Column**:
  - `telegramUsername`: `VARCHAR`, nullable (stores sanitized username without `@` or URL prefixes).

---

## 3. Endpoints & Payload Contracts

### 3.1 Seller Profile & Payment Setup
Sellers can save their Telegram username either via profile update or payment information setup.

- **Endpoints**:
  - `PATCH /api/users/profile`
  - `PATCH /api/users/seller/payment-info`
- **Request Body**:
  ```json
  {
    "accountName": "OUN LYHENG",
    "accountNumber": "0011223344",
    "telegramUsername": "@oun_lyheng"
  }
  ```
  *(Note: Leading `@` and `https://t.me/` are automatically sanitized to `oun_lyheng`)*.

---

### 3.2 Product Details Pre-Purchase Inquiries
When buyers view a product, the backend supplies the seller's Telegram username and an inquiry deep link.

- **Endpoint**: `GET /api/products/:id`
- **Response**:
  ```json
  {
    "message": "Get product details successfully!",
    "data": {
      "id": 1,
      "productName": "iPhone 16 Pro Max",
      "price": "1200.00",
      "seller": {
        "id": 3,
        "fullName": "Bong Lyheng",
        "userName": "bong_lyheng2",
        "profile": {
          "telegramUsername": "oun_lyheng"
        }
      },
      "sellerTelegram": {
        "username": "oun_lyheng",
        "inquiryUrl": "https://t.me/oun_lyheng?text=Hello!%20I%20saw%20your%20product%20%22iPhone%2016%20Pro%20Max%22%20(%241200.00)%20on%20Nupor%20Marketplace.%20Is%20it%20still%20available%3F"
      }
    }
  }
  ```

---

### 3.3 Checkout & Order Details
When an order is placed (`POST /api/orders/checkout`) or retrieved (`GET /api/orders/:id`), the backend returns the `telegramChat` object.

- **Response Attributes**:
  - `sellerTelegramUsername`: e.g. `"oun_lyheng"`
  - `orderSummaryText`: Clean, formatted Markdown/plain-text receipt ready for a 1-click **"Copy Summary"** button.
  - `telegramChatUrl`: One-tap **"Chat with Seller on Telegram"** URL.

#### Sample JSON Response:
```json
{
  "message": "Order details retrieved successfully",
  "data": {
    "id": 10,
    "orderNumber": "ORD-20260909-HTBY",
    "orderStatus": "pending",
    "totalAmount": "3200.00",
    "shippingAddress": "Toul Kork, Phnom Penh",
    "receiverName": "Lyheng",
    "phoneNumber": "096123456",
    "items": [
      {
        "id": 1,
        "productName": "iPhone 16 Pro Max",
        "qty": 2,
        "unitPrice": "1600.00",
        "subTotal": "3200.00"
      }
    ],
    "telegramChat": {
      "sellerTelegramUsername": "oun_lyheng",
      "telegramChatUrl": "https://t.me/oun_lyheng?text=%F0%9F%9B%8D%EF%B8%8F%20*Nupor%20Order%20%23ORD-20260909-HTBY*...",
      "orderSummaryText": "🛍️ *Nupor Order #ORD-20260909-HTBY*\n━━━━━━━━━━━━━━━━━━━━\n📦 *Products Ordered:*\n  1. iPhone 16 Pro Max (x2) — $3200.00\n━━━━━━━━━━━━━━━━━━━━\n💰 *Total Amount:* $3200.00\n👤 *Buyer:* Lyheng\n📞 *Phone:* 096123456\n📍 *Deliver to:* Toul Kork, Phnom Penh\n━━━━━━━━━━━━━━━━━━━━\nHello! I just placed this order on Nupor Marketplace. Please confirm availability and delivery details. Thank you! 🙏"
    }
  }
}
```
