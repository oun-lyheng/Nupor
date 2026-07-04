# Nupor (នព្វ) Marketplace - Project Flow & Architecture

**Nupor (នព្វ)** is a project marketplace named after the collection of the nine cosmic planetary forces (Noppharat/Nopphakhrah), symbolizing structural balance, completeness, and cultural elegance.

This document describes the flow and backend database architecture for the Nupor Marketplace application.

## 1. User Roles & Account Flow

*   **Default State (Buyer)**: 
    *   Every registered user starts as a buyer by default.
    *   Buyers can browse products, manage their shopping cart, deposit virtual funds, and make purchases.
*   **Becoming a Seller**:
    *   A buyer can choose to become a seller.
    *   Clicking the "Become Seller" action triggers a modal presenting the Terms and Conditions.
    *   Upon agreeing to the terms, the user's role is updated to `seller` in the database.
    *   Sellers gain access to the Seller Dashboard where they can add, edit, and delete their product listings.

---

## 2. Multi-Seller Shopping Cart Flow

*   **Cart Contents**:
    *   A buyer's cart can hold multiple products from different sellers simultaneously.
*   **Checkout Grouping**:
    *   During checkout, the system aggregates the total price of all items in the cart.
    *   The backend processes the payment in a single checkout action, splitting and routing the respective earnings to each individual seller.

---

## 3. Platform Ledger / Escrow Model (Virtual Wallet)

To handle payments securely and easily without third-party integrations, the platform uses an internal ledger system:

### A. Database Structure
*   **`users.balance`**: A decimal/numeric field tracking each user's virtual funds.
*   **`transactions`**: A ledger table tracking all monetary transactions.
    *   `id` (Primary Key)
    *   `user_id` (Foreign Key to users)
    *   `amount` (Positive for credits/sales/deposits, negative for debits/purchases/withdrawals)
    *   `type` (e.g., `'deposit'`, `'purchase'`, `'sale'`, `'withdrawal'`)
    *   `reference_id` (Nullable Foreign Key to orders)
    *   `created_at` (Timestamp)

### B. The Checkout Transaction Flow (Backend)
All of the following steps must run inside a single **Database Transaction** to ensure data integrity:

1.  **Balance Check**: Verify if the buyer's `balance` is greater than or equal to the order's total price.
2.  **Deduct Buyer Funds**: Subtract the total price from the buyer's `balance`.
3.  **Distribute Seller Earnings**: For each item in the order:
    *   Decrement the product's stock quantity.
    *   Calculate the seller's share (e.g., item total price minus platform fee).
    *   Add the calculated share to the corresponding seller's `balance`.
    *   Log ledger entries in the `transactions` table:
        *   One debit entry for the buyer (`type: 'purchase'`).
        *   One credit entry for each seller (`type: 'sale'`).
4.  **Confirm Order**: Update the order status to `completed` and commit the transaction.
