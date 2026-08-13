# User Guide — FashionSync

## About This Guide

This guide explains how to use FashionSync, both as a customer and as the store manager, and walks through the main actions available in each interface.

## Table of Contents

- [Customer Guide](#customer-guide)
- [The SYNC Chatbot](#the-sync-chatbot)
- [Virtual Try-On](#virtual-try-on)
- [Placing an Order — Step by Step](#placing-an-order--step-by-step)
- [Requesting a Return — Step by Step](#requesting-a-return--step-by-step)
- [Manager Guide](#manager-guide)
- [Barcode Scanning](#barcode-scanning)
- [Handling an Order — Step by Step (Manager)](#handling-an-order--step-by-step-manager)
- [General Settings (Language and Theme)](#general-settings-language-and-theme)
- [Frequently Asked Questions](#frequently-asked-questions)

---

## Customer Guide

### Registration and Login
You start from the home page and can either register with an email and password, or browse as a guest. Note that as a guest you cannot add products to the cart or place an order — both require an account.

### Catalogue, Search and Filtering
On the catalogue page you can search for a product by name or by its product code — the same number encoded in the product's barcode — and filter by gender, category, season and price. The catalogue is fully keyboard navigable: Tab moves between products, Enter opens a product, and Escape closes the dialog.

### Wishlist
You can mark products you like and save them to a personal list for quick access later.

### Loyalty, Coupons and Gift Cards
The "Points and Coupons" page shows your accumulated points balance — one point for every ₪1 spent — along with the coupons available to you. The "Gift Card" page lets you check the balance of a gift card or a return credit (codes beginning with `GC-` and `RTN-`).

### Back-in-Stock Alerts
When a product is out of stock in the colour or size you want, you can sign up to be notified by email as soon as it becomes available again.

---

## The SYNC Chatbot

SYNC is a smart assistant available from the customer interface. It answers questions about products, prices, promotions, store policy (returns, cancellations, shipping), business hours and the store address.

**Its answers reflect the settings currently configured in the system.** When the manager changes business hours or policy text, the chatbot uses the new values immediately — there is no separate step to update it.

### What you can ask

| Type of question | Example |
|---|---|
| Product search | "Show me summer dresses under ₪300" |
| Stock check | "Do you have this dress in M?" |
| Price | "How much is FS-001?" |
| Promotions | "What's on sale?" |
| Store policy | "What's your return policy?" |
| Business hours | "What time do you close today?" |
| Outfit recommendation | "I need a look for an evening wedding" |

### Product recommendations

When your question is about products, matching items appear as cards beneath the answer, and you can add them to the cart directly from there.

**The chatbot only ever recommends products that are genuinely in stock.** If nothing matches, it says so and offers to adjust the colour, size, category or budget, rather than inventing a product.

### Outfit recommendations and visualization

You can ask for a complete look, for example "build me an outfit for a wedding". The assistant picks a matching combination from the catalogue and generates an image showing the outfit together on a generic AI-created figure.

If the request is for a full look and it is not clear who it is for, the assistant will ask whether the outfit is for a woman or a man before continuing.

You can also ask to change part of an existing look — "swap the shoes", "show me another option" — and only that item will be replaced.

### Chatting in English

The chatbot answers in the language of the interface. Switching the site to English switches the chatbot too.

---

## Virtual Try-On

Try-On lets you see a product on yourself before buying it.

1. Open a product from the catalogue
2. Choose Try-On
3. Upload a photo of yourself
4. Press the activation button and wait for the image to be generated

The generated image is a simulation for guidance only, and is not a photograph of the actual product on you.

**How is this different from the chatbot's outfit image?** Try-On uses **your own photo**. The chatbot's outfit visualization uses a generic figure created by the AI, and is intended to show how several items look together.

---

## Placing an Order — Step by Step

1. Choose a product from the catalogue
2. Choose a colour and size
3. Press "Add to cart"
4. Open the shopping cart
5. Continue to checkout
6. Fill in the delivery details (fields are pre-filled from your account)
7. Choose a delivery method — standard, express, same day, or store pickup
8. Choose a payment method
9. Confirm the order
10. You receive a confirmation email, and can follow the order from the "My Orders" page

---

## Requesting a Return — Step by Step

1. Go to the "My Orders" page
2. Choose the relevant order — it must be in "Delivered" status, within 7 days of delivery
3. Press "Return request"
4. Select the items to return
5. Submit the request
6. The manager reviews and approves or rejects it
7. Once approved, a credit is created automatically as a gift card with an `RTN-` code

**Cancelling an order** before it ships can be done on your own, directly from the "My Orders" page, within 24 hours of placing it.

---

## Manager Guide

### Signing In to the Management Interface
The management interface is at the `/manager` address. Sign in with the manager username and the password configured for the manager account in Firebase Authentication. The password is not stored anywhere in the site's code and must be typed at each login.

### Inventory Management
Add and edit products, including variants by colour and size, images and prices. The product name and description are translated into English automatically when you save.

### Orders
A list of all orders, searchable by order number or phone number. Orders that exceed the promised delivery time are automatically flagged with a "⏰ Delayed" tag.

### Deliveries
Update the order status along the delivery process: Approved → In preparation → Shipped / Ready for pickup → Delivered / Collected.

### Sales Receipts
A full breakdown of every transaction made in the store.

### Return Requests
Approve or reject return requests submitted by customers. Approving one creates the credit automatically.

### Enquiries and Feedback
Manage contact messages and customer feedback received through the policy page on the site.

### Coupons
Create and manage discount codes.

### Store Settings
Edit policy content (shipping, returns, cancellations, privacy), business hours, and store details (address, phone). Any change here takes effect on the chatbot **immediately**, with no further action needed.

### Reports and Analytics
View sales trends and performance figures based on live system data.

---

## Barcode Scanning

The management interface can read barcodes and QR codes directly from the device camera. It is available in two places:

- **When adding a product** — scanning fills in the product code automatically instead of typing it
- **As a standalone scanner** — for quickly locating an existing product in the catalogue

On devices with more than one camera you can switch between them from inside the scanner window. Scanning requires granting the browser camera permission.

---

## Handling an Order — Step by Step (Manager)

1. Sign in to the management interface
2. Open "Customer orders"
3. Select the relevant order
4. Review the customer details and the items
5. Approve the order, or reject it
6. Move to "Delivery tracking"
7. Update the delivery status according to the actual stage reached

---

## General Settings (Language and Theme)

Every page has a language button for switching between Hebrew and English, and a theme button for switching between light and dark mode. Both choices are saved automatically for your next visit.

Switching to Hebrew also switches the page layout to right-to-left, and back to left-to-right for English.

---

## Frequently Asked Questions

**Can I place an order without registering?**
No. Guest browsing lets you view the catalogue only. Adding to the cart and placing an order require a registered account.

**How do I cancel an order?**
From the "My Orders" page, within 24 hours of placing the order and before it has shipped.

**How do I request a return?**
From the "My Orders" page, up to 7 days after the order was actually delivered.

**How do I switch between Hebrew and English?**
Press the language button, available on every page of the site.

**Why is a particular product unavailable to order?**
Because there is no stock in the selected colour or size. You can sign up to be notified when it returns.

**I forgot my password — what now?**
The login page has a password reset option that sends a link to your registered email address.

**Why doesn't the chatbot show me a product I saw in the catalogue?**
The chatbot only recommends products that are currently in stock. A product that has sold out still appears in the catalogue, but will not be suggested by the assistant.

**Does the chatbot know about a change I just made in the settings?**
Yes. It reads business hours, policy and store details live, so a change made in the management interface applies to the very next question.

---

## Further Documentation

- [`README.md`](./README.md) — technical documentation: architecture, installation, deployment, and working with Git
