# FashionSync 👗

[![CI](https://github.com/tasneembaqli04-jpg/fashion-sync-react/actions/workflows/ci.yml/badge.svg)](https://github.com/tasneembaqli04-jpg/fashion-sync-react/actions/workflows/ci.yml)

🔗 **Live site:** [fashionsync-dc79f.web.app](https://fashionsync-dc79f.web.app)

An information system for running an online fashion store: a customer interface for browsing and buying, and a management interface for inventory, orders, deliveries and settings.

Developed by Radyeh Moussa (212793954) and Tasnim Bakli (325488716).

For how to actually use the system, see [`USER_GUIDE.md`](./USER_GUIDE.md).

## Table of Contents

- [Purpose](#purpose)
- [Architecture](#architecture)
- [The AI Pipeline](#the-ai-pipeline)
- [Original Algorithms](#original-algorithms)
- [Revenue Model](#revenue-model)
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
          │  Gemini AI  │         │    Gmail    │
          │ (Vertex AI) │         │   (SMTP)    │
          └─────────────┘         └─────────────┘
```

The React frontend talks directly to Firebase Auth and Firestore for most operations, and to Cloud Functions for anything needing server-side logic: sending email, calling the AI models, and generating images. There are 17 cloud functions.

## The AI Pipeline

**The model never invents catalogue data.** A language model asked "do you have this dress in M?" will produce a fluent answer whether or not it knows, and a wrong answer about stock costs a real sale and a real customer. So the model is never the source of a fact about the shop. It is used for two things only: reading what the customer meant, and phrasing an answer built from data the system fetched itself.

That principle is why the assistant is a five-stage pipeline rather than one model call. Stages 2 and 3 exist to put facts in front of the model, and stage 5 hands it those facts with an instruction not to add to them.

| Stage | What happens | Where |
|---|---|---|
| 1. Intent detection | Message and history go to Gemini constrained by a JSON schema, returning category, gender, size, colour, price range, occasion, style, season | `chatIntentService.js` |
| 2. Live data | Business hours, policy and store details read from Firestore | `chatOrchestratorService.js` |
| 3. Product search | Catalogue filtered by the hard constraints. Out-of-stock products are excluded | `chatProductService.js` |
| 4. Relevance scoring | Occasion, style and season rank the results. Scoring only reorders — it never rejects, so a search cannot come back empty because of the occasion | `chatProductService.js` |
| 5. Answer | Real results injected into the prompt with an explicit instruction not to invent products, prices or availability. Reply is streamed | `chatOrchestratorService.js` |

The schema in stage 1 is what makes the rest reliable. A free-text reply would have to be parsed and could arrive in any shape; a schema-constrained reply arrives as fields the search can use directly, so a misread question degrades into a broader search rather than a malformed one.

| Model | Used for |
|---|---|
| `gemini-3-flash-preview` | Intent detection, chat replies, outfit planning |
| `gemini-3.1-flash-image` | Outfit visualization |
| `gemini-2.5-flash-image` | Try-On on a customer photo |
| `virtual-try-on-001` | Vertex AI Virtual Try-On |

## Original Algorithms

Four pieces of logic are written rather than delegated, each because a library or a model call does not solve the specific problem.

### Hebrew stem derivation

**The problem.** Hebrew inflects the same noun in ways plain string matching cannot see through. A customer searching `שמלה` should find `שמלת ערב`, but the two forms end in different letters, so an exact comparison fails on words that are the same noun. Final letters compound it: `אדום` is written with `ם` at the end and `אדומה` with `מ` in the middle, so even the shared part does not match character for character.

**How it works.** Two orthographic steps, no semantic stemming. Final letters fold to their regular forms, then a trailing `ה` or `ת` is dropped from words of at least four characters. The four-character floor is deliberate: it keeps every stem at three characters or more, so short words are never ground down to noise.

**Example.** `שמלה` (4 characters, ends in `ה`) → stem `שמל`. `שמלת` (4 characters, ends in `ת`) → stem `שמל`. Equal, so the search matches. But `אמה` is only 3 characters, stays `אמה`, and does not collapse to the 2-character `אמ`.

Matching is on whole-word prefixes with a 3-character minimum, so `ערב` matches the word `ערב` but not `מעורב`. Implemented in `toHebrewStem`, `chatProductService.js`.

### Relevance scoring

**The problem.** Occasion, style and season are soft preferences, not requirements. Treating them as filters produces the worst possible result: a customer asking for "something for a wedding" gets an empty catalogue because no product has the word "wedding" in its description.

**How it works.** Each product gets a score, and the score only ever reorders. Nothing is rejected for scoring zero. Weights reflect how much each signal narrows the choice: occasion 3, style 2, season 1.

**Example.** A customer asks for an elegant summer evening dress. A black evening dress described as elegant, marked summer, scores 3 + 2 + 1 = 6. A summer dress with no style or occasion words scores 0 + 0 + 1 = 1. A winter coat scores 0. All three stay in the results, in that order — so the answer is never empty, and the best match is always first.

Implemented in `getProductRelevanceScore`, `chatProductService.js`.

### Three-level sort

**The problem.** Relevance alone puts a sold-out perfect match above an available good one, which is the wrong recommendation: the customer cannot buy the first.

**How it works.** Three comparisons in order, each breaking ties in the one before. Availability first, then relevance score descending, then price ascending.

**Example.** Four dresses, all matching the search:

| Dress | In stock | Score | Price | Position |
|---|---|---|---|---|
| A | yes | 6 | ₪450 | 1st — highest score among the available |
| B | yes | 3 | ₪280 | 2nd |
| C | yes | 3 | ₪390 | 3rd — ties B on score, loses on price |
| D | no | 6 | ₪300 | 4th — ties A on score and is cheaper, but unbuyable |

D matches as well as A and costs less, and still sorts last, because availability is decided before anything else. B beats C only on price, since their scores tie. The maximum score is 6, from 3 + 2 + 1.

### Translation dictionary

**The problem.** Machine translation fails on fashion vocabulary in three distinct ways, each needing the same fix. It transliterates instead of translating (`חולצת קרופ` → "Crop shirt"). It injects unrelated text on short inputs. And it picks the wrong sense of a homonym: `שרוולים תפוחים` means puff sleeves, but `תפוח` alone is an apple.

**How it works.** A dictionary of known terms is consulted first, and the API is called only on a miss. 17 product terms and 20 colours, each an entry the API demonstrably got wrong.

**Example.** `חולצת שרוולים תפוחים` hits the dictionary and returns "Puff Sleeve Top" with no API call. A product name not in the dictionary goes to the API, and the correction pass runs on the result.

The dictionary applies to product names and colours only. Customer names, addresses and messages go through the generic translation path, which must never have fashion terms applied to it. Implemented in `translationService.js`.

## Revenue Model

Revenue is measured by **goods that left the shop**, not by cash that arrived. The two differ, and using cash received would misreport both figures the manager relies on.

| Rule | Why | Where |
|---|---|---|
| Delivery charges are excluded from revenue | A delivery fee is collected on behalf of the courier and paid out again. Counting it as income without the matching cost inflates profit by the full fee | `getOrderGoodsRevenue` |
| A gift card is recognised when it is spent, not when it is bought | Selling a card takes cash but delivers nothing. Until it is redeemed the shop owes goods, so the sale is a liability. Counting it at purchase and again at redemption would count the same money twice | `getOrderGoodsRevenue` |
| Discounts are apportioned across the goods | An order-level discount reduces what the goods actually earned. Applying it anywhere else would leave the line items summing to more than the order was worth | `getOrderGoodsRevenue` |

**Example.** An order of ₪500 in clothing plus a ₪100 gift card, with ₪30 delivery and a ₪50 coupon, is charged at ₪580. Recognised revenue is not ₪580 and not ₪550. The gift card contributes nothing yet, delivery contributes nothing, and the coupon is apportioned to the goods share of the order: ₪500 − (₪50 × 500/600) ≈ **₪458**. The remaining ₪100 is recognised later, when someone spends the card.

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

7 customer panels and 14 management screens, built from 57 React components over 15 Firestore collections and 17 cloud functions.

```
fashion-sync-react/
├── .github/workflows/        # CI — runs tests and build on push and pull request
├── frontend/                 # React application
│   └── src/
│       ├── components/       # UI (customer/, manager/, checkout/, home/, common/)
│       ├── pages/            # Customer, Manager, Checkout, Home
│       ├── services/         # Direct Firestore access — the "database" layer
│       ├── functions/        # Business logic built on services/ — the "logic" layer
│       ├── hooks/            # Shared React hooks, and the page feature hooks
│       ├── translations/     # Hebrew/English strings
│       └── styles/           # SCSS Modules
├── backend/                  # Firebase Cloud Functions
│   └── src/
│       ├── config/           # Firebase Admin, Gemini, Vertex AI
│       ├── controllers/      # HTTP entry points — chat/, email/, tryOn/
│       └── services/         # Server logic, split the same three ways
└── scripts/                  # One-off maintenance scripts, outside the Vite build
```

**The frontend split matters:** `services/` performs database access; `functions/` holds the business logic that builds on it. Keeping the logic layer free of network calls is what makes it unit-testable, which is why every test file targets `functions/` or `services/`.

**Features live in hooks, not in the page.** The customer and management pages were single components holding every screen's state at once. Each self-contained feature now sits in its own hook under `hooks/`, and the page calls them and passes the results down:

| Hook | Holds |
|---|---|
| `useShareModal` | Sharing a product by link, email or WhatsApp |
| `useGiftCard` | Buying a gift card, and checking a balance |
| `useTryOn` | The Try-On dialog, its photo and its cancellable request |
| `useCustomerOrders` | A customer's order history and the returns raised against it |
| `useManagerOrders` | Every order, its live subscription, and the manager's decisions |
| `useChat` | The shopping assistant and its streaming reply |

This took `Customer.jsx` from 1,529 lines to 1,086 and `Manager.jsx` from 995 to 812. The hooks hold state and side effects; the pure rules they rely on stay in `functions/`, where the tests reach them.

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

382 tests across eighteen files, covering the business logic that carries the most risk.

| File | Tests | Covers |
|---|---|---|
| `translationService.test.js` | 52 | Fashion term dictionary, translation fixes, colour translation guard |
| `analytics.test.js` | 46 | Revenue recognition, profit, averages, slow movers |
| `verificationService.test.js` | 32 | Code lifetime, resend ceiling, superseded codes |
| `itemDisplay.test.js` | 26 | Item name, colour and size by interface language |
| `cart.test.js` | 24 | The per-variant quantity ceiling and cart mutations |
| `historicalTranslation.test.js` | 24 | Which stored records still need translating, and how many |
| `orderPolicy.test.js` | 23 | The 24-hour cancellation and 7-day return windows |
| `checkoutPricing.test.js` | 20 | Subtotal, discounts, shipping, total |
| `money.test.js` | 19 | Two-decimal rounding and the instalment split |
| `auth.test.js` | 18 | The identity cache: writing, clearing, guest mode |
| `stockPolicy.test.js` | 17 | Availability and stock status per product and variant |
| `orderStatus.test.js` | 17 | Which orders still need a decision, and which are in transit |
| `giftCard.test.js` | 15 | Gift card purchase rules and refusal codes |
| `businessHoursPolicy.test.js` | 11 | Opening hours validation |
| `notificationSettingsService.test.js` | 11 | Alert preferences, and defaults that never silence an alert |
| `dates.test.js` | 9 | Resolving an order timestamp from its candidate fields |
| `managerHelpers.test.js` | 9 | Stock alerts and the manager alert preferences |
| `productsService.test.js` | 9 | Stock decrement and the sales counter |

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
| **The order total is computed in the browser** | Checkout calculates the total in JavaScript and writes the resulting number to Firestore. The security rules can confirm that the customer owns the order, but they cannot recompute a cart, so they have no way to tell a correct total from an edited one. A customer who alters the value before it is sent has it accepted and stored | A `createOrder` cloud function that receives the items and the coupon code, computes the total server-side from the catalogue, and writes the order itself. The browser would then send only what was chosen, never what it costs. This is the highest-value change on this list |
| **No transactions on shared counters** | Stock, loyalty points and gift card balances are read then written. Two concurrent operations on the same document can lose one update | `runTransaction` on the three write paths. Gift card redemption is the smallest of the three and the natural first candidate |
| **The steps after an order is saved are not atomic** | Stock, coupon usage, loyalty points, gift card balances and the cart are updated one after another once the order document exists. A failure part way through leaves the order recorded with some of its consequences missing; the customer still reaches her confirmation and the failure is logged for the manager | Move the whole sequence into the `createOrder` cloud function above, where it can run as one Firestore transaction |
| **Cloud functions do not authenticate the caller** | A separate problem from the one above: that one is about trusting a number the browser sends, this one is about who may call at all. 16 of the 17 functions are declared with `cors: true`, and no controller checks an identity token, so anyone holding a function URL can invoke the email and AI endpoints directly without signing in | `verifyIdToken` at the top of each controller, or Firebase App Check in front of all of them |
| **Coupon usage is recorded but not enforced** | `logCouponUsage` writes a usage document, but nothing reads it to block reuse, so one coupon can be redeemed repeatedly | Enforcement belongs server-side, since the rules correctly deny customers read access to other users' usage records |
| **Restocking spreads differently from decrementing** | An item bought without a specific size has its quantity taken across several sizes, but a cancellation or return returns the whole quantity to the first size. The product total stays correct; the split between sizes does not | Mirror the two functions so a restock reverses the exact sizes a purchase drew from, which means recording the per-size split on the order item |
| **`salesLastMonth` is a running total, not a monthly one** | The field only ever increases. Nothing resets it at the turn of the month and nothing reduces it when an order is cancelled or returned, so the name and the "sales this month" label both overstate what it holds. It ranks the catalogue bestsellers and the slow-moving list | A scheduled function that rolls the counter over monthly, and a decrement on the cancellation and return paths. Rolling it over needs a scheduler, which is why it is not a client-side change |
| **Returns are deducted at list price** | A return deducts `price × qty` from revenue using the item's catalogue price, not the share the customer actually paid after a coupon or redeemed points. On a discounted order the deduction exceeds the revenue that was recognised | Record the effective per-item price on the order line at checkout, and deduct that figure on approval |
| **Email verification is a UX gate, not a security control** | The Firebase Auth session is created before the code is sent, so the account is already signed in while the code screen is showing. The code is generated and checked in the browser, and the security rules let a customer read and write her own verification document, so the code can be read from Firestore or the document deleted to skip the step entirely | Replace the whole mechanism with Firebase's built-in `sendEmailVerification`, which issues and validates the token server-side and exposes the result as `emailVerified` on the auth token |
| **Catalogue search is weaker than the assistant search** | The catalogue matches on `name.includes(search)`: case sensitive, and the words must appear in the given order with nothing between them. Searching `שמלה` misses `שמלת ערב`, which the assistant finds, so the same query behaves differently in the two places | Move the word splitting and Hebrew stem matching out of `chatProductService` into a shared module both sides call |
| **Dialogs do not trap focus** | Every dialog announces itself, closes on Escape and moves focus inside on open, but Tab still walks out of it and into the page behind. A keyboard user can reach the content the dialog is covering without closing it first | Hold Tab and Shift+Tab inside the dialog while it is open, in the same `useModalA11y` hook the fifteen dialogs already share |

