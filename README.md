# FashionSync 👗

🔗 **Live site:** [fashionsync-dc79f.web.app](https://fashionsync-dc79f.web.app)

**FashionSync is an information system for running an online fashion store. It provides a customer interface for browsing, buying and tracking orders, and a management interface for inventory, orders, deliveries, customers and system settings.**

## Table of Contents

- [Development Team](#development-team)
- [Project Goals](#project-goals)
- [The Problem It Solves](#the-problem-it-solves)
- [Key Features](#key-features)
- [AI Capabilities](#ai-capabilities)
- [Barcode Scanning](#barcode-scanning)
- [User Roles and Permissions](#user-roles-and-permissions)
- [System Architecture](#system-architecture)
- [Technologies](#technologies)
- [Languages and Accessibility](#languages-and-accessibility)
- [Security](#security)
- [Testing](#testing)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Local Installation and Development](#local-installation-and-development)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)
- [Working with Git](#working-with-git)
- [Further Documentation](#further-documentation)

## Development Team

- Radia Musa 212793954
- Tasnim Bakli 325488716

## Project Goals

- Real-time inventory management, including variants by colour and size
- Fewer manual errors in stock levels and order tracking
- One system for the whole sales, delivery and service process
- A better shopping experience through personal recommendations and a smart chatbot
- Automated customer communication (order confirmations, delivery updates, stock alerts)
- Management, tracking and reporting tools for the store manager

## The Problem It Solves

Small fashion stores that sell through social networks and scattered channels struggle to keep stock accurate in real time, to track orders, and to give customers a consistent, professional buying experience. FashionSync brings all of it into a single system: a live catalogue, order and delivery management, and automated customer communication — alongside a full management interface for the store manager.

## Key Features

### Customer Side
- Product catalogue with filtering and search, by product name or by product code (the value encoded in the product barcode)
- Two languages (Hebrew/English) and light/dark themes
- Shopping cart, checkout, order and delivery tracking
- Loyalty programme, coupons and gift cards
- Self-service return requests and order cancellation
- Wishlist
- "Notify me when back in stock" alerts

### Management Side
- Product and inventory management, including variants by colour and size
- Barcode scanning from the device camera, for adding and locating products
- Order, delivery and receipt tracking, including flagging orders that exceed the promised delivery time
- Handling return requests, contact messages and customer feedback
- Coupon management, policy settings, business hours and store details
- Reports and analytics driven by live data
- Automatic Hebrew-to-English translation of product names and descriptions on save

## AI Capabilities

FashionSync uses Google Gemini in several places. The common design principle across all of them is that **the model never invents catalogue data**: every answer is grounded in what actually exists in Firestore.

### SYNC — the chatbot

SYNC answers questions about products, prices, promotions and store policy (returns, cancellations, shipping, business hours, address) using the values configured in the system at that moment, not static replies.

The chatbot runs as a multi-stage pipeline rather than a single model call:

| Stage | What happens |
|---|---|
| **1. Intent detection** | The message and conversation history go to Gemini with a strict JSON schema. The result describes what the customer wants: category, gender, size, colour, price range, occasion, style and season |
| **2. Live data** | Business hours, policy and store details are read from Firestore |
| **3. Product search** | The catalogue is filtered by the hard constraints from the intent. Out-of-stock products are excluded, so the chatbot never recommends something that cannot be bought |
| **4. Relevance scoring** | Occasion, style and season are used to rank results. Scoring only reorders — it never rejects a product, so a search can never come back empty because of the occasion |
| **5. Answer** | The real search results are injected into the prompt with an explicit instruction not to invent products, prices or availability. The reply is streamed back to the browser |

The search also handles Hebrew word forms: a query is split into words that may appear in any order, and construct-state forms are matched against each other, so "שמלה ערב" finds "שמלת ערב אלגנטית".

### Outfit recommendation and visualization

When a customer asks for a complete look, the outfit planner picks a matching combination from the products found in the previous stage, and an image model generates a visualization of that outfit on a generic AI figure. If no suitable products are found, or image generation fails, the customer receives a clear message rather than an error.

### Virtual Try-On

A customer can upload a photo of herself and see a selected product rendered on her, using the Vertex AI Virtual Try-On model. This is separate from the outfit visualization: Try-On uses the customer's own photo, while the outfit visualization uses a generated figure.

### Models in use

| Purpose | Model |
|---|---|
| Intent detection, chat replies, outfit planning | `gemini-3-flash-preview` |
| Outfit visualization | `gemini-3.1-flash-image` |
| Try-On (single product on a customer photo) | `gemini-2.5-flash-image` |
| Virtual Try-On (Vertex AI) | `virtual-try-on-001` |

## Barcode Scanning

The management interface can read barcodes and QR codes directly from the device camera, using `@zxing/library`. It is available in two places: when adding a product, to fill in the product code automatically, and as a standalone scanner for locating an existing product.

The scanner supports switching between cameras on devices that have more than one. It was tested against real barcodes generated with the QRHyper app.

## User Roles and Permissions

**Customer**
- Registration and login, or guest browsing with limited permissions
- Catalogue browsing and search
- Purchasing, order tracking, returns and cancellations
- Wishlist, loyalty points, coupons and gift cards

**Manager**
- Product and inventory management
- Order and delivery management
- Return requests and customer enquiries
- Coupons and store settings
- Reports and analytics

## System Architecture

```
                    ┌──────────────────┐
                    │    Customer /    │
                    │     Manager      │
                    │  (React Web App) │
                    └────────┬─────────┘
                             │
                    ┌────────▼─────────┐
                    │     Firebase     │
                    │ Auth / Firestore │
                    │    / Storage     │
                    └────────┬─────────┘
                             │
                    ┌────────▼─────────┐
                    │  Cloud Functions │
                    │   (Node.js 22)   │
                    └───────┬─┬────────┘
                            │ │
                 ┌──────────┘ └──────────┐
                 ▼                       ▼
          ┌─────────────┐         ┌─────────────┐
          │  Gemini AI  │         │  Gmail API  │
          │ (Vertex AI) │         │   (email)   │
          └─────────────┘         └─────────────┘
```

The React frontend talks directly to Firebase Auth and Firestore for most operations, and to Cloud Functions for anything that needs server-side logic: sending email, calling the AI models, and generating images.

## Technologies

**Frontend:**
- React 19 + Vite 8
- SCSS Modules
- Firebase SDK (Auth, Firestore, Storage)
- `@zxing/library` for barcode scanning

**Backend:**
- Firebase Cloud Functions (Node.js 22)
- Google Gemini AI (chatbot, outfit planning, image generation)
- Vertex AI Virtual Try-On
- Gmail API (automated email)
- Secret Manager (API key storage)

**Database:** Cloud Firestore, real time, with no manual refresh needed

**Testing:** Vitest

## Languages and Accessibility

- Full Hebrew and English support, including dynamic switching between RTL and LTR layouts
- Light and dark themes
- Product cards are fully keyboard navigable (Tab to move, Enter/Space to activate, clear focus outline)
- Key dialogs (product details, cart) close with the Escape key
- Product names, colours and sizes are stored in both languages at purchase time, so an order always renders correctly in either language even if the catalogue changes later

## Security

Firestore Security Rules are role based:

- **Manager** — signs in with a fixed, authenticated Firebase account (not anonymous) and is identified by an exact email address. Only the manager can edit products, system settings and coupons.
- **Customer** — signs in with a real Firebase account (email and password) and can read or write only the data she owns (orders, cart, return requests), matched by email rather than by "signed in at all".
- Customers may update the stock field of a product during a purchase, but not its price, name or description.

### Manager credentials

**There are no passwords in the source code.** The management login screen takes a username and password from the form and passes them to Firebase Authentication for verification. The manager account's email address appears in the code as a constant — it is not a secret, since an email address on its own grants no access.

The login error message is deliberately generic ("incorrect username or password") and never hints which field was wrong.

### Collection-level hardening

Beyond the role split, the rules also restrict **which operations** and **which fields** are allowed:

- **Orders** — a customer may update four fields only (cancellation and pickup scheduling), and cannot change the total or the status. Deleting an order is manager only.
- **Gift cards and customers** — reading a single document (`get`) is separated from scanning the whole collection (`list`). A customer can validate a gift card code she holds, but cannot enumerate all cards or all customers.
- **Email verifications** — accessible only to the owner of the address.

**Note for future work:** price calculations and stock decrementing currently run on the client. The recommended next step is moving them into a cloud function, so the server validates the order total instead of trusting the browser.

## Testing

### Unit Tests
123 automated tests (Vitest) across five files, covering the most critical business logic:

| File | Tests | What it covers |
|---|---|---|
| `checkoutPricing.test.js` | 20 | Checkout maths — subtotal, discounts, shipping, total |
| `orderPolicy.test.js` | 15 | The 24-hour cancellation window and the 7-day return window |
| `stockPolicy.test.js` | 10 | Stock availability per product/variant (colour and size) |
| `itemDisplay.test.js` | 26 | Choosing an item's name, colour and size by interface language |
| `translationService.test.js` | 52 | The fashion term dictionary, translation fixes, and a guard on colour translation |

```bash
cd frontend
npm test
```

### Manual Testing
The core flows were tested by hand: registration and login, a full purchase (cart → payment → confirmation), order cancellation and return, order and inventory management on the manager side, and access permissions between manager and customer. Barcode scanning was tested against real barcodes generated with the QRHyper app.

### Build Verification
```bash
npm run build
```

## Project Structure

```
fashion-sync-react/
├── frontend/                 # React application (customer + management)
│   └── src/
│       ├── components/       # UI components (customer/, manager/, checkout/, home/, common/)
│       ├── pages/            # Pages (Customer, Manager, Checkout, Home)
│       ├── services/         # Direct Firestore access (the "database" layer)
│       ├── functions/        # Business logic by area, built on services/ (the "logic" layer)
│       ├── hooks/            # Shared React hooks (for example useEscapeKey)
│       ├── translations/     # Hebrew/English translations
│       └── styles/           # SCSS Modules
├── backend/                  # Firebase Cloud Functions
│   └── src/
│       ├── config/           # External connections (Firebase Admin, Gemini, Vertex AI)
│       ├── controllers/      # API entry points — receive a request, call a service
│       │   ├── chat/         # Chatbot
│       │   ├── email/        # 13 email types
│       │   └── tryOn/        # Virtual Try-On
│       └── services/         # Server logic, split the same way
│           ├── chat/         # Intent detection, orchestration, outfit planning, visualization
│           ├── email/        # Template building and sending through Gmail
│           └── tryOn/        # Vertex AI Virtual Try-On
└── scripts/                  # One-off maintenance scripts (outside the Vite build)
```

**An important distinction in the frontend:** `services/` performs direct database access — queries, reads and writes. `functions/` holds the business logic that builds on `services/` (for example `functions/customer/cart.js` calls `services/customer/cartFirestore.js`). This separation is what keeps the logic layer pure and testable, which is why the unit tests target `functions/`.

**Backend organisation:** `controllers/` and `services/` are split into the same three domains — `chat/`, `email/`, `tryOn/`. Each controller is a thin entry point that receives an HTTP request and calls the matching service in its domain.

## Prerequisites

- Node.js 22 or higher
- npm
- Firebase CLI (`npm install -g firebase-tools`)
- Java 11 or higher, only if you want to run the Firebase emulator

## Local Installation and Development

```bash
# Frontend
cd frontend
npm install
npm run dev

# Backend (when needed)
cd backend
npm install
```

### Working against the local emulator

By default the frontend calls the deployed cloud functions. To develop against a local Firebase emulator:

```bash
# First terminal — start the emulator
firebase emulators:start --only functions

# Second terminal — frontend in emulator mode
cd frontend
npm run dev:emulator
```

`npm run dev:emulator` runs Vite with `--mode emulator`, which loads `frontend/.env.emulator` and overrides the cloud URLs with `127.0.0.1:5001`. Plain `npm run dev` still points at the cloud, and `npm run build` is unaffected.

**Note:** if you run `dev:emulator` without the emulator running, the calls fail and the chat silently falls back to a local reply engine — the answers look reasonable but do not come from the server.

## Environment Variables

The project uses environment variables for the cloud function URLs (chat, Try-On, and 13 email types). Two files live in `frontend/`:

| File | Loaded when | Contents |
|---|---|---|
| `.env` | Always | Cloud URLs (`cloudfunctions.net`) |
| `.env.emulator` | Only with `npm run dev:emulator` | The same variables, pointing at `127.0.0.1:5001` |

Vite always loads `.env`, then loads `.env.<mode>` on top of it, overriding variables of the same name. Both files are covered by `.gitignore` and are not stored in Git.

**Never commit to GitHub:**
- API keys for external services
- Credentials and passwords
- Service account files

**Note:** the Firebase Web key (`apiKey` in `firebase.js`) is public by design and is not a secret — data is protected by Firestore Security Rules, not by hiding the key.

## Deployment

The project has three separately deployable parts:

```bash
# 1. Cloud functions — all of them, or a single function
cd backend
npx firebase-tools deploy --only functions
npx firebase-tools deploy --only functions:<function name>

# 2. The site itself (Hosting) — after building
cd frontend
npm run build
cd ..
firebase deploy --only hosting

# 3. Firestore security rules
firebase deploy --only firestore:rules
```

**Important:** a change to `firestore.rules` has no effect on production until step 3 is run. Test new rules in the Rules Playground in the Firebase console before deploying.

## Working with Git

The project is managed with Git — a version control system that keeps the history of every change and allows work on separate features in branches, without touching the stable version.

### Core concepts

| Concept | Meaning |
|---|---|
| **Repository (repo)** | The whole project folder, with its full stored history |
| **Commit** | A saved snapshot of the code, with a message explaining what changed |
| **Branch** | A separate line of work — lets you build a feature without touching the main version |
| **Push** | Uploading saved commits to the remote server (GitHub) |
| **Pull** | Downloading the latest changes from the remote server to your machine |

### Useful commands

**Create a new branch and switch to it:**
```bash
git checkout -b feature/feature-name
```

**See which files changed:**
```bash
git status
```

**Save your changes:**
```bash
git add .
git commit -m "Short, clear description of what changed"
```

**Push the branch to the remote repository:**
```bash
git push origin feature/feature-name
```

**Switch between existing branches:**
```bash
git checkout branch-name
```

**Pull updates from the remote repository:**
```bash
git pull
```

**Delete a local branch you no longer need:**
```bash
git branch -D branch-name
```

### Recommended workflow

1. Before starting a new feature or fix, create a **new branch** (`git checkout -b ...`) rather than working directly on the main branch.
2. After each meaningful change, check that the project still **builds** (`npm run build`) before committing.
3. Commit with a **clear message** describing exactly what was fixed or added.
4. Push the branch to the remote repository at the end of each work session.

## Further Documentation

- [`USER_GUIDE.md`](./USER_GUIDE.md) — full usage guide for both the customer and the manager
