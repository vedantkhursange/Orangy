# Orangy Backend – Full API Reference & Front‑End Integration Guide

---
## 1. Architecture Snapshot
- **PostgreSQL** – Users, Products, Variants, Orders, Cart (transactional data).
- **MongoDB** – Media assets, Caretakers (flexible documents).
- **Redis** – Shopping‑cart snapshot (fast read/write, TTL = 30 min).
- **JWT** (15 min) – Issued by `/api/auth/login`; required for any `admin/**` route.
- **Spring Boot** – All REST endpoints defined under `src/main/java/com/orangy/`.

---
## 2. Controllers & Endpoints
### 2.1 Auth (`AuthController`)
| Method | Path | Auth | Request | Response | Notes |
|--------|------|------|---------|----------|-------|
| `POST` | `/api/auth/login` | ✖ | `{ "email": "...", "password": "..." }` | `{ "accessToken": "jwt", "expiresIn": 900 }` | Returns JWT (Bearer). |
| `POST` | `/api/auth/register` | ✖ | `UserCreateRequest` | `UserResponse` | New user, role = `USER`. |

### 2.2 Public Catalog (`ProductController`)
| Method | Path | Auth | Request Params | Response | Description |
|--------|------|------|----------------|----------|-------------|
| `GET` | `/api/products` | ✖ | `category`, `minPrice`, `maxPrice`, `page`, `size` | `Page<ProductSummaryResponse>` | List with pagination; each entry contains `thumbnailUrl` (first variant image). |
| `GET` | `/api/products/{id}` | ✖ | – | `ProductResponse` | Full product including list of `VariantResponse`. |
| `GET` | `/api/products/{id}/variants` | ✖ | – | `List<VariantResponse>` | Variant list for a product – used for selector UI. |

### 2.3 Admin Catalog (`AdminProductController`)
| Method | Path | Auth | Request Body | Response | Notes |
|--------|------|------|--------------|----------|-------|
| `POST` | `/api/admin/products` | ✔ (ADMIN) | `ProductCreateRequest` | `ProductResponse` | Creates a product (no media yet). |
| `PUT` | `/api/admin/products/{id}` | ✔ | `ProductCreateRequest` | `ProductResponse` | Updates product fields. |
| `DELETE` | `/api/admin/products/{id}` | ✔ | – | `void` | Soft‑delete (sets `active = false`). |
| `POST` | `/api/admin/products/{id}/variants` | ✔ | `VariantCreateRequest` | `VariantResponse` | Adds a variant; **price** must be a number (`BigDecimal`), **thumbnailImageUrl** is a plain URL. |
| `PUT` | `/api/admin/products/variants/{variantId}` | ✔ | `VariantCreateRequest` | `VariantResponse` | Update variant (including thumbnail). |
| `DELETE` | `/api/admin/products/variants/{variantId}` | ✔ | – | `void` | Delete variant. |

### 2.4 Media (`MediaController` & `AdminMediaController`)
| Method | Path | Auth | Request Body | Response | Notes |
|--------|------|------|--------------|----------|-------|
| `GET` | `/api/media/product/{productId}` | ✖ | – | `List<MediaAssetResponse>` | Public gallery for a product. |
| `POST` | `/api/admin/media` | ✔ (ADMIN) | `MediaCreateRequest` | `MediaAssetResponse` | Create a media asset (image or video). |
| `PUT` | `/api/admin/media/{mediaId}` | ✔ | `MediaCreateRequest` | `MediaAssetResponse` | Update URL / alt‑text / sort order. |
| `DELETE` | `/api/admin/media/{mediaId}` | ✔ | – | `void` | Remove asset. |

**`MediaCreateRequest` example**
```json
{
  "refType": "PRODUCT",           // enum: PRODUCT, FARM, HERO_VIDEO, USER_AVATAR, etc.
  "type": "IMAGE",                // or "VIDEO"
  "url": "https://images.example.com/orange.jpg",
  "refId": "0b494174-f7a2-4772-bcda-86c8271ae0dd",
  "altText": "Basket of fresh oranges",
  "sortOrder": 1
}
```
The backend only stores this JSON in MongoDB; the actual binary file lives in a cloud bucket (S3, Cloudinary, etc.).

