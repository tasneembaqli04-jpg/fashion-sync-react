# FashionSync 👗

[![CI](https://github.com/tasneembaqli04-jpg/fashion-sync-react/actions/workflows/ci.yml/badge.svg)](https://github.com/tasneembaqli04-jpg/fashion-sync-react/actions/workflows/ci.yml)

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

In numbers: 7 customer panels and 14 management screens, built from 57 React components, over 15 Firestore collections and 17 cloud functions.

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
          │  Gemini AI  │         │    Gmail    │
          │ (Vertex AI) │         │   (SMTP)    │
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
| Email | Nodemailer over Gmail SMTP, authenticated with an app password held in Secret Manager |
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
├── .github/workflows/        # CI — runs tests and build on push and pull request
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

319 tests across fourteen files, covering the business logic that carries the most risk.

| File | Tests | Covers |
|---|---|---|
| `translationService.test.js` | 52 | Fashion term dictionary, translation fixes, colour translation guard |
| `analytics.test.js` | 46 | Revenue recognition, profit, averages, slow movers |
| `verificationService.test.js` | 32 | Code lifetime, resend ceiling, superseded codes |
| `itemDisplay.test.js` | 26 | Item name, colour and size by interface language |
| `cart.test.js` | 24 | The per-variant quantity ceiling and cart mutations |
| `orderPolicy.test.js` | 23 | The 24-hour cancellation and 7-day return windows |
| `checkoutPricing.test.js` | 20 | Subtotal, discounts, shipping, total |
| `money.test.js` | 19 | Two-decimal rounding and the instalment split |
| `auth.test.js` | 18 | The identity cache: writing, clearing, guest mode |
| `stockPolicy.test.js` | 17 | Availability and stock status per product and variant |
| `giftCard.test.js` | 15 | Gift card purchase rules and refusal codes |
| `dates.test.js` | 9 | Resolving an order timestamp from its candidate fields |
| `productsService.test.js` | 9 | Stock decrement and the sales counter |
| `managerHelpers.test.js` | 9 | Stock alerts and the manager alert preferences |

```bash
cd frontend && npm test        # tests
cd frontend && npm run build   # build verification
```

### Continuous integration

The same two commands run automatically on every push to `main` and on every pull request, defined in `.github/workflows/ci.yml`. The workflow installs dependencies with `npm ci`, runs the test suite, and verifies that a production build succeeds. It performs no deployment.

Results appear in three places: the **Actions** tab of the repository, as a status check at the bottom of each pull request, and as the badge at the top of this file. A failing step stops the run and marks it red, with the full log available from the Actions tab.

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

There are no passwords in the source code. The login screen takes a username and password from the form and passes them to Firebase Authentication. The manager account's email appears as a constant, which is not a secret — an email address on its own grants no access.

### Sessions and identity

Firebase Auth is the single source of truth for who is signed in. A listener in `Customer.jsx` reacts to every change in the authentication state, and `localStorage` holds only a display cache — a name and an email address, so the interface can render before the listener resolves. When Firebase reports no user, the cache is cleared and the visitor is returned to the login screen; it can never show a signed-in customer whose Firestore requests would be denied. Guest mode is exempt, having no Firebase session by design.

The two roles are given different session lifetimes, and both are set explicitly rather than left to the Firebase default:

| Role | Persistence | Effect |
|---|---|---|
| **Manager** | `browserSessionPersistence` | The session lives in the tab. Closing the browser signs the manager out, so the password is required again on the next visit |
| **Customer** | `browserLocalPersistence` | The session survives a browser restart, so a returning customer is not asked to sign in on every visit |

Both settings are applied to the same shared authentication instance, which is why neither is left implicit. Persistence is a property of that instance, not of a single sign-in call: were the customer path to rely on the default, a customer signing in from the same tab after a manager login would silently inherit the narrower manager setting and be signed out when the browser closed. Stating both removes the ordering dependency.

### Field and operation limits

Beyond the role split, the rules restrict which operations and which fields each role may use:

| Collection | Restriction |
|---|---|
| `orders` | A customer may update `cancelled`, `cancelledAt`, `pickupDate` and `pickupTime` — nothing else. Total and status are not writable. Deletion is manager only |
| `giftCards`, `customers` | Reading one document (`get`) is separated from scanning the collection (`list`), so a customer can validate her own gift card but cannot enumerate all cards or all customers |
| `emailVerifications` | Owner only |
| `products` | Customers may write `stock`, `variants` and `salesLastMonth` during a purchase, but not price, name or description |

Two rules are intentionally left open and marked as such in the file: gift card and customer writes still run in the browser during checkout, and tightening them without a server-side replacement would break the purchase flow.

## Known Limitations and Roadmap

The system carries the following constraints. Each is bounded in scope, and each has a defined next step.

| Limitation | Impact | Planned fix |
|---|---|---|
| **Pricing runs on the client** | The order total is calculated in the browser and written to Firestore. Rules validate ownership but cannot recompute a cart, so a modified total would be accepted | A `createOrder` cloud function that receives items and a coupon code, computes the total server-side, and writes the order itself. This is the highest-value change on this list |
| **No transactions on shared counters** | Stock, loyalty points and gift card balances are read then written. Two concurrent operations on the same document can lose one update | `runTransaction` on the three write paths. Gift card redemption is the smallest of the three and the natural first candidate |
| **The steps after an order is saved are not atomic** | Stock, coupon usage, loyalty points, gift card balances and the cart are updated one after another once the order document exists. A failure part way through leaves the order recorded with some of its consequences missing; the customer still reaches her confirmation and the failure is logged for the manager | Move the whole sequence into the `createOrder` cloud function above, where it can run as one Firestore transaction |
| **Cloud functions are unauthenticated** | 16 of the 17 functions are declared with `cors: true` and none verify the caller, so the email and AI endpoints can be invoked directly | `verifyIdToken` on each controller, or Firebase App Check |
| **Coupon usage is recorded but not enforced** | `logCouponUsage` writes a usage document, but nothing reads it to block reuse, so one coupon can be redeemed repeatedly | Enforcement belongs server-side, since the rules correctly deny customers read access to other users' usage records |
| **Restocking spreads differently from decrementing** | An item bought without a specific size has its quantity taken across several sizes, but a cancellation or return returns the whole quantity to the first size. The product total stays correct; the split between sizes does not | Mirror the two functions so a restock reverses the exact sizes a purchase drew from, which means recording the per-size split on the order item |
| **`salesLastMonth` is a running total, not a monthly one** | The field only ever increases. Nothing resets it at the turn of the month and nothing reduces it when an order is cancelled or returned, so the name and the "sales this month" label both overstate what it holds. It ranks the catalogue bestsellers and the slow-moving list | A scheduled function that rolls the counter over monthly, and a decrement on the cancellation and return paths. Rolling it over needs a scheduler, which is why it is not a client-side change |
| **Returns are deducted at list price** | A return deducts `price × qty` from revenue using the item's catalogue price, not the share the customer actually paid after a coupon or redeemed points. On a discounted order the deduction exceeds the revenue that was recognised | Record the effective per-item price on the order line at checkout, and deduct that figure on approval |
| **Email verification is a UX gate, not a security control** | The Firebase Auth session is created before the code is sent, so the account is already signed in while the code screen is showing. The code is generated and checked in the browser, and the security rules let a customer read and write her own verification document, so the code can be read from Firestore or the document deleted to skip the step entirely | Replace the whole mechanism with Firebase's built-in `sendEmailVerification`, which issues and validates the token server-side and exposes the result as `emailVerified` on the auth token |

## Working with Git

Work on a branch per feature, never directly on `main`. Verify `npm run build` passes before committing. Commit with a message describing what changed, and open a pull request to merge.
