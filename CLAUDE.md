# TAP-alpha — Plataforma de E-commerce con Personalización 3D

## Visión general

Plataforma de comercio electrónico con **personalización de productos en 3D**, **constructor visual de tiendas** y **panel de administración** (Shopify comprimido). Proyecto académico para el TAP (Trabajo de Aplicación Profesional) del Instituto del Sur (ISUR), Arequipa, Perú.

### Módulos del proyecto

| Módulo | Descripción | Estado |
|---|---|---|
| **Admin Panel** | CRUD productos, variantes, colecciones, órdenes, clientes, cupones, analytics | En desarrollo |
| **Storefront** | Tienda pública: catálogo, PDP, carrito, checkout | Catálogo listo (sin carrito/checkout) |
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
│           │   ├── layout/     # Header, Sidebar, GlobalSearch
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
│   └── storefront/              # React storefront (tienda pública, catálogo)
│       └── src/
│           ├── layouts/        # StorefrontLayout (Header + Footer)
│           ├── pages/          # HomePage, ProductDetailPage
│           ├── components/layout/
│           ├── services/       # api.ts (fetch simple, sin auth)
│           ├── types/
│           ├── App.tsx
│           └── main.tsx
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
| GET | `/api/store/settings` | No | Nombre/contacto de la tienda para el storefront |
| GET | `/api/store/products` | No | Catálogo público: solo `Product::published()` (activo + ya publicado) |
| GET | `/api/store/products/{slug}` | No | Detalle de producto público, con variantes |
| GET | `/api/store/collections` | No | Colecciones publicadas |
| GET | `/api/store/collections/{slug}` | No | Colección + sus productos publicados |
| GET | `/api/admin/search?q=` | Sanctum | Búsqueda global (Ctrl+K): productos, colecciones, órdenes, clientes, cupones |
| GET/POST/PUT/DELETE | `/api/admin/products` | Sanctum | CRUD productos (sincroniza variantes e imágenes) |
| GET | `/api/admin/products/filters` | Sanctum | Valores para filtros (proveedores, categorías, colecciones, tags) |
| GET | `/api/admin/products/stats` | Sanctum | Métricas: sell-through y días de inventario restante |
| POST | `/api/admin/products/bulk` | Sanctum | Acciones masivas (activate, draft, archive, delete, personalizable_on/off) |
| GET/POST/PUT/DELETE | `/api/admin/collections` | Sanctum | CRUD colecciones (manuales y automáticas) |
| GET | `/api/admin/collections/rule-options` | Sanctum | Campos, operadores y criterios de orden admitidos |
| POST | `/api/admin/collections/preview` | Sanctum | Resuelve condiciones sin guardarlas (vista previa en vivo) |
| POST | `/api/admin/collections/bulk` | Sanctum | Acciones masivas (publish, unpublish, delete) |
| POST | `/api/admin/collections/{id}/duplicate` | Sanctum | Duplica la colección con sus reglas y productos |
| GET | `/api/admin/orders` | Sanctum | Listar órdenes |
| GET | `/api/admin/orders/{id}` | Sanctum | Ver orden |
| PATCH | `/api/admin/orders/{id}/status` | Sanctum | Cambiar estado |
| GET | `/api/admin/customers` | Sanctum | Listar clientes |
| GET/POST/PUT/DELETE | `/api/admin/coupons` | Sanctum | CRUD cupones |
| GET | `/api/admin/analytics` | Sanctum | Dashboard analytics |
| GET/PUT | `/api/admin/store-settings` | Sanctum | Datos de la tienda (singleton, fila única id=1) |

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
- `products` — Productos con soft deletes. Además de los campos base incluye `vendor`,
  `category_id`, `compare_at_price`, `cost_per_item`, `track_inventory`, `tags` (JSON),
  `seo_title`, `seo_description` y `published_at`
- `product_variants` — Variantes (SKU opcional y **no único**, stock, ajuste de precio,
  posición, atributos JSON). El inventario cuelga de la variante, no del producto: el
  sistema la identifica por `variant_id` (lo que guarda `order_items`), el SKU es solo
  una etiqueta para humanos
