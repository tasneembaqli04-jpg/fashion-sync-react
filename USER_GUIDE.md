# User Guide — FashionSync

How to use FashionSync, as a customer and as the store manager. For architecture and setup, see [`README.md`](./README.md).

Every page has a language button (Hebrew/English) and a theme button (light/dark). Both choices are saved for your next visit, and switching to Hebrew also switches the layout to right-to-left.

## Table of Contents

- [Customer Journey](#customer-journey)
- [The SYNC Chatbot](#the-sync-chatbot)
- [Virtual Try-On](#virtual-try-on)
- [Manager Guide](#manager-guide)
- [Handling an Order](#handling-an-order)
- [Troubleshooting](#troubleshooting)

---

## Customer Journey

| Step | What you do |
|---|---|
| **Register** | Sign up with an email and password from the home page, then confirm the code emailed to you. Guests can browse the catalogue but cannot add to the cart or order |
| **Sign in later** | The same form signs you back in. "Forgot password?" emails a reset link to the address you registered with |
| **Browse** | Search by product name or product code, and filter by gender, category, season and price. Tab moves between products, Enter opens one, Escape closes it |
| **Save** | Tap the heart on a product to keep it in your wishlist. It is saved to your account, so it is still there on your next visit and on another device. Open it from "Wishlist", where you can add an item to the cart or remove it |
| **Add to cart** | Choose a colour and size, then add. Out-of-stock combinations cannot be added, but you can ask to be told when they return |
| **Wait for a restock** | Ask to be notified on a sold-out product, and when it returns you get an email and a banner at the top of the shop. The banner stays until you dismiss it with "Got it" |
| **Check out** | Delivery details are pre-filled from your account. Choose standard, express, same-day or store pickup, then a payment method. Standard delivery is free from ₪200, measured on the order total **before** any coupon or points discount. Paying by card in instalments splits the total so the instalments add up to it exactly, which can leave the final one a few agorot apart from the rest |
| **Rate the shop** | On the way to payment you are asked how the experience was. Rating is optional: the button carries on to checkout either way, and the ✕ takes you back to the cart if you would rather keep shopping |
| **Pay** | Apply a coupon, redeem loyalty points, or pay with a gift card. You earn one point per ₪1 spent, and 20 points are worth ₪1 off — so points return about 5% of what you spend |
| **Track** | Follow the order from "My Orders", newest first, with delivered orders at the bottom. Two selectors narrow the list to a month or a whole year. A confirmation email arrives on purchase |
| **Cancel** | Available on your own from "My Orders", within 24 hours of ordering and before it ships |
| **Return** | Available once the order shows "Delivered", within 7 days. Select the items and submit; after the manager approves, a credit is issued as a gift card with an `RTN-` code |
| **Get in touch** | The store policy page carries a contact form. If you are signed in, your email address is filled in for you. Your message reaches the manager, she is notified by email, and her reply arrives by email at the address on the message |

Gift cards and return credits are checked from the "Gift Card" page, using codes beginning with `GC-` or `RTN-`.

---

## The SYNC Chatbot

SYNC answers from the store's current settings. When the manager changes business hours or policy text, the next answer already reflects it.

| Ask about | Example |
|---|---|
| Product search | "Show me summer dresses under ₪300" |
| Stock | "Do you have this dress in M?" |
| Price | "How much is FS-001?" |
| Promotions | "What's on sale?" |
| Store policy | "What's your return policy?" |
| Business hours | "What time do you close today?" |
| Outfit advice | "I need a look for an evening wedding" |

Matching products appear as cards beneath the answer and can be added to the cart from there. **Only products currently in stock are recommended** — a sold-out item still appears in the catalogue but will not be suggested. When nothing matches, SYNC says so and offers to adjust the colour, size, category or budget.

Asking for a complete look produces a combination chosen from the catalogue, together with a picture of the outfit on an illustrated figure. If it is not clear who the outfit is for, SYNC asks whether it is for a woman or a man first. You can also change one part of an existing look — "swap the shoes", "show me another option" — and only that item is replaced.

---

## Virtual Try-On

Try-On renders a selected product on a photo of you.

1. Open a product from the catalogue
2. Choose Try-On
3. Upload a photo of yourself
4. Press "Run Try It On" and wait for the image

The result is a simulation for guidance, not a photograph of the product on you.

**Try-On uses your own photo. The chatbot's outfit picture uses an illustrated figure** and is meant to show how several items look together.

---

## Manager Guide

Sign in at the `/manager` address with the manager username and password.

If you have forgotten the password, "Forgot password?" on that screen emails a reset link to the manager account. There is nothing to type in: the address is already known, and the screen confirms when the link has been sent.

The management session lasts as long as the browser tab. Refreshing or moving between management screens keeps you signed in, but closing the browser ends the session, so the password is required again the next time you open it. Opening the management interface in a second tab counts as a new session and asks for the password. Customer sessions are separate and survive a browser restart.

| Screen | What it does |
|---|---|
| **Overview** | The shop at a glance: items in stock, sales, stock issues needing attention, and the active alerts |
| **Inventory** | Add and edit products, including variants by colour and size, images and prices. Name and description are translated to English automatically on save |
| **Alerts** | Out of stock, low stock and high demand, filtered by kind and by age. Alerts are kept for a week and follow the product's current status |
| **Orders** | All orders, searchable by order number or phone. Orders past the promised delivery time are flagged "⏰ Delayed" |
| **Deliveries** | Advance the status: Approved → In preparation → Shipped / Ready for pickup → Delivered / Collected |
| **Receipts** | Full breakdown of every transaction |
| **Returns** | Approve or reject return requests. Approving issues the credit automatically |
| **Enquiries** | Messages customers sent from the contact form on the policy page. Type a reply and it is emailed to the customer, then kept on the message so you can see what was answered. An enquiry sent without an address cannot be replied to, and says so. Answering marks it read |
| **Feedback** | Ratings and comments customers left on their way to payment |
| **Coupons** | Create and manage discount codes |
| **Gift cards** | Approve or reject gift card orders |
| **Stock alerts** | Customers waiting for a product to return |
| **Store settings** | Policy text, business hours, and store details. Changes reach the chatbot immediately |
| **Analytics** | Sales trends and performance, from live data. Revenue counts goods sold: delivery fees are not income, and a gift card counts when it is spent rather than when it is bought |

**Filtering by month** is available on every screen that lists records over time — orders, deliveries, receipts, gift cards, returns, stock alerts, enquiries and feedback. Two selectors, month and year: pick a year on its own to see the whole year, or clear the year to see everything. Each screen opens on the current month.

**Barcode scanning** is available when adding a product, where it fills in the product code, and as a standalone scanner for finding an existing product. It reads from the device camera and requires camera permission.

---

## Handling an Order

1. Open "Customer orders"
2. Select the order
3. Review the customer details and items
4. Approve or reject it
5. Move to "Delivery tracking"
6. Advance the status as the order progresses

Both decisions ask first, and the question says what will be sent: either way the customer is emailed, and approving an order that contains a gift card also activates the card. Neither decision can be undone from the management screens. A customer can cancel her own order within 24 hours of placing it.

If something does not go through, the screen says which part failed:

- **The decision was not saved.** The order goes back to waiting, so you can try again.
- **The decision was saved but the email did not send.** The order has been decided and only the customer has not heard, so it is worth getting in touch directly.
- **The decision was saved but the gift card was not updated.** Check the card on the "Gift cards" screen.

---

## Troubleshooting

### The verification code has not arrived

Check the spam folder first, which is where it usually is. The screen offers a fresh code after one minute, and prompts you to check spam after three.

A code is valid for **five minutes**. After that it stops working and you need a new one — the screen says the code expired rather than that it was wrong, so you can tell the two apart.

A new code does not cancel the previous one at once: the old code keeps working for one more minute, so if both emails arrive together, either will do. After that minute the older one is refused, and the screen says it was replaced rather than mistyped.

You can request **five codes per hour** for the same address. Beyond that the system stops sending until the hour is up. If you reach that point, the code you already have is almost certainly in the spam folder.

### The product I want is out of stock

A sold-out product stays visible in the catalogue but cannot be added to the cart, and the chatbot will not recommend it. If only some combinations are gone, choosing a different colour or size may be enough.

To be told when it returns, open the product and ask to be notified. You are told twice: by email, and by a banner at the top of the shop on your next visit. The alert is for the product as a whole, so it arrives when stock returns in any colour or size.

### The gift card code is not found

Check the prefix. Codes are of two kinds, and both are entered in the same field:

| Prefix | What it is |
|---|---|
| `GC-` | A gift card someone bought |
| `RTN-` | A credit issued after an approved return |

Two other reasons a valid-looking code is refused:

- **A newly bought card is not active yet.** A `GC-` card is created the moment it is paid for, but stays inactive until the manager approves the order it was bought in. A `RTN-` credit is different: it works as soon as the return is approved.
- **The balance is already spent.** A card can be spent across several orders, and each purchase deducts from what is left rather than voiding the card. A code that worked before may have nothing on it now. Check the balance on the "Gift Card" page before checking out.
