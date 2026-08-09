# Propuesta de Trabajo de Aplicación Profesional (TAP)

> **Institución:** Instituto del Sur (ISUR) — Arequipa, Perú  
> **Carrera:** Computación e Informática  
> **Duración estimada:** 12 meses  
> **Modalidad:** Individual o grupal (1-2 integrantes unidisciplinario)  
> **Costo:** S/ 1,500 (pago único al aprobar el tema)

---

## 1. Idea del proyecto

Una **plataforma de comercio electrónico con personalización de productos en 3D y constructor visual de tiendas**.

En otras palabras: un sistema donde un emprendedor puede **crear su tienda online desde cero** (arrastrando secciones, eligiendo colores y fuentes, sin tocar código) y luego vender productos que sus clientes pueden **personalizar en 3D en tiempo real** (cambiar colores, agregar imágenes, texto, y recibir sugerencias de la IA).

---

## 2. Stack tecnológico (referencia: low-osb)

Tomamos como base el stack probado del proyecto **Look Our Way (low-osb)**, adaptándolo:

| Capa | Tecnología | Rol |
|---|---|---|
| **Frontend** | React 19 + TypeScript | Interfaz de usuario |
| **3D** | Three.js + @react-three/fiber + @react-three/drei | Editor 3D de productos |
| **Backend** | Laravel (API RESTful) | Auth, productos, órdenes, diseño de plantillas |
| **Build** | Vite | Empaquetado y dev server |
| **Testing** | Vitest + Testing Library | Pruebas unitarias e integración |
| **BD** | MySQL / PostgreSQL | Almacenamiento relacional |
| **Pasarela de pago** | Culqi / Mercado Pago / Stripe | Cobros |

<div style="page-break-after: always;"></div>

---

## 3. Arquitectura del proyecto de referencia — Look Our Way (low-osb)

A continuación se explica en detalle cómo funciona internamente low-osb, ya que la mayor parte de su arquitectura será adaptada al nuevo proyecto. Entender esto es crítico para saber **qué se hereda, qué se adapta y qué se construye desde cero**.

---

### 3.1 Capas de la arquitectura

low-osb está organizado en **capas bien separadas**, de abajo hacia arriba:

```
┌──────────────────────────────────────────────────────────┐
│  CAPA 4: UI (React)                                      │
│  DesignerPage · Workspace · DesignerView · Viewer3D      │
│  PanelDisplay · PanelOverlay · ToolRail                  │
├──────────────────────────────────────────────────────────┤
│  CAPA 3: Pipeline de pintado                             │
│  painter.ts · paintSubscriber.ts · resolver.ts           │
│  (Rasteriza diseños en canvas y sincroniza con 3D)       │
├──────────────────────────────────────────────────────────┤
│  CAPA 2: Stores (estado de sesión)                       │
│  designStore · canvasStore · linkGraph · history         │
│  imageLibrary · currentPaint · dragState                 │
│  (Objetos planos con subscribe, sin React, sin backend)  │
├──────────────────────────────────────────────────────────┤
│  CAPA 1: Catálogo de productos (metadatos)               │
│  ProductV2 · SessionCatalog · cartEntryResolver          │
│  (Cada producto se define como metadata tipada)          │
├──────────────────────────────────────────────────────────┤
│  CAPA 0: Datos remotos (Xano)                            │
│  projectClient · productClient · authClient              │
│  TanStack Query → hooks en useProjects.ts                │
└──────────────────────────────────────────────────────────┘
```

<div style="page-break-after: always;"></div>

### 3.2 Las Stores: el corazón del editor

low-osb **no usa Redux ni Zustand**. Todo el estado interno se maneja con **objetos planos + patrón subscribe**, creados mediante factory functions. Esto los hace 100% testeables y libres de dependencias.

