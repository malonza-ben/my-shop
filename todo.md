# Sunbox Electronics Store — TODO

## Phase 1: Database & Credentials
- [x] Database schema: products, categories, orders, order_items, cart_items tables
- [x] M-Pesa credentials stored as secrets
- [x] Seed sample electronics products

## Phase 2: Backend API
- [x] Products CRUD procedures (public list, detail; admin add/edit/delete)
- [x] Categories procedures
- [x] Cart procedures (add, update, remove, get)
- [x] Order creation procedure
- [x] M-Pesa STK Push initiation procedure
- [x] M-Pesa payment status polling procedure
- [x] M-Pesa callback handler endpoint
- [x] Admin order management procedures (list all, update status)
- [x] Role-based access control (adminProcedure)

## Phase 3: Public Storefront
- [x] Global navigation bar (logo, categories, cart icon, auth)
- [x] Homepage with hero section, featured products, category grid
- [x] Product listing page with filters and search
- [x] Product detail page with images, specs, add-to-cart
- [x] Footer

## Phase 4: Cart & Checkout
- [x] Shopping cart page (add/remove/update quantities, order summary)
- [x] Checkout page (shipping details form)
- [x] M-Pesa STK Push payment page with phone number input
- [x] Payment status polling UI
- [x] Order confirmation page

## Phase 5: User & Admin Dashboards
- [x] User account dashboard (profile, order history)
- [x] Admin dashboard layout
- [x] Admin products management (list, add, edit, delete)
- [x] Admin orders management (list all, update status)

## Phase 6: Polish & Tests
- [x] Global styling: elegant typography, color palette, spacing
- [x] Responsive design (mobile-first)
- [x] Loading states and empty states
- [x] Vitest unit tests for key procedures (26 tests passing)
- [x] Final checkpoint
