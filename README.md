# ShopSync: Dual-Role Commerce App

React Native (Expo SDK 57, TypeScript) app with switchable **Customer** and **Supplier** roles, a live product catalog, orders and inventory, and **real-time Customer ↔ Supplier chat**, all on Convex.

## Test accounts

Pick a role on the login screen and the matching test credentials fill in automatically.

| Role     | Email                | Password   |
|----------|----------------------|------------|
| Customer | customer@test.com    | `Test@123` |
| Customer | customer2@test.com   | `Test@123` |
| Supplier | supplier@test.com    | `Test@123` |

The login screen has a role selector (Customer/Supplier cards), email, password with a show/hide toggle, and inline errors (wrong password, or the wrong role for that account). The session is stored in AsyncStorage and survives app restarts. **Logout** (top right) signs out and returns to the role picker, where you can pick the other role.

## Features

- **Customer**
  - 2-column FlashList catalog with 300 ms debounced search, category chips, and an empty state for zero results.
  - Product detail with specs and live stock. Adding to cart springs the button and pops/wiggles the cart badge.
  - Cart with +/- quantity and **swipe-left-to-delete** (Gesture Handler Pan + Reanimated, running on the UI thread). Empty cart has its own state.
  - Support chat.
- **Supplier**
  - Live sales: customer checkouts are saved as orders in Convex (priced server-side, stock deducted), and the dashboard's revenue, order count, year-over-year deltas, monthly chart and "Recent orders" update instantly.
  - Analytics: KPI tiles, revenue trend with a line/bar toggle and touch tooltip (react-native-gifted-charts), and a category donut drawn with react-native-svg.
  - Inventory: live in-stock switches. Changes are written to Convex, so customers see them instantly.
  - Product management: one bottom-sheet form to **add** a product, or **edit** every field (name, price, stock, category, image URL, description) and **delete** it. Everything is validated on the server and shows up live in every customer's catalog.
  - Tap any inventory row to open the full product page with specs and live units in stock.
  - Inbox of customer threads leading to each chat.
- **Chat**
  - Convex reactive query plus mutation.
  - Inverted list, so the newest message stays pinned at the bottom.
  - `KeyboardAvoidingView` offset by the header height, so the keyboard never covers the history.
- **Polish**
  - Edge-to-edge with SafeAreaProvider insets for notches and gesture bars.
  - Haptics and optimistic inventory updates.

## Structure

```
convex/            backend: schema, auth (sessions), chat, inventory, products, orders, seed
src/app/           expo-router routes
  index.tsx          login / role switcher
  (customer)/        shop, cart, support tabs
  (supplier)/        dashboard, inventory, inbox tabs
  product/[id].tsx   product detail (shared by both roles)
  chat/[customerId]  supplier ↔ customer thread
src/components/    ChatThread, SwipeableRow, CartBadge, Donut, ProductSheet, ProductImage, EmptyState, HeaderActions
src/data/          products.json (catalog seed), analytics.ts (historical dashboard figures)
src/shared.ts      constants shared by app + backend (categories, shipping, stock limit, test accounts)
src/store.ts       zustand + AsyncStorage (session, cart)
src/lib.ts         catalog helpers, debounce, live inventory hook
patches/           small web fix for react-native-gifted-charts (applied on postinstall)
```

Role gating uses `Stack.Protected`: once the session is set or cleared, the router moves to the right area by itself.

## Run locally

```bash
npm install
npx convex dev          # dev backend (writes EXPO_PUBLIC_CONVEX_URL to .env.local)
npm run seed            # creates the test accounts, product catalog and stock levels (idempotent)
npx expo start          # needs a dev build (native modules) or run --web
```

## Build the APK

```bash
npx eas-cli login
npx eas-cli build -p android --profile preview
```

The `preview` profile builds an installable `.apk` that points at the production Convex deployment (already deployed and seeded).