| Store | Responsabilidad | Ejemplo |
|---|---|---|
| `designStore` | Guarda lo que el usuario dibujó en cada panel: colores de fondo, formas, textos, imágenes. Es el **estado canónico** del diseño. | `designStore.get(canvasId)` devuelve un `CanvasDesign` (capas en orden z, colores, coordenadas). |
| `canvasStore` | Guarda el `HTMLCanvasElement` con los píxeles pintados. Cada vez que cambia el diseño, se repinta el canvas y se incrementa un contador de revisión. | `canvasStore.acquire(canvasId, width, height)` obtiene o crea un canvas. |
| `linkGraph` | Define qué paneles son espejos de otros. Ej: en un toldo de 4 lados, si el usuario dibuja en el frente, los otros 3 se actualizan solos. | `linkGraph.setSource(panelB, panelA)` → panelB refleja a panelA. |
| `history` | Pila de undo/redo (100 pasos). Cada "commit" guarda una foto del `designStore` + `linkGraph`. | `history.commit(() => { ... })` agrupa varias operaciones en un solo paso de deshacer. |
| `imageLibrary` | Registro de imágenes subidas por el usuario (data URLs → eventualmente URLs de almacenamiento). | `imageLibrary.add(dataUrl)` devuelve un ID de imagen. |
| `currentPaint` | Estado de la barra de herramientas: color actual, grosor de trazo, modo (dibujar, seleccionar, texto). | `currentPaint.setFill("#FF0000")` |
| `dragState` | Booleano: ¿hay un arrastre en progreso? Se usa para pausar las subidas de textura a la GPU durante el drag. | `dragState.set(true)` → el visor 3D acumula cambios y los aplica de una vez al soltar. |

Todas las stores comparten el mismo contrato:
```ts
// Toda store sigue este patrón
const store = createSomeStore();
store.subscribe((event) => { /* reaccionar */ });  // devuelve función para desuscribirse
store.get(...);   // leer
store.set(...);   // escribir
```

<div style="page-break-after: always;"></div>

### 3.3 Flujo completo: "abro el editor hasta que compro"

#### Paso 1 — Entrada (handoff desde la tienda)

1. El usuario hace clic en "Personalizar" en la página de producto de Shopify.
2. Shopify redirige a `low-osb.com/designer?shopify_customer_id=...&shopify_product_id=...`
3. `DesignerPage` interpreta los parámetros de la URL.
4. Intercambia el `shopify_customer_id` por un token de sesión de Xano.
5. Busca el producto en Xano por su ID numérico de Shopify.

#### Paso 2 — Carga del proyecto y la sesión

6. Si el usuario tiene un proyecto guardado, se descarga el **snapshot** desde Xano.
   - Un snapshot es un JSON puro con: diseños por panel, imágenes, selecciones de variante.
   - Se aplica el snapshot a las stores → el editor se restaura exactamente como estaba.

7. Si es nuevo, se crea una sesión vacía:
   - Se carga la **definición del producto** (qué superficies tiene, qué variantes, qué addons).
   - Se cargan los **SVGs de geometría** de cada panel (los polígonos que definen las áreas editables).
   - Se compila un `BindingPlan`: a cada combinación de (producto, instancia, superficie) se le asigna un `canvasId` único.
   - Se inicializan diseños por defecto (colores base de cada subpanel).
   - Se configura el grafo de vínculos (qué paneles son espejos de otros, según las políticas del producto).
   - Solo cuando todo está listo (`status: "ready"`), el editor se monta en pantalla.

#### Paso 3 — Edición en vivo

**Panel izquierdo (editor 2D):**

8. El usuario elige colores, agrega formas, texto, sube imágenes.
9. Cada acción llama a `designStore.update(canvasId, mutador)` dentro de `history.commit(...)`.
   - `history.commit` agrupa una ráfaga de operaciones en un solo paso de deshacer.
10. La store de diseño notifica al **paint subscriber**.
11. El paint subscriber ejecuta `paintDesignToCanvas(canvas, panel, design)`:
    - Rellena los polígonos de cada subpanel con su color.
    - Dibuja cada objeto de arte (rectángulos, elipses, textos, imágenes) en orden z.
    - Recorta todo a la silueta del panel.
12. El canvas píxel a píxel se guarda en `canvasStore` y se incrementa su revisión.
13. `PanelDisplay` (el componente React del panel izquierdo) detecta el bump de revisión y vuelve a dibujar el canvas en pantalla.
14. Para paneles vinculados: el paint subscriber **copia los píxeles** del canvas fuente al canvas seguidor (no re-rastreriza, es un `drawImage` directo para eficiencia).

