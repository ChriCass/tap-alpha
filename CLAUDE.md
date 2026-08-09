# TAP-alpha — Plataforma de E-commerce con Personalización 3D

## Visión general

Plataforma de comercio electrónico con **personalización de productos en 3D**, **constructor visual de tiendas** y **panel de administración** (Shopify comprimido). Proyecto académico para el TAP (Trabajo de Aplicación Profesional) del Instituto del Sur (ISUR), Arequipa, Perú.

### Módulos del proyecto

| Módulo | Descripción | Estado |
|---|---|---|
| **Admin Panel** | CRUD productos, variantes, colecciones, órdenes, clientes, cupones, analytics | En desarrollo |
| **Storefront** | Tienda pública: catálogo, PDP, carrito, checkout | Pendiente |
| **Customizer 3D** | Editor 3D de productos con Three.js, IA generativa | Pendiente |
| **Store Builder** | Constructor visual drag & drop de tiendas | Pendiente |

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | React 19 + TypeScript + Vite |
| 3D | Three.js + @react-three/fiber + @react-three/drei |
| Backend | Laravel 12 (API RESTful) |
| Auth API | Laravel Sanctum (token-based) |
| BD | SQLite (desarrollo) / MySQL o PostgreSQL (producción) |
| Estilos | Tailwind CSS (via @tailwindcss/vite) |
| Routing | React Router DOM v7 |

---

## Estructura del monorepo

```
TAP-alpha/
├── backend/                    # Laravel 12 API
│   ├── app/
│   │   ├── Http/Controllers/Api/
│   │   │   ├── AuthController.php
│   │   │   └── Admin/
│   │   │       ├── ProductController.php
│   │   │       ├── CollectionController.php
│   │   │       ├── OrderController.php
│   │   │       ├── CustomerController.php
│   │   │       ├── CouponController.php
│   │   │       └── AnalyticsController.php
│   │   └── Models/
│   │       ├── User.php
│   │       ├── Product.php
│   │       ├── ProductVariant.php
│   │       ├── ProductImage.php
│   │       ├── Collection.php
│   │       ├── Category.php
│   │       ├── Order.php
│   │       ├── OrderItem.php
│   │       └── Coupon.php
│   ├── database/migrations/
│   ├── routes/api.php
│   └── .env
│
├── apps/
│   └── admin/                  # React admin panel
│       └── src/
│           ├── components/
│           │   ├── ui/         # Button, Input, Card (atómicos)
│           │   ├── forms/      # FormField, SelectField
│           │   ├── layout/     # Sidebar, Navbar
│           │   └── common/     # LoadingSpinner, ErrorBoundary
│           ├── config/         # Configuración (firebase, etc.)
│           ├── layouts/        # AdminLayout, AuthLayout
│           ├── pages/
│           │   ├── auth/       # LoginPage
│           │   └── admin/      # Dashboard, Products, Orders, ...
│           ├── hooks/          # useAuth (context + provider)
│           ├── services/       # api.ts (ApiClient)
│           ├── types/          # Interfaces TypeScript
│           ├── App.tsx         # React Router
│           └── main.tsx        # Entry point
│
├── packages/
│   └── shared/                 # Tipos compartidos entre apps
│       └── src/
│           ├── index.ts
│           └── types.ts
│
├── propuesta-tap.md            # Documento de propuesta original
└── CLAUDE.md                   # Este archivo
```

### Convención de estructura para todos los frontends

```
src/
├── components/                 # Componentes compartidos de la app
│   ├── ui/                     # Atómicos (sin lógica de negocio)
│   │   ├── button/
│   │   │   ├── button.tsx
│   │   │   └── index.ts
│   │   └── index.ts            # Barrel
│   ├── forms/                  # Formularios/validaciones
│   ├── layout/                 # Sidebar, Navbar, Footer
│   └── common/                 # LoadingSpinner, ErrorBoundary
├── config/                     # Firebase, etc.
├── layouts/                    # admin.layout.tsx, auth.layout.tsx, public.layout.tsx
├── pages/
│   ├── admin/                  # dashboard.page.tsx, products.page.tsx, ...
│   ├── auth/                   # login.page.tsx
│   └── public/                 # (para el storefront futuro)
├── hooks/                      # Custom hooks
├── services/                   # Clientes API
├── types/                      # Tipos TypeScript
├── App.tsx                     # React Router
└── main.tsx                    # Entry point
```

---

## Backend: Laravel API

### Iniciar el servidor

```bash
cd backend
php artisan serve           # http://localhost:8000
```

