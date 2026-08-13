# FashionSync 👗

🔗 **Live site:** [fashionsync-dc79f.web.app](https://fashionsync-dc79f.web.app)

An information system for running an online fashion store: a customer interface for browsing and buying, and a management interface for inventory, orders, deliveries and settings.

Developed by Radyeh Moussa (212793954) and Tasnim Bakli (325488716).

For how to actually use the system, see [`USER_GUIDE.md`](./USER_GUIDE.md).

## Table of Contents

- [Purpose](#purpose)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Data Model](#data-model)
- [Project Structure](#project-structure)
- [Setup and Development](#setup-and-development)
- [Environment Variables](#environment-variables)
- [Testing](#testing)
- [Deployment](#deployment)
- [Security](#security)
- [Known Limitations and Roadmap](#known-limitations-and-roadmap)

## Purpose

Small fashion stores selling through social networks struggle to keep stock accurate, track orders, and give a consistent buying experience. FashionSync brings all of it into one system.

- Real-time inventory, including variants by colour and size
- One place for sales, delivery and customer service
- Automated customer email: order confirmation, delivery updates, stock alerts
- AI assistance grounded in the live catalogue, not in generic answers
- Management reporting from live data

## Architecture

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

The React frontend talks directly to Firebase Auth and Firestore for most operations, and to Cloud Functions for anything needing server-side logic: sending email, calling the AI models, and generating images. There are 17 cloud functions.

### AI pipeline

The chatbot is a multi-stage pipeline rather than a single model call. The design principle throughout is that **the model never invents catalogue data** — every answer is grounded in what Firestore actually holds.

| Stage | What happens | Where |
|---|---|---|
| 1. Intent detection | Message and history go to Gemini constrained by a JSON schema, returning category, gender, size, colour, price range, occasion, style, season | `chatIntentService.js` |
| 2. Live data | Business hours, policy and store details read from Firestore | `chatOrchestratorService.js` |
| 3. Product search | Catalogue filtered by the hard constraints. Out-of-stock products are excluded | `chatProductService.js` |
| 4. Relevance scoring | Occasion, style and season rank the results. Scoring only reorders — it never rejects, so a search cannot come back empty because of the occasion | `chatProductService.js` |
| 5. Answer | Real results injected into the prompt with an explicit instruction not to invent products, prices or availability. Reply is streamed | `chatOrchestratorService.js` |

Hebrew search splits the query into words that may appear in any order, and matches construct-state forms against each other, so `שמלה ערב` finds `שמלת ערב אלגנטית`.

| Model | Used for |
|---|---|
| `gemini-3-flash-preview` | Intent detection, chat replies, outfit planning |
| `gemini-3.1-flash-image` | Outfit visualization |
| `gemini-2.5-flash-image` | Try-On on a customer photo |
| `virtual-try-on-001` | Vertex AI Virtual Try-On |

## Technology Stack

| Layer | Choice |
|---|---|
| Frontend | React 19, Vite 8, SCSS Modules |
| Barcode | `@zxing/library`, reading from the device camera |
| Backend | Firebase Cloud Functions, Node.js 22 |
| AI | Google Gemini, Vertex AI Virtual Try-On |
| Email | Gmail API, with credentials in Secret Manager |
| Database | Cloud Firestore, real time |
| Auth | Firebase Authentication, email and password |
| Testing | Vitest |

The interface supports Hebrew and English with dynamic RTL/LTR switching, plus light and dark themes. Product cards are keyboard navigable and key dialogs close with Escape.

## Data Model

Firestore holds 15 collections. The four central ones:

| Collection | Document key | Key fields |
|---|---|---|
| `products` | product code (`FS-001`) | `name`, `nameEn`, `desc`, `descEn`, `cat`, `gender`, `season`, `price`, `cost`, `originalPrice`, `sale`, `stock`, `minStock`, `salesLastMonth`, `variants[]`, `img` |
| `orders` | auto-generated | `customerEmail`, `customer`, `items[]`, `subtotal`, `discountAmount`, `pointsRedeemed`, `total`, `status`, `statusLabel`, `shipping`, `payMethod`, `createdAt` |
| `customers` | email address | `firstName`, `lastName`, `name`, `nameEn`, `phone`, `street`, `city`, `zip`, `loyaltyPoints` |
| `giftCards` | card code (`GC-…`, `RTN-…`) | `amount`, `balance`, `buyerEmail`, `recipientName`, `message`, `status` |

The remaining eleven: `carts`, `wishlists`, `deliveries`, `coupons`, `couponUsage`, `returnRequests`, `stockNotifications`, `contactMessages`, `feedback`, `settings`, `emailVerifications`.

### Why the email address is the document key

`customers`, `carts`, `wishlists` and `emailVerifications` are keyed by the customer's email rather than by an auto-generated id. This is a deliberate choice that makes ownership checkable inside the security rules:

```
function isOwner(email) {
  return isSignedIn() && request.auth.token.email.lower() == email.lower();
}
```

The rule compares the document key against the email in the caller's auth token. Because the key *is* the email, a customer can only ever reach her own document — the check needs no lookup and no extra field. With an auto-generated id, the rule would have to read a field inside the document to decide access, which is both slower and easier to get wrong.

`orders` cannot use this pattern, since one customer has many orders. There the rules compare a `customerEmail` field instead, and the customer-side query filters on that same field so the query is allowed at all.

`variants[]` on a product is an array of `{ colorName, colorNameEn, sizes }`, where `sizes` maps a size label to its quantity. Total `stock` is the sum across all variants.

## Project Structure

```
fashion-sync-react/
├── frontend/                 # React application
│   └── src/
│       ├── components/       # UI (customer/, manager/, checkout/, home/, common/)
│       ├── pages/            # Customer, Manager, Checkout, Home
│       ├── services/         # Direct Firestore access — the "database" layer
│       ├── functions/        # Business logic built on services/ — the "logic" layer
│       ├── hooks/            # Shared React hooks
│       ├── translations/     # Hebrew/English strings
│       └── styles/           # SCSS Modules
├── backend/                  # Firebase Cloud Functions
│   └── src/
│       ├── config/           # Firebase Admin, Gemini, Vertex AI
│       ├── controllers/      # HTTP entry points — chat/, email/, tryOn/
│       └── services/         # Server logic, split the same three ways
└── scripts/                  # One-off maintenance scripts, outside the Vite build
```

**The frontend split matters:** `services/` performs database access; `functions/` holds the business logic that builds on it. Keeping the logic layer free of network calls is what makes it unit-testable, which is why all five test files target `functions/` and `services/translation`.

**The backend split mirrors itself:** `controllers/` and `services/` use the same three domains, and each controller is a thin entry point that calls the matching service.

## Setup and Development

Requires Node.js 22+, npm, and the Firebase CLI (`npm install -g firebase-tools`). Java 11+ is needed only to run the emulator.

```bash
cd frontend && npm install && npm run dev
cd backend  && npm install
```

### Against the local emulator

```bash
firebase emulators:start --only functions   # first terminal
cd frontend && npm run dev:emulator         # second terminal
```

`dev:emulator` runs Vite with `--mode emulator`, loading `.env.emulator` over `.env`. Plain `npm run dev` still targets the cloud, and `npm run build` is unaffected.

If the emulator is not running, the calls fail and the chat falls back to a local reply engine — the answers look reasonable but do not come from the server.

## Environment Variables

Two files in `frontend/`, both covered by `.gitignore`:

| File | Loaded when | Contents |
|---|---|---|
| `.env` | Always | Cloud function URLs (`cloudfunctions.net`) |
| `.env.emulator` | Only with `npm run dev:emulator` | The same variables pointing at `127.0.0.1:5001` |

Vite loads `.env` first, then `.env.<mode>` on top, overriding matching names.

Never commit API keys for external services, credentials, or service account files. The Firebase Web key in `firebase.js` is public by design and is not a secret — data is protected by security rules, not by hiding the key.

## Testing

123 tests across five files, covering the business logic that carries the most risk.

| File | Tests | Covers |
|---|---|---|
| `checkoutPricing.test.js` | 20 | Subtotal, discounts, shipping, total |
| `orderPolicy.test.js` | 15 | The 24-hour cancellation and 7-day return windows |
| `stockPolicy.test.js` | 10 | Availability per product and variant |
| `itemDisplay.test.js` | 26 | Item name, colour and size by interface language |
| `translationService.test.js` | 52 | Fashion term dictionary, translation fixes, colour translation guard |

```bash
cd frontend && npm test        # tests
cd frontend && npm run build   # build verification
```

Core flows were also tested manually: registration, a full purchase, cancellation and return, manager order and inventory handling, and permission boundaries between manager and customer. Barcode scanning was tested against real barcodes generated with QRHyper.

## Deployment

Three parts, deployed separately:

```bash
cd backend && npx firebase-tools deploy --only functions
cd frontend && npm run build && cd .. && firebase deploy --only hosting
firebase deploy --only firestore:rules
```

A change to `firestore.rules` has no effect until the third command runs. Test new rules in the Rules Playground in the Firebase console first.

## Security

Firestore Security Rules are role based.

| Role | Access |
|---|---|
| **Manager** | Identified by an exact email address on an authenticated Firebase account. Only role that can edit products, settings and coupons |
| **Customer** | Reads and writes only data she owns, matched by email rather than by "signed in at all" |
| **Guest** | Catalogue and store information only |

### Manager credentials

There are no passwords in the source code. The login screen takes a username and password from the form and passes them to Firebase Authentication. The manager account's email appears as a constant, which is not a secret — an email address on its own grants no access. The login error message is deliberately generic and never reveals which field was wrong.

### Field and operation limits

Beyond the role split, the rules restrict which operations and which fields each role may use:

| Collection | Restriction |
|---|---|
| `orders` | A customer may update four fields only — cancellation and pickup scheduling. Total and status are not writable. Deletion is manager only |
| `giftCards`, `customers` | Reading one document (`get`) is separated from scanning the collection (`list`), so a customer can validate her own gift card but cannot enumerate all cards or all customers |
| `emailVerifications` | Owner only |
| `products` | Customers may write `stock`, `variants` and `salesLastMonth` during a purchase, but not price, name or description |

Two rules are intentionally left open and marked as such in the file: gift card and customer writes still run in the browser during checkout, and tightening them without a server-side replacement would break the purchase flow.

## Known Limitations and Roadmap

These are known, measured, and scoped. Each was identified during a security and correctness review of the system, and each has a decided next step. They are listed here rather than left implicit because the decision to defer them was deliberate: the checkout flow works and is stable, and replacing it late in the project carried more risk than the gap itself.

| Limitation | Impact | Planned fix |
|---|---|---|
| **Pricing runs on the client** | The order total is calculated in the browser and written to Firestore. Rules validate ownership but cannot recompute a cart, so a modified total would be accepted | A `createOrder` cloud function that receives items and a coupon code, computes the total server-side, and writes the order itself. This is the single highest-value change remaining |
| **No transactions on shared counters** | Stock, loyalty points and gift card balances are read then written. Two concurrent operations on the same document can lose one update | `runTransaction` on the three write paths. Gift card redemption is the first candidate, being the smallest and the easiest to demonstrate |
| **Cloud functions are unauthenticated** | 16 of the 17 functions are declared with `cors: true` and none verify the caller, so the email and AI endpoints can be invoked directly | `verifyIdToken` on each controller, or Firebase App Check |
| **Coupon usage is recorded but not enforced** | `logCouponUsage` writes a usage document, but nothing reads it to block reuse, so one coupon can be redeemed repeatedly | Enforcement belongs server-side, since the rules correctly deny customers read access to other users' usage records |
| **Loyalty discount read from `localStorage`** | The redeemed amount is taken from browser storage and is not checked against the stored balance | Resolved by the same `createOrder` function, which would read the balance server-side |
| **No VAT handling** | Prices are stored and displayed inclusive, with no tax line in the receipt | A business decision rather than a defect. Adding a VAT breakdown requires deciding whether stored prices are gross or net first |
| **Single 1.65 MB bundle** | No code splitting, so first load ships the manager interface to customers too | Route-level `import()` splitting, starting with the manager routes |

Two further items are lower priority but recorded: email verification currently generates and checks its code in the browser, which Firebase's built-in `sendEmailVerification` would replace entirely; and the manager is identified by email rather than by a custom claim, which would make the role independent of the account address.

## Working with Git

Work on a branch per feature, never directly on `main`. Verify `npm run build` passes before committing. Commit with a message describing what changed, and open a pull request to merge.