**Panel derecho (visor 3D):**

15. `Viewer3D` monta los modelos GLB (archivos 3D del producto) usando `useGLTF` de Three.js.
16. `usePaintTextures()` recorre cada malla del modelo 3D:
    - Encuentra a qué superficie editable corresponde (por nombre del ancestro en la escena).
    - Busca el canvas de esa superficie en `canvasStore`.
    - Crea una `THREE.CanvasTexture` a partir del canvas y la asigna como `material.map`.
17. Se suscribe a `canvasStore.subscribe(canvasId, ...)`.
    - Cuando el canvas se repinta (paso 12), detecta el bump de revisión.
    - Establece `texture.needsUpdate = true` → Three.js sube la nueva textura a la GPU.
18. **Optimización durante arrastres:** mientras el usuario arrastra un objeto en el editor 2D, `dragState` está en `true`. El visor 3D **acumula** las actualizaciones y las aplica todas juntas al soltar. Esto evita que la GPU se sature.

#### Paso 4 — Guardado (snapshot)

19. Periódicamente (o al hacer clic en "Guardar"), se llama a `buildSnapshot()`:
    - Captura el estado del `designStore` (todos los diseños por canvas).
    - Captura el `linkGraph` (relaciones de espejo).
    - Captura la `imageLibrary` (imágenes subidas).
    - Captura selecciones de variante (Xano UUIDs).
    - Las imágenes grandes se externalizan al almacenamiento de Xano.
20. El snapshot (JSON puro) se envía a Xano. Es portable: podría guardarse en PostgreSQL, S3 o IndexedDB.

#### Paso 5 — Al carrito (checkout)

21. El usuario hace clic en "Revisar pedido".
22. `buildV2CartPayload()` ejecuta la función `pricing()` del producto:
    - Calcula el precio del producto principal + addons + hardware.
    - Traduce IDs internos (V2 strings) a UUIDs de Xano.
23. `submitProjectAsShopifyBundle()`:
    - Crea un formulario HTML oculto.
    - Lo envía por POST al Shopify App Proxy.
    - Shopify recibe el bundle y redirige al carrito con `shop.com/cart/<variant_id>:1`.

<div style="page-break-after: always;"></div>

### 3.4 El pipeline de renderizado 3D

```
[designStore]
     │  update(canvasId, mutador)
     ▼
[painter.ts]  ──► pinta sobre HTMLCanvasElement
     │
     ▼
[canvasStore]  ──► guarda el canvas + bumpRevision()
     │                │
     │                ├──► [PanelDisplay]   (editor 2D izquierdo)
     │                │    se suscribe → blit pixels al canvas visible
     │                │
     │                └──► [usePaintTextures]  (visor 3D derecho)
     │                     se suscribe → CanvasTexture → material.map
     │                     texture.needsUpdate = true → GPU
     ▼
[Viewer3D]
  ├── <SceneRig>           (iluminación, sombras, fondo)
  ├── <CameraController>   (órbita, zoom, auto-encuadre)
  └── <GlbComposer>
       └── <MountedGlb>    (uno por cada instancia del producto)
            ├── useGLTF(glbUrl)       (carga el modelo 3D cacheado)
            ├── usePaintTextures()    (vincula canvas → texturas)
            └── useMeshColors()       (colores sólidos para partes no editables)
```

**Resolución de GLBs:**  
Cada variante del producto declara un `profileId` y `axisSelection`. El sistema busca en el catálogo de texturas el archivo GLB correspondiente. Al guardar, las URLs resueltas se cachean en el snapshot para que el visor cargue instantáneamente al reabrir.

<div style="page-break-after: always;"></div>

### 3.5 Patrones de diseño clave