### 2.5 Cart (`CartController`)
| Method | Path | Auth | Request Body | Response |
|--------|------|------|--------------|----------|
| `POST` | `/api/cart/items` | ✔ | `{ "variantId": "...", "quantity": 1 }` | Updated `Cart` (stored in Redis). |
| `GET` | `/api/cart` | ✔ | – | `Cart` |
| `PUT` | `/api/cart/items/{variantId}` | ✔ | `{ "quantity": 2 }` | Updated `Cart`. |
| `DELETE` | `/api/cart/items/{variantId}` | ✔ | – | `void`. |

### 2.6 Order (`OrderController`)
| Method | Path | Auth | Request Body | Response |
|--------|------|------|--------------|----------|
| `POST` | `/api/orders` | ✔ | `OrderCreateRequest` (address + cart snapshot) | `OrderResponse` – creates order, generates Razorpay order ID (mock fallback in dev). |
| `GET` | `/api/orders/{orderId}` | ✔ | – | `OrderResponse` – only owner or ADMIN can view. |
| `POST` | `/api/orders/{orderId}/verify` | ✔ | `PaymentVerificationRequest` | `OrderResponse` – sets status to `PAID` after signature verification. |

### 2.7 Review (`ReviewController`)
| Method | Path | Auth | Request Body | Response |
|--------|------|------|--------------|----------|
| `POST` | `/api/reviews` | ✔ | `ReviewCreateRequest` | `ReviewResponse` |
| `GET` | `/api/products/{id}/reviews` | ✖ | – | `List<ReviewResponse>` |

### 2.8 Caretaker (`CaretakerController` – optional)
Caretakers are stored in MongoDB via `CaretakerRepository`. If you need UI for them, expose:
| Method | Path | Auth | Request Body | Response |
|--------|------|------|--------------|----------|
| `GET` | `/api/caretakers` | ✔ (ADMIN) | – | `List<Caretaker>` |
| `POST` | `/api/caretakers` | ✔ | `CaretakerCreateRequest` | `Caretaker` |
| `PUT` | `/api/caretakers/{id}` | ✔ | `CaretakerUpdateRequest` | `Caretaker` |
| `DELETE` | `/api/caretakers/{id}` | ✔ | – | `void` |

---
## 3. Data Transfer Objects (DTOs) – Quick Reference
Below are the most used request/response objects (field name – type – required). Full definitions live in `src/main/java/com/orangy/*/dto/`.

### ProductCreateRequest
| Field | Type | Required |
|-------|------|----------|
| `name` | `String` | ✅ |
| `description` | `String` | ❌ |
| `category` | `String` | ✅ |
| `organicCertified` | `boolean` | ❌ (default false) |
| `farmSource` | `String` | ❌ |

### VariantCreateRequest
| Field | Type | Required |
|-------|------|----------|
| `label` | `String` | ✅ |
| `price` | `BigDecimal` | ✅ |
| `unit` | `Unit` (enum) | ✅ |
| `quantityValue` | `Integer` | ✅ |
| `stockCount` | `Integer` | ✅ |
| `thumbnailImageUrl` | `String` (URL) | ❌ |

### MediaCreateRequest – see JSON example above.

### OrderCreateRequest (simplified)
| Field | Type | Required |
|-------|------|----------|
| `deliveryAddress` | `AddressDto` | ✅ |
| `items` | `List<OrderItemDto>` | ✅ |

### PaymentVerificationRequest
| Field | Type |
|-------|------|
| `razorpayOrderId` | `String` |
| `razorpayPaymentId` | `String` |
| `razorpaySignature` | `String` |

---
## 4. Typical Front‑End Integration Flows
### 4.1 Product Creation (Admin)
1. **Create product** → `POST /api/admin/products` → receive `productId`.
2. **Add at least one variant** → `POST /api/admin/products/{productId}/variants` (include a thumbnail URL if you have one). Keep the returned `variantId`.
3. **Upload media**
   - Upload image/video to Cloudinary (or any S3‑compatible bucket) **directly from the browser**; receive a public URL.
   - `POST /api/admin/media` with the `url` and `refId = productId`.