- `categories` — Jerárquicas vía `parent_id` y **única taxonomía de clasificación**: bajan
  a nivel de hoja («Ropa › Polos») porque no existe `product_type`
- `product_images` — Imágenes por producto
- `collections` — Manuales o automáticas. Las automáticas guardan sus condiciones en
  `rules` (JSON con `field`/`operator`/`value`) más `rules_match` (`all`/`any`); el motor
  que las traduce a consulta vive en `Collection::matchingProductsQuery()`. También tienen
  `image_url`, `sort_order`, `theme_template`, SEO y `published_at`
- `collection_product` — Pivote N a N entre colecciones y productos, con `position`.
  Un producto puede estar en varias colecciones (no existe `products.collection_id`)
- `orders` — Órdenes con soft deletes
- `order_items` — Items de orden (con snapshot de diseño personalizado)
- `coupons` — Cupones de descuento
- `store_settings` — Singleton (una sola fila, id 1) con nombre/email/teléfono/dirección de
  la tienda. `StoreSetting::current()` la crea si no existe. Alimenta el nombre real que
  muestra la card "Tienda online" del Dashboard
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
| `/admin` | Dashboard (card "Tienda online" + KPIs + top products) | `pages/admin/dashboard.page.tsx` |
| `/admin/products` | Índice estilo Shopify: métricas, tabs, filtros, columnas configurables, acciones masivas | `pages/admin/products.page.tsx` |
| `/admin/products/new` | Alta de producto (mismo editor) | `pages/admin/product-detail.page.tsx` |
| `/admin/products/:id` | Editor de producto estilo Polaris (precios, inventario, variantes, SEO, organización) | `pages/admin/product-detail.page.tsx` |
| `/admin/collections` | Índice estilo Shopify con columna de condiciones | `pages/admin/collections.page.tsx` |
| `/admin/collections/new` | Alta de colección (mismo editor) | `pages/admin/collection-detail.page.tsx` |
| `/admin/collections/:id` | Editor: items, condiciones, plantilla, SEO | `pages/admin/collection-detail.page.tsx` |
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

### Capa visual Polaris (productos y colecciones)

Los módulos de productos y colecciones replican el admin de Shopify. Viven en carpetas
propias:

- `components/polaris/` — primitivas con la estética de Shopify: `PButton`, `PCard`, `Badge`,
  `Checkbox`, `Popover`, `TextField`, `PSelect`, `Modal`, `Icon`, `useToast`, `PolarisFrame`, `PPage`.
- `components/products/` — piezas del módulo: `ProductInsights`, `ProductToolbar`,
  `ProductIndexTable`, `ProductImportModal`, `InventoryCell`, `ProductStatusBadge`, `ProductThumbnail`.
- `components/collections/` — `CollectionIndexTable`, `CollectionToolbar`, `CollectionItemsCard`,
  `ConditionsEditor`, `ProductPickerModal` y `rules.ts` (etiquetas y operadores válidos por campo).

Los tokens de color y sombra están en `src/index.css` dentro de `@theme` (`bg-shell`,
`text-ink-sub`, `border-line`, `shadow-(--shadow-card)`, etc.). `PolarisFrame` cancela el
padding del `AdminLayout` para que el lienzo gris llegue a los bordes.

El chrome global también sigue la estética Shopify actual y usa la paleta `gray-*` de
Tailwind directamente (no los tokens `@theme` de `components/polaris`, que son solo para el
lienzo de productos/colecciones):

- `components/layout/header.tsx` — barra superior fija, negra (`bg-[#1a1a1a]`), a todo lo
  ancho (por encima del sidebar y del contenido). Marca TAP, botón de búsqueda con badge
  "CTRL K" (abre `GlobalSearch`; el atajo `Ctrl/Cmd+K` también funciona desde cualquier
  página) y avatar con `Popover` (Configuración, Cerrar sesión).
- `components/layout/sidebar.tsx` — fijo debajo del header (`top-14`), blanco con borde
  derecho (`border-gray-200`), iconos de línea de `polaris/icon` (`home`, `bag`, `inventory`,
  `folder`, `person`, `tag`, `chart`, `settings`) y estado activo con fondo `bg-gray-100`.
