# Bitezy — Use Case Diagrams

This folder contains UML use case diagrams for the **Bitezy Smart Canteen Platform** — the official food ordering system for CUET (Chittagong University of Engineering & Technology).

## Actors

| Actor | Description |
|-------|-------------|
| **Guest** | Unauthenticated visitor; can register or log in |
| **Customer** | Students, Teachers, or Staff who browse menus and order food |
| **Seller** | Canteen / Cafeteria / Food Cart owners who manage orders and menus |
| **Admin** | Platform administrator with full oversight |

---

## Diagrams

| File | Description |
|------|-------------|
| [`01_system_overview.puml`](./01_system_overview.puml) | Overall system — all actors and their major use cases |
| [`02_customer_use_cases.puml`](./02_customer_use_cases.puml) | Detailed Customer (buyer) use cases |
| [`03_seller_use_cases.puml`](./03_seller_use_cases.puml) | Detailed Seller (canteen owner) use cases |
| [`04_admin_use_cases.puml`](./04_admin_use_cases.puml) | Detailed Admin use cases |

> **Rendering:** Open `.puml` files in [PlantUML Online](https://www.plantuml.com/plantuml/uml/) or install the [PlantUML VS Code extension](https://marketplace.visualstudio.com/items?itemName=jebbs.plantuml) to render them locally.

---

## 1. System Overview

```
Actors: Guest, Customer, Seller, Admin
```

**Guest** → Register, Login  
**Customer** → Login, Browse/Search Providers, View Menu, Manage Cart, Place Order, Track Order, Order History, Write/View Reviews, Edit Profile, Logout  
**Seller** → Login, View Dashboard, Manage Orders, Manage Menu Items, View Reviews, Update Shop Settings, Logout  
**Admin** → Login, View Platform Dashboard, Manage All Orders, Manage Users, Manage Sellers, Manage Reviews, Logout

---

## 2. Customer Use Cases

```
Actor: Customer (Student / Teacher / Staff)
```

### Account Management
- Register with Name, Email, Role (Student / Teacher / Staff), CUET ID, Department, Hall
- Login with Email & Password
- View & Edit Profile (Name, Phone, Hall, Department)
- Logout

### Discovery
- Browse all food providers
- Filter providers by category (Canteen / Cafeteria / Street Food Cart)
- Search providers by name
- View provider details (location, opening hours, rating, open/closed status)
- View provider menu items

### Ordering
- Add items to cart (single provider at a time)
- Update item quantities in cart
- Select delivery method — **Delivery (+30৳)** or **Self Pickup (Free)**
- View order summary (subtotal, delivery fee, total)
- Place order

### Post-Order
- View full order history
- Track current order status: `Pending → Preparing → On the Way → Delivered`

### Reviews
- View customer reviews for a provider (with average rating)
- Submit a review (1–5 star rating + written comment)

---

## 3. Seller Use Cases

```
Actor: Seller (Canteen / Cafeteria / Food Cart Owner)
```

### Dashboard
- View today's earnings
- View total orders and pending count
- View average rating and total review count
- View weekly sales trend chart (last 7 or 30 days)
- View order distribution (Delivery % vs. Pickup %)
- View recent orders at a glance

### Order Management
- View active (pending/in-progress) orders
- View order history (past orders)
- Update order status: `Pending → Preparing → Ready → Delivered`

### Menu Management
- View all current menu items
- Add new item (name, category, price, image URL)
- Edit existing item details
- Toggle item availability (available / unavailable)
- Delete a menu item

### Reviews
- View all customer reviews for their shop
- View average star rating and total review count

### Settings
- View shop profile (name, owner, location, description, hours)
- Edit shop details (description, opening/closing times, contact info)

---

## 4. Admin Use Cases

```
Actor: Admin
```

### Platform Dashboard
- View total platform revenue (all-time)
- View total orders across all sellers
- View registered users count
- View active sellers count
- View recent global orders table

### Order Management
- View all system orders (across all sellers and customers)
- Filter orders by seller or status

### User Management
- View all registered user accounts (Students, Teachers, Staff)
- View user details (name, hall, email, user type, phone)
- Delete a user account

### Seller Management
- View all sellers (canteens, cafeterias, food carts)
- View seller details (shop name, owner, location, total orders, total revenue)
- Delete a seller account

### Reviews Management
- View all reviews across the platform
- Filter reviews by provider
- Delete inappropriate reviews