### Rutas API

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| POST | `/api/auth/login` | No | Login (retorna token) |
| GET | `/api/auth/me` | Sanctum | Usuario autenticado |
| POST | `/api/auth/logout` | Sanctum | Cerrar sesión |
| GET/POST/PUT/DELETE | `/api/admin/products` | Sanctum | CRUD productos |
| GET/POST/PUT/DELETE | `/api/admin/collections` | Sanctum | CRUD colecciones |
| GET | `/api/admin/orders` | Sanctum | Listar órdenes |
| GET | `/api/admin/orders/{id}` | Sanctum | Ver orden |
| PATCH | `/api/admin/orders/{id}/status` | Sanctum | Cambiar estado |
| GET | `/api/admin/customers` | Sanctum | Listar clientes |
| GET/POST/PUT/DELETE | `/api/admin/coupons` | Sanctum | CRUD cupones |
| GET | `/api/admin/analytics` | Sanctum | Dashboard analytics |

### Usuario de prueba

```
Email: admin@tap.com
Password: password
```

### Base de datos

- Desarrollo: SQLite (`database/database.sqlite`)
- Migraciones: `php artisan migrate`
- Seeds: `php artisan db:seed`

### Tablas

- `users` — Admin users (Sanctum auth)
- `products` — Productos con soft deletes
- `product_variants` — Variantes (SKU, stock, precio, atributos JSON)
- `product_images` — Imágenes por producto
- `collections` — Colecciones manuales/automáticas
- `categories` — Categorías jerárquicas
- `orders` — Órdenes con soft deletes
- `order_items` — Items de orden (con snapshot de diseño personalizado)
- `coupons` — Cupones de descuento
- `personal_access_tokens` — Tokens de Sanctum

---

## Frontend: Admin Panel (React)

### Iniciar

```bash
cd apps/admin
npm install
npm run dev                # http://localhost:5173
```

El proxy de Vite redirige `/api/*` a `http://localhost:8000`.

### Páginas del Admin

| Ruta | Página | Archivo |
|---|---|---|
| `/login` | Login | `pages/auth/login.page.tsx` |
| `/admin` | Dashboard (KPIs + top products) | `pages/admin/dashboard.page.tsx` |
| `/admin/products` | CRUD productos con búsqueda y paginación | `pages/admin/products.page.tsx` |
| `/admin/collections` | Colecciones (grid de cards) | `pages/admin/collections.page.tsx` |
| `/admin/orders` | Órdenes con filtro por estado | `pages/admin/orders.page.tsx` |
| `/admin/customers` | Clientes con búsqueda | `pages/admin/customers.page.tsx` |
| `/admin/coupons` | Cupones de descuento | `pages/admin/coupons.page.tsx` |
| `/admin/analytics` | Gráficos y métricas | `pages/admin/analytics.page.tsx` |
| `/admin/settings` | Configuración de tienda | `pages/admin/settings.page.tsx` |

### Auth flow

1. `AuthProvider` envuelve toda la app (usa React Context)
2. Al montar, verifica si hay token en localStorage y llama a `/api/auth/me`
3. Si hay token válido, setea el usuario. Si no, limpia.
4. `ProtectedRoute` redirige a `/login` si no hay usuario
5. `GuestRoute` redirige a `/admin` si ya hay sesión
6. El token se envía como `Bearer` en cada request
7. Si el backend responde 401, se limpia el token y redirige a `/login`

### ApiClient (`services/api.ts`)

Clase singleton que maneja todas las llamadas HTTP:
- `get<T>()`, `post<T>()`, `put<T>()`, `patch<T>()`, `delete<T>()`
- `upload<T>()` (multipart/form-data sin Content-Type header)
- Auto-attach del Bearer token
- Auto-redirect en 401

### Convenciones de componentes

- Cada componente en su carpeta: `components/ui/button/button.tsx`
- Tailwind CSS para estilos (clases utilitarias directamente en JSX)
- Barrel file: `index.ts` re-exporta el componente
- Props tipadas con `interface`
- Mínimo uso de librerías externas (solo react-router-dom)

---

## Próximos pasos

1. ~~Backend Laravel + Admin API~~ Completado
2. ~~Admin Panel React~~ Completado
3. Storefront React (catálogo, PDP, carrito, checkout)
4. Customizer 3D (integrar arquitectura de low-osb)
5. Store Builder (drag & drop)
6. Integraciones de IA

## Comandos útiles

```bash
# Backend
cd backend && php artisan serve

# Admin frontend
cd apps/admin && npm run dev

# TypeScript check
cd apps/admin && npx tsc --noEmit

# Lint (cuando se configure)
cd apps/admin && npm run lint

# Migraciones fresh con seed
cd backend && php artisan migrate:fresh --seed
```