| Patrón | Cómo se usa en low-osb | Por qué importa |
|---|---|---|
| **Store + subscribe** | `designStore`, `canvasStore`, etc. son factories que devuelven objetos con `get/set/subscribe`. Sin React, sin Redux. | Las stores son 100% testeables sin DOM. Se pueden reutilizar tal cual con cualquier framework. |
| **Factory functions** | `createSession()`, `createDesignStore()`, etc. Cada test recibe instancias aisladas. | Permite testing determinista y evita estado global compartido. |
| **Tipos inmutables** | `CanvasDesign`, `ArtObject`, `Panel`, `SnapshotV2` — todos `Readonly<>`. Las mutaciones devuelven objetos nuevos. | Previene bugs por mutación accidental. Hace el undo/redo trivial (guardar snapshots). |
| **Comando/Consulta separados** | Stores tienen `get()`/`set()`/`update()` sin efectos secundarios. El paint subscriber es el único observador. | El diseño (JSON) es la verdad. Los píxeles son derivados. Un snapshot guarda diseño, no píxeles. |
| **Transacciones** | `history.beginTransaction()` / `endTransaction()` con contador de referencia. | Una ráfaga de ediciones = un solo paso de deshacer. |
| **IDs internos vs UUIDs externos** | Todo dentro de `src/v2/` usa IDs string estables (`"canopy"`, `"canopy_10x10"`). Los UUIDs de Xano solo aparecen en la frontera (handoff al carrito). | Cambiar de backend solo requiere reescribir las funciones de traducción en la frontera. |
| **Espacio de coordenadas normalizado** | Todas las posiciones de objetos están en `[0, 1]` (porcentaje del panel). | El mismo diseño sobrevive a cambios de variante donde cambia el tamaño del canvas. |
| **Seed-override** | El catálogo tiene valores por defecto (`seed`) y Xano puede sobrescribirlos (`xano`). | Permite modificar productos en producción sin desplegar código. |
| **Canvas como fuente de píxeles** | Los píxeles siempre son una vista derivada. El diseño (JSON) es el estado canónico. | Los snapshots son livianos (KB, no MB). Las imágenes grandes se guardan aparte. |

<div style="page-break-after: always;"></div>

### 3.6 Por qué esta arquitectura es portable a un backend Laravel

1. **El modelo interno es backend-agnóstico.** Todo en `src/v2/` opera con IDs string estables. Los UUIDs de Xano solo aparecen al traducir productos y al enviar el carrito. Para migrar a Laravel, solo se reescriben esas funciones de frontera.

2. **Los metadatos de producto son TypeScript puro.** Cada producto (`canopy.ts`, `featherFlag.ts`) es un objeto tipado que declara superficies, variantes, ejes, addons, políticas de vínculo y pricing. No depende de ningún esquema de base de datos.

3. **El catálogo de sesión es un puente.** `SessionCatalog` se construye una vez a partir de los datos del backend. Su `cartEntryResolver` por producto es el **único** punto que mapea variantes internas a SKUs del backend.

4. **El snapshot es JSON portable.** `buildSnapshot()` produce un documento JSON puro. Puede guardarse en PostgreSQL (JSONB), S3, o donde sea.

5. **Las stores no dependen de nada.** `designStore`, `canvasStore`, `linkGraph`, `history` son TypeScript puro. Cero imports de React, TanStack Query o cualquier cliente HTTP. Pesan ~0KB en dependencias externas. Se pueden copiar y pegar al nuevo proyecto.

6. **El pipeline de pintado es backend-agnóstico.** `paintDesignToCanvas(canvas, panel, design)` recibe objetos en memoria. No sabe nada de bases de datos, auth ni HTTP.

7. **La capa Xano es delgada.** `src/data/database/xano/` son solo funciones `fetch()` + wrappers de TanStack Query. Reemplazar eso por llamadas a Laravel es cuestión de cambiar el endpoint y el formato de respuesta.

8. **El handoff PDP está desacoplado.** `useShopifyHandoff()` interpreta parámetros de URL y los traduce a configuración V2. La página simulada (`SimulatePdpPage`) genera handoffs sin Shopify ni Xano — prueba de que la capa de entrada es intercambiable.

9. **El envío al carrito es un solo punto.** `submitProjectAsShopifyBundle()` crea un `<form>` oculto y hace POST. Cambiar el checkout por otro sistema implica tocar solo ese archivo.

10. **La exportación PDF es datos puros → PDF.** `generatePrintPdf(panel, design, images)` produce un PDF sin acoplarse a ningún backend.

<div style="page-break-after: always;"></div>

---

## 4. Arquitectura de la plataforma propuesta