- `components/layout/global-search.tsx` — paleta de comandos (Ctrl+K): pide a
  `GET /api/admin/search?q=` (debounce 250 ms), agrupa resultados por categoría con conteos,
  guarda búsquedas recientes en `localStorage` (`tap_recent_searches`) y navega al recurso
  real (`/admin/products/:id`, `/admin/collections/:id`; órdenes y cupones — sin vista de
  detalle todavía — abren su índice; clientes abre `/admin/customers?q=`).

El antiguo `navbar.tsx` (barra blanca secundaria) se eliminó: sus funciones (menú móvil,
identidad del usuario) las absorbió `header.tsx`.

### Convenciones de componentes

- Cada componente en su carpeta: `components/ui/button/button.tsx`
- Tailwind CSS para estilos (clases utilitarias directamente en JSX)
- Barrel file: `index.ts` re-exporta el componente
- Props tipadas con `interface`
- Mínimo uso de librerías externas (solo react-router-dom)

---

## Frontend: Storefront (React)

Tienda pública de solo catálogo (sin cuenta, sin carrito, sin checkout todavía). Es una
app separada de `apps/admin`, con su propio `package.json`, pero comparte el mismo backend
Laravel a través de las rutas públicas `/api/store/*` (sin Sanctum).

### Iniciar

```bash
cd apps/storefront
npm install
npm run dev                # http://localhost:5174
```

El proxy de Vite redirige `/api/*` a `http://localhost:8000`, igual que en `apps/admin`.

### Páginas

| Ruta | Página | Archivo |
|---|---|---|
| `/` | Catálogo: hero, buscador, grilla de productos paginada | `pages/home.page.tsx` |
| `/productos/:slug` | Detalle: imágenes, precio, variantes, descripción | `pages/product-detail.page.tsx` |

`StorefrontLayout` carga el nombre de la tienda una vez (`GET /api/store/settings`) y lo
pasa a `Header`/`Footer`. Solo se ven productos y colecciones que pasan
`Product::published()` / `Collection::published()` (backend): status `active` y
`published_at` ya cumplido — los borradores y archivados del admin nunca llegan aquí.

### Cómo se conecta con el Admin Panel

Ambas apps son clientes independientes del mismo backend, como dos personas que llaman a
la misma cocina por puertas distintas: el Admin entra por la puerta con llave
(`/api/admin/*`, requiere Sanctum) y puede escribir; el Storefront entra por la puerta sin
llave (`/api/store/*`, pública) y solo puede leer lo publicado. La card "Tienda online" del
Dashboard (`/admin`) enlaza a `VITE_STOREFRONT_URL` (por defecto `http://localhost:5174`)
para abrir la tienda real en una pestaña nueva.

La cajita de la card no es un mockup: `useStorefrontStatus` (en `dashboard.page.tsx`) le
hace un `fetch(url, { mode: "no-cors" })` a la storefront al cargar el Dashboard. Si
responde, se ve un `<iframe>` real de la tienda encogido (`transform: scale(...)`, sin
interacción); si no responde, la card lo dice ("Sin conexión" / "Tienda no disponible
ahora") en vez de mostrar un iframe roto — nunca finge un estado que no es el real.

---

## Próximos pasos

1. ~~Backend Laravel + Admin API~~ Completado
2. ~~Admin Panel React~~ Completado
3. Storefront React — catálogo listo; falta carrito y checkout
4. Customizer 3D (integrar arquitectura de low-osb)
5. Store Builder (drag & drop)
6. Integraciones de IA

## Comandos útiles

```bash
# Backend
cd backend && php artisan serve

# Admin frontend
cd apps/admin && npm run dev

# Storefront (tienda pública)
cd apps/storefront && npm run dev

# TypeScript check
cd apps/admin && npx tsc --noEmit

# Lint (cuando se configure)
cd apps/admin && npm run lint

# Migraciones fresh con seed
cd backend && php artisan migrate:fresh --seed
```
