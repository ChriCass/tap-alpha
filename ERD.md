# Diagrama Entidad-Relación — TAP-alpha Backend

```mermaid
erDiagram
    users ||--o{ orders : "hace"
    users ||--o{ sessions : tiene
    users ||--o{ personal_access_tokens : tiene

    products }o--|| categories : "pertenece a"
    products ||--o{ product_variants : "tiene variantes"
    products ||--o{ product_images : "tiene imágenes"
    products ||--o{ order_items : "aparece en"
    products }o--o{ collections : "pertenece a (N:N)"

    categories ||--o{ categories : "padre/hijos (self-ref)"

    collections ||--o{ collection_product : "pivote"
    products ||--o{ collection_product : "pivote"
    collection_product }o--|| collections : enlaza
    collection_product }o--|| products : enlaza

    product_variants ||--o{ order_items : "aparece en"

    orders ||--o{ order_items : "contiene"

    coupons {
        varchar code PK
        varchar type
        decimal value
        decimal min_purchase
        int max_uses
        int used_count
        datetime starts_at
        datetime expires_at
        boolean is_active
    }

    personal_access_tokens {
        bigint id PK
        varchar tokenable_type
        bigint tokenable_id
        varchar name
        varchar token UK
        text abilities
        datetime last_used_at
        datetime expires_at
    }

    users {
        bigint id PK
        varchar name
        varchar email UK
        varchar phone
        varchar role "default: customer"
        datetime email_verified_at
        varchar password
        varchar remember_token
    }

    products {
        bigint id PK
        varchar name
        varchar slug UK
        text description
        varchar vendor
        varchar product_type
        bigint category_id FK
        decimal base_price "10,2"
        decimal compare_at_price "10,2"
        decimal cost_per_item "10,2"
        boolean is_personalizable
        boolean track_inventory
        boolean continue_selling_when_out_of_stock
        varchar status "active|draft|archived"
        int channels_count
        int catalogs_count
        json tags
        varchar seo_title
        text seo_description
        datetime published_at
        datetime deleted_at "SoftDeletes"
    }

    product_variants {
        bigint id PK
        bigint product_id FK
        varchar sku UK
        varchar barcode
        varchar name
        decimal price_adjustment "10,2"
        int stock
        int position
        json attributes
    }

    product_images {
        bigint id PK
        bigint product_id FK
        varchar url
        varchar alt
        int position
    }

    categories {
        bigint id PK
        varchar name
        varchar slug UK
        text description
        bigint parent_id FK "self-ref (nullable)"
    }

    collections {
        bigint id PK
        varchar name
        varchar slug UK
        text description
        varchar image_url
        varchar type "manual|automatic"
        json rules "condiciones para auto"
        varchar rules_match "all|any"
        varchar sort_order
        int channels_count
        varchar theme_template
        varchar seo_title
        text seo_description
        datetime published_at
    }

    collection_product {
        bigint id PK
        bigint collection_id FK
        bigint product_id FK
        int position
        datetime created_at
        datetime updated_at
    }

    orders {
        bigint id PK
        bigint user_id FK "nullable (guest)"
        varchar customer_name
        varchar customer_email
        varchar status "pending|confirmed|shipped|etc"
        decimal subtotal "10,2"
        decimal tax "10,2"
        decimal shipping_cost "10,2"
        decimal total "10,2"
        json shipping_address
        text notes
        datetime deleted_at "SoftDeletes"
    }

    order_items {
        bigint id PK
        bigint order_id FK
        bigint product_id FK "nullable"
        bigint variant_id FK "nullable"
        varchar product_name "snapshot"
        varchar variant_name "snapshot"
        int quantity
        decimal unit_price "10,2"
        decimal total_price "10,2"
        json custom_design_snapshot "diseño 3D"
    }
```

## Leyenda

| Símbolo | Significado |
|---|---|
| `PK` | Primary Key |
| `FK` | Foreign Key |
| `UK` | Unique |
| `SoftDeletes` | Borrado lógico (`deleted_at`) |
| `N:N` | Relación muchos a muchos (usa pivote) |

## Integridad Referencial (ON DELETE)

| Tabla hija | Columna | Tabla padre | ON DELETE |
|---|---|---|---|
| `products` | `category_id` | `categories.id` | `SET NULL` |
| `product_variants` | `product_id` | `products.id` | `CASCADE` |
| `product_images` | `product_id` | `products.id` | `CASCADE` |
| `categories` | `parent_id` | `categories.id` | `SET NULL` |
| `collection_product` | `collection_id` | `collections.id` | `CASCADE` |
| `collection_product` | `product_id` | `products.id` | `CASCADE` |
| `orders` | `user_id` | `users.id` | `SET NULL` |
| `order_items` | `order_id` | `orders.id` | `CASCADE` |
| `order_items` | `product_id` | `products.id` | `SET NULL` |
| `order_items` | `variant_id` | `product_variants.id` | `SET NULL` |

## Notas

- **SoftDeletes**: Solo `products` y `orders` usan borrado lógico.
- **Coupon** no tiene relaciones FK; usa `applies_to_type` + `applies_to_ids` (JSON) para definir su alcance.
- **OrderItems** desnormaliza `product_name` y `variant_name` como snapshot histórico al momento de la compra.
- **collection_product** tiene constraint `UNIQUE(collection_id, product_id)` — un producto solo puede estar una vez en una colección.
- Las colecciones `automatic` resuelven dinámicamente sus productos vía `rules` (JSON) + `rules_match` (`all`/`any`), no requieren entradas en `collection_product`.