```
┌─────────────────────────────────────────────────────────────────┐
│                     LARAVEL API RESTful                          │
│  Auth · Productos · Órdenes · Diseños · Templates · Usuarios     │
│  IA (recomendaciones + generación de diseños) · Pasarela pago    │
└──────┬────────────────────┬────────────────────┬─────────────────┘
       │                    │                    │
       ▼                    ▼                    ▼
┌──────────────┐  ┌──────────────────┐  ┌─────────────────────────┐
│  STOREFRONT  │  │ CUSTOMIZER 3D    │  │  STORE BUILDER          │
│  (React)     │  │ de PRODUCTOS     │  │  (React + DnD)          │
│              │  │ (Three.js)       │  │                         │
│ • Catálogo   │  │                  │  │ • Drag & drop sections  │
│ • PDP        │  │ • Editor 3D      │  │ • Elegir layout         │
│ • Carrito    │  │ • Subir diseños  │  │ • Colores / fuentes     │
│ • Checkout   │  │ • IA generativa  │  │ • Hero, productos,      │
│ • Mi cuenta  │  │ • Preview en vivo│  │   footer, testimonios   │
│              │  │ • Agregar a 🛒   │  │ • Preview en vivo       │
│              │  │ • Exportar PDF   │  │ • Guardar template      │
└──────┬───────┘  └────────┬─────────┘  └────────────┬────────────┘
       │                   │                         │
       │    "Personalizar" │                         │
       │──────────────────▶│                         │
       │                   │                         │
       │    "Al carrito"   │                         │
       │◀──────────────────│                         │
       │                   │                         │
       ▼                   ▼                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                       ADMIN PANEL (React)                        │
│  CRUD productos · Import/export · Colecciones · Categorías      │
│  Variantes (tallas, colores) · Inventario · Órdenes · Clientes  │
│  Cupones/descuentos · Analytics · Configuración de tienda       │
│  (Un Shopify comprimido con lo esencial)                        │
└─────────────────────────────────────────────────────────────────┘
```

<div style="page-break-after: always;"></div>

---

## 5. Flujo de actores

### Dueño de tienda

> Entra al **Store Builder** → arma su tienda arrastrando secciones → elige colores, tipografía, logo → guarda.  
> Luego entra al **Admin** → crea productos base (ej. botellas, zapatillas, fundas) con sus variantes (tallas, colores) e inventario → configura qué partes son personalizables → crea colecciones, categorías, cupones → revisa analytics → gestiona órdenes y clientes.  
> El Admin funciona como un **Shopify comprimido**: tiene lo esencial para operar una tienda sin la complejidad y el costo de Shopify.

### Cliente final

> Navega el **Storefront** → ve productos → hace clic en "Personalizar" → se abre el **Customizer 3D** → elige colores, sube imágenes, escribe texto, la **IA le sugiere diseños** → preview en vivo con giro 360° → "Agregar al carrito" → vuelve a la tienda → **checkout** → paga.

---

## 6. Los 4 módulos principales

### A. Storefront (Tienda pública)

- Catálogo de productos con filtros y búsqueda
- Página de producto (PDP) con galería, variantes, precios
- Carrito de compras con cantidades
- Checkout con pasarela de pago
- Mi cuenta (historial de pedidos, datos personales)

### B. Customizer 3D de productos (corazón del proyecto)

- Visualización del producto en **3D con rotación 360°**
- Edición por capas (color base, gráficos, texto, patrones)
- Subida de imágenes del cliente
- **IA generativa:** el cliente describe un diseño ("flores azules tropicales") y la IA lo genera
- **IA de recomendación:** sugiere productos complementarios
- Sistema de **snapshots** (guardar un diseño en progreso)
- Exportación del diseño final (PDF / imagen)
- Handoff al carrito de la tienda

### C. Store Builder (constructor visual de tiendas)

- **Drag & drop** de secciones predefinidas (hero banner, grid de productos, testimonios, footer, etc.)
- Personalización visual (colores, fuentes, logo, espaciados)
- Preview en vivo mientras se edita
- Sistema de **templates** (plantillas base para distintos rubros)
- Guardado y publicación automática

### D. Admin Panel (gestión de tienda — Shopify comprimido)