4. **Front‑end composition** – Product detail page fetches:
   - `/api/products/{productId}` (product + variants)
   - `/api/media/product/{productId}` (gallery)
   - Merge and display.

### 4.2 Shopping Cart
- **Add to cart** → `POST /api/cart/items` (requires JWT).
- **Cart UI** – Use **SWR** or **React‑Query** to poll `GET /api/cart` for real‑time updates.
- **Update quantity / remove** – `PUT` / `DELETE` on the item endpoint.

### 4.3 Checkout (User)
1. **POST /api/orders** with delivery address & cart snapshot → receives `orderId` and a (mock) Razorpay order ID.
2. Simulate payment (in dev) → `POST /api/orders/{orderId}/verify` with the Razorpay signature payload.
3. After verification, UI shows **Order Confirmation**.

### 4.4 Public Product Browsing (Customer)
- **Product list page** – Server‑Side Render (`getServerSideProps`) calling `/api/products` for SEO.
- **Product detail page** – `getServerSideProps` calls both `/api/products/{id}` and `/api/media/product/{id}`; combine data client‑side.
- **Variant selector** – Populate a dropdown from `VariantResponse`; on selection, send `variantId` to cart.

---
## 5. Front‑End Stack Recommendation
- **Framework:** **React + Next.js** (SSR, API routes, built‑in image optimisation). Ideal for SEO‑friendly e‑commerce.
- **State / Data Fetching:** `axios` with an interceptor that adds `Authorization: Bearer <jwt>`; `react‑query` or `swr` for caching.
- **UI Library:** **Radix UI** primitives + **shadcn/ui** for theming (no Tailwind needed, but you may add it later). 
- **Animations:** `framer‑motion` for micro‑animations (hover, carousel slide). 
- **Typography:** Google Fonts – **Outfit** for headings, **Inter** for body text. 
- **Color palette:** Warm orange hue (e.g., `hsl(30, 70%, 55%)`) with a dark‑mode complement. Use gradients and subtle glass‑morphism for premium feel.
- **Forms & Validation:** `react-hook-form` + `zod` for schema validation; matches the backend `@Valid` constraints.

---
## 6. UI Template Inspirations (Free / MIT‑licensed)
| Template | Repo / Link | Why it fits |
|----------|------------|-------------|
| **Vercel Commerce Starter** | https://github.com/vercel/commerce | Next.js e‑commerce skeleton, easy to replace Stripe with Razorpay mock. |
| **MedusaJS Demo Store** | https://github.com/medusajs/medusa-react | Clean product‑detail page, cart flow, and API‑first mindset. |
| **Creative‑Tim NextJS Material Kit** | https://github.com/creativetimofficial/nextjs-material-kit | Polished UI components, MIT licence – you can strip Tailwind and apply your orange theme. |
| **Tailwind‑UI‑Free** (optional) | https://tailwindui.com/components (free tier) | Provides ready‑made cards, modals, and forms if you later adopt Tailwind. |

Pick one as a base, remove unwanted parts, and re‑theme with the palette described above.

---
## 7. Quick‑Start Checklist for Front‑End Developers
- [ ] **Auth** – Store JWT (HttpOnly cookie or localStorage) and set up Axios interceptor.
- [ ] **Product List** – SSR page using `/api/products`.
- [ ] **Product Detail** – Combine product API + media gallery.
- [ ] **Variant Selector** – Add to cart via `/api/cart/items`.
- [ ] **Cart Page** – SWR polling of `/api/cart`.
- [ ] **Checkout** – POST order, then verify payment.
- [ ] **Admin Dashboard** – Use admin endpoints; implement media upload flow (cloud upload → media API).
- [ ] **Styling** – Apply orange palette, Out­fit/Inter fonts, framer‑motion transitions.

---
*All information above is generated from the current repository sources. Keep this file next to your front‑end code for quick reference.*