- **CRUD de productos** con variantes (talla, color, material), SKU, precio, inventario
- **Importación masiva** de productos vía CSV / Excel
- **Colecciones y categorías** (manuales y automáticas por reglas)
- **Gestión de órdenes** (flujo completo: pendiente → confirmado → enviado → entregado)
- **Gestión de clientes** con historial de compras
- **Cupones y descuentos** (porcentaje, monto fijo, por producto/colección)
- **Analytics** (ventas, productos más vendidos, tasa de conversión)
- **Configuración** de tienda (datos fiscales, envíos, notificaciones por email)

<div style="page-break-after: always;"></div>

---

## 7. La IA en la plataforma

| Módulo | Función de la IA | Cómo funciona |
|---|---|---|
| **Customizer 3D** | Generación de diseños | El usuario escribe un prompt ("motivo floral vintage"), se envía a una API de generación de imágenes (DALL-E / Stable Diffusion), y la imagen resultante se aplica como textura sobre el modelo 3D del producto. |
| **Storefront** | Recomendaciones | Basado en el historial de navegación y compra, se sugieren productos que podrían interesarle al cliente. |
| **Store Builder** | Sugerencia de layouts | La IA propone configuraciones de secciones según el rubro de la tienda (ropa, tecnología, accesorios). |

---

## 8. Cronograma estimado (12 meses)

| Meses | Actividad | Entregable |
|---|---|---|
| **1-2** | Backend Laravel base + APIs del Admin | Auth, CRUD productos/variantes, colecciones, categorías, órdenes, clientes, cupones, setup DevOps |
| **3-4** | Storefront React | Catálogo, PDP, carrito, checkout con pasarela de pago |
| **5-7** | Customizer 3D | Editor 3D con Three.js, snapshots, integración con tienda |
| **8** | Store Builder | Drag & drop de secciones, preview en vivo, templates |
| **9** | Integración de IA | Generación de diseños + recomendaciones |
| **10-11** | Admin Panel (UI) + testing | CRUD visual de productos, import CSV, gestión de colecciones/categorías, bandeja de órdenes, cupones, analytics dashboard, configuración de tienda. Pruebas unitarias y funcionales |
| **12** | Documentación y sustentación | Informe TAP, presentación, defensa |

---

## 9. Lo que se adapta de low-osb vs. lo nuevo

| Se adapta de low-osb | Se construye desde cero |
|---|---|
| Arquitectura del editor 3D (canvas, stores, snapshots) | Backend Laravel completo |
| Sistema de capas y diseño gráfico sobre producto | Storefront (catálogo, PDP, carrito, checkout) |
| Exportación PDF | Store Builder (drag & drop) |
| Historial undo/redo | Panel de administración |
| Handoff carrito-diseño | Pasarela de pago peruana |
| Patrón de stores con `subscribe` | Integraciones de IA |
| | Admin Panel completo (CRUD productos, colecciones, órdenes, analytics, cupones) |

---

## 10. Nichos de negocio objetivo

La plataforma es **multirubro**, pero estos son ejemplos iniciales:

| Rubro | Producto ejemplo | ¿Qué se personaliza? |
|---|---|---|
| **Bebidas / estilo de vida** | Botellas y tumblers (tipo Stanley) | Color, grabado láser simulado, texto, logos |
| **Calzado** | Zapatillas urbanas | Color por panel (puntera, talón, suela, cordones), estampados |
| **Tecnología** | Fundas de celular | Foto del cliente, patrones, material, color de borde |

---

## 11. Justificación

En el mercado peruano actual, la mayoría de tiendas online ofrecen productos genéricos sin opción de personalización visual. Al mismo tiempo, los emprendedores que quieren vender en línea dependen de marketplaces que no les permiten construir una identidad de marca propia, o de herramientas como Shopify que requieren conocimientos técnicos y tienen costos en dólares.

Este proyecto propone:

1. **Resolver la personalización de productos** con una experiencia 3D que el cliente puede manipular en tiempo real, algo que ninguna plataforma peruana ofrece actualmente.
2. **Democratizar la creación de tiendas online** mediante un constructor visual que no requiere saber programar.
3. **Incorporar inteligencia artificial** como asistente tanto para el cliente (generando diseños) como para el dueño (sugiriendo layouts), reduciendo la fricción en ambas puntas.
