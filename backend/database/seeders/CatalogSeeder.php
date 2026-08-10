<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Collection;
use App\Models\Product;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class CatalogSeeder extends Seeder
{
    public function run(): void
    {
        $categories = $this->seedCategories();
        $collections = $this->seedCollections();

        foreach ($this->catalog() as $index => $item) {
            $slug = Str::slug($item['name']);

            $product = Product::updateOrCreate(['slug' => $slug], [
                'name' => $item['name'],
                'description' => $item['description'],
                'vendor' => $item['vendor'],
                'product_type' => $item['type'],
                'base_price' => $item['price'],
                'compare_at_price' => $item['compare_at'] ?? null,
                'cost_per_item' => round($item['price'] * 0.45, 2),
                'is_personalizable' => $item['personalizable'] ?? true,
                'track_inventory' => $item['track'] ?? true,
                'continue_selling_when_out_of_stock' => false,
                'status' => $item['status'] ?? 'active',
                'channels_count' => $item['channels'] ?? 1,
                'catalogs_count' => $item['catalogs'] ?? 1,
                'tags' => $item['tags'] ?? [],
                'seo_title' => $item['name'].' | TAP',
                'seo_description' => Str::limit($item['description'], 150),
                'published_at' => ($item['status'] ?? 'active') === 'active' ? now()->subDays(60 - $index) : null,
                'category_id' => $categories[$item['category']] ?? null,
            ]);

            $product->collections()->sync(array_values(array_filter(array_map(
                fn (string $name) => $collections[$name] ?? null,
                array_merge([$item['collection']], $item['extra_collections'] ?? []),
            ))));

            // Los timestamps no son fillable: se fijan aparte para escalonar el catálogo.
            $product->forceFill([
                'created_at' => now()->subDays(60 - $index),
                'updated_at' => now()->subDays(random_int(0, 25)),
            ])->saveQuietly();

            $product->variants()->delete();
            $product->images()->delete();

            foreach (array_values($item['variants']) as $position => $variant) {
                $product->variants()->create([
                    'sku' => $variant['sku'],
                    'barcode' => '77'.str_pad((string) random_int(0, 99999999999), 11, '0', STR_PAD_LEFT),
                    'name' => $variant['name'],
                    'price_adjustment' => $variant['adjustment'] ?? 0,
                    'stock' => $variant['stock'],
                    'position' => $position,
                    'attributes' => $variant['attributes'] ?? [],
                ]);
            }

            $product->images()->create([
                'url' => $this->placeholderImage($item['name'], $item['color']),
                'alt' => $item['name'],
                'position' => 0,
            ]);
        }
    }

    /**
     * @return array<string, int>
     */
    private function seedCategories(): array
    {
        $names = ['Ropa', 'Accesorios', 'Hogar', 'Papelería', 'Tecnología', 'Tarjetas de regalo'];
        $ids = [];

        foreach ($names as $name) {
            $ids[$name] = Category::updateOrCreate(
                ['slug' => Str::slug($name)],
                ['name' => $name, 'description' => "Productos de {$name}"],
            )->id;
        }

        return $ids;
    }

    /**
     * @return array<string, int>
     */
    private function seedCollections(): array
    {
        $manual = [
            'Personalizables 3D' => 'Todo lo que se puede editar en el configurador 3D.',
            'Verano 2026' => 'Selección de temporada.',
            'Corporativo' => 'Pedidos por volumen para empresas.',
            'Más vendidos' => 'Los productos con mayor rotación.',
        ];

        // Automáticas: se llenan solas según las condiciones, como en Shopify.
        $automatic = [
            'Regalos hasta S/ 50' => [
                'description' => 'Ideas de regalo económicas.',
                'rules' => [
                    ['field' => 'price', 'operator' => 'less_than', 'value' => '50'],
                ],
                'rules_match' => 'all',
            ],
            'Selección premium' => [
                'description' => 'Productos de gama alta personalizables.',
                'rules' => [
                    ['field' => 'price', 'operator' => 'greater_than', 'value' => '100'],
                    ['field' => 'is_personalizable', 'operator' => 'equals', 'value' => '1'],
                ],
                'rules_match' => 'all',
            ],
        ];

        $ids = [];

        foreach ($manual as $name => $description) {
            $ids[$name] = Collection::updateOrCreate(['slug' => Str::slug($name)], [
                'name' => $name,
                'description' => $description,
                'type' => 'manual',
                'sort_order' => 'best_selling',
                'channels_count' => 2,
                'seo_title' => $name,
                'published_at' => now(),
            ])->id;
        }

        foreach ($automatic as $name => $config) {
            $ids[$name] = Collection::updateOrCreate(['slug' => Str::slug($name)], [
                'name' => $name,
                'description' => $config['description'],
                'type' => 'automatic',
                'rules' => $config['rules'],
                'rules_match' => $config['rules_match'],
                'sort_order' => 'price_asc',
                'channels_count' => 1,
                'seo_title' => $name,
                'published_at' => now(),
            ])->id;
        }

        return $ids;
    }

    /**
     * Miniatura SVG embebida: evita depender de imágenes externas en desarrollo.
     */
    private function placeholderImage(string $name, string $color): string
    {
        $initials = Str::upper(Str::substr(preg_replace('/[^A-Za-zÁÉÍÓÚÑ ]/u', '', $name), 0, 1));
        $words = preg_split('/\s+/', trim($name));
        if (count($words) > 1) {
            $initials .= Str::upper(Str::substr($words[1], 0, 1));
        }

        $svg = <<<SVG
        <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">
          <rect width="80" height="80" fill="{$color}"/>
          <rect width="80" height="40" fill="#ffffff" opacity="0.12"/>
          <text x="40" y="49" font-family="Inter, Helvetica, Arial, sans-serif" font-size="26"
                font-weight="600" fill="#ffffff" text-anchor="middle">{$initials}</text>
        </svg>
        SVG;

        return 'data:image/svg+xml;base64,'.base64_encode($svg);
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function catalog(): array
    {
        return [
            [
                'name' => 'Polo Personalizable Clásico',
                'description' => 'Polo de algodón pima 100% peruano, listo para personalizar con el editor 3D.',
                'vendor' => 'TAP Studio',
                'type' => 'polo',
                'category' => 'Ropa',
                'collection' => 'Personalizables 3D',
                'extra_collections' => ['Más vendidos'],
                'price' => 59.90,
                'compare_at' => 79.90,
                'color' => '#3f5b8c',
                'tags' => ['algodón', 'personalizable', 'unisex'],
                'variants' => [
                    ['sku' => 'POLO-CLA-S', 'name' => 'S / Blanco', 'stock' => 24, 'attributes' => ['Talla' => 'S', 'Color' => 'Blanco']],
                    ['sku' => 'POLO-CLA-M', 'name' => 'M / Blanco', 'stock' => 31, 'attributes' => ['Talla' => 'M', 'Color' => 'Blanco']],
                    ['sku' => 'POLO-CLA-L', 'name' => 'L / Negro', 'stock' => 28, 'attributes' => ['Talla' => 'L', 'Color' => 'Negro']],
                    ['sku' => 'POLO-CLA-XL', 'name' => 'XL / Negro', 'stock' => 17, 'adjustment' => 5, 'attributes' => ['Talla' => 'XL', 'Color' => 'Negro']],
                ],
            ],
            [
                'name' => 'Polo Oversize Premium',
                'description' => 'Corte oversize con caída amplia. Ideal para estampados grandes.',
                'vendor' => 'Andes Textiles',
                'type' => 'polo',
                'category' => 'Ropa',
                'collection' => 'Verano 2026',
                'price' => 79.90,
                'color' => '#6b4f8a',
                'tags' => ['oversize', 'premium'],
                'variants' => [
                    ['sku' => 'POLO-OVR-M', 'name' => 'M / Arena', 'stock' => 10, 'attributes' => ['Talla' => 'M', 'Color' => 'Arena']],
                    ['sku' => 'POLO-OVR-L', 'name' => 'L / Arena', 'stock' => 12, 'attributes' => ['Talla' => 'L', 'Color' => 'Arena']],
                    ['sku' => 'POLO-OVR-XL', 'name' => 'XL / Verde', 'stock' => 8, 'attributes' => ['Talla' => 'XL', 'Color' => 'Verde']],
                ],
            ],
            [
                'name' => 'Hoodie Personalizable',
                'description' => 'Polerón con capucha y bolsillo canguro, felpa perchada 320 g.',
                'vendor' => 'Andes Textiles',
                'type' => 'hoodie',
                'category' => 'Ropa',
                'collection' => 'Personalizables 3D',
                'extra_collections' => ['Más vendidos'],
                'price' => 129.90,
                'compare_at' => 159.90,
                'color' => '#2f6f5e',
                'tags' => ['invierno', 'personalizable'],
                'variants' => [
                    ['sku' => 'HOOD-PER-S', 'name' => 'S / Gris', 'stock' => 14, 'attributes' => ['Talla' => 'S', 'Color' => 'Gris']],
                    ['sku' => 'HOOD-PER-M', 'name' => 'M / Gris', 'stock' => 21, 'attributes' => ['Talla' => 'M', 'Color' => 'Gris']],
                    ['sku' => 'HOOD-PER-L', 'name' => 'L / Negro', 'stock' => 15, 'attributes' => ['Talla' => 'L', 'Color' => 'Negro']],
                ],
            ],
            [
                'name' => 'Taza Mágica 11oz',
                'description' => 'Taza que revela el diseño con el calor. Impresión por sublimación.',
                'vendor' => 'Cusco Print Co.',
                'type' => 'taza',
                'category' => 'Hogar',
                'collection' => 'Más vendidos',
                'extra_collections' => ['Verano 2026'],
                'price' => 34.90,
                'color' => '#a8462f',
                'tags' => ['sublimación', 'regalo'],
                'variants' => [
                    ['sku' => 'TAZA-MAG-11', 'name' => 'Default Title', 'stock' => 50],
                ],
            ],
            [
                'name' => 'Taza Cerámica Blanca',
                'description' => 'Clásica taza blanca de cerámica apta para lavavajillas.',
                'vendor' => 'Cusco Print Co.',
                'type' => 'taza',
                'category' => 'Hogar',
                'collection' => 'Más vendidos',
                'price' => 24.90,
                'color' => '#8d8d8d',
                'tags' => ['cerámica'],
                'variants' => [
                    ['sku' => 'TAZA-CER-11', 'name' => '11 oz', 'stock' => 120, 'attributes' => ['Tamaño' => '11 oz']],
                    ['sku' => 'TAZA-CER-15', 'name' => '15 oz', 'stock' => 80, 'adjustment' => 6, 'attributes' => ['Tamaño' => '15 oz']],
                ],
            ],
            [
                'name' => 'Gorra Bordada 3D',
                'description' => 'Gorra snapback con bordado 3D en la parte frontal.',
                'vendor' => 'Arequipa Craft',
                'type' => 'gorra',
                'category' => 'Accesorios',
                'collection' => 'Personalizables 3D',
                'price' => 49.90,
                'color' => '#334155',
                'tags' => ['bordado', 'snapback'],
                'variants' => [
                    ['sku' => 'GORR-3D-UNI', 'name' => 'Talla única', 'stock' => 20],
                ],
            ],
            [
                'name' => 'Tote Bag Ecológica',
                'description' => 'Bolsa de algodón crudo reutilizable, asas reforzadas.',
                'vendor' => 'Andes Textiles',
                'type' => 'tote bag',
                'category' => 'Accesorios',
                'collection' => 'Verano 2026',
                'price' => 39.90,
                'color' => '#7a6a4f',
                'tags' => ['eco', 'algodón'],
                'variants' => [
                    ['sku' => 'TOTE-ECO-STD', 'name' => 'Default Title', 'stock' => 0],
                ],
            ],
            [
                'name' => 'Mousepad XL Gamer',
                'description' => 'Superficie de tela con base antideslizante, 80 × 30 cm.',
                'vendor' => 'TAP Studio',
                'type' => 'mousepad',
                'category' => 'Tecnología',
                'collection' => 'Personalizables 3D',
                'price' => 45.00,
                'color' => '#1f2937',
                'tags' => ['gamer', 'escritorio'],
                'variants' => [
                    ['sku' => 'MPAD-XL-80', 'name' => 'Default Title', 'stock' => 7],
                ],
            ],
            [
                'name' => 'Sticker Pack Personalizado',
                'description' => 'Pack de 12 stickers de vinilo con corte a medida. Producción bajo demanda.',
                'vendor' => 'Cusco Print Co.',
                'type' => 'sticker',
                'category' => 'Papelería',
                'collection' => 'Personalizables 3D',
                'price' => 15.00,
                'color' => '#c2410c',
                'track' => false,
                'tags' => ['vinilo', 'bajo demanda'],
                'variants' => [
                    ['sku' => 'STCK-PACK-12', 'name' => 'Default Title', 'stock' => 0],
                ],
            ],
            [
                'name' => 'Llavero 3D Personalizado',
                'description' => 'Llavero impreso en 3D con el nombre o logo del cliente.',
                'vendor' => 'TAP Studio',
                'type' => 'llavero 3D',
                'category' => 'Accesorios',
                'collection' => 'Personalizables 3D',
                'extra_collections' => ['Más vendidos'],
                'price' => 19.90,
                'color' => '#0f766e',
                'tags' => ['impresión 3D', 'regalo'],
                'variants' => [
                    ['sku' => 'LLAV-3D-PLA', 'name' => 'PLA', 'stock' => 45, 'attributes' => ['Material' => 'PLA']],
                    ['sku' => 'LLAV-3D-RES', 'name' => 'Resina', 'stock' => 30, 'adjustment' => 8, 'attributes' => ['Material' => 'Resina']],
                ],
            ],
            [
                'name' => 'Cuaderno A5 Personalizado',
                'description' => 'Cuaderno cosido de 120 hojas con tapa dura personalizable.',
                'vendor' => 'Cusco Print Co.',
                'type' => 'cuaderno',
                'category' => 'Papelería',
                'collection' => 'Corporativo',
                'price' => 29.90,
                'color' => '#4338ca',
                'tags' => ['oficina', 'corporativo'],
                'variants' => [
                    ['sku' => 'CUAD-A5-RAY', 'name' => 'Rayado', 'stock' => 35, 'attributes' => ['Interior' => 'Rayado']],
                    ['sku' => 'CUAD-A5-PUN', 'name' => 'Punteado', 'stock' => 25, 'attributes' => ['Interior' => 'Punteado']],
                ],
            ],
            [
                'name' => 'Botella Térmica 500ml',
                'description' => 'Acero inoxidable de doble pared, mantiene la temperatura 12 horas.',
                'vendor' => 'Arequipa Craft',
                'type' => 'botella',
                'category' => 'Hogar',
                'collection' => 'Corporativo',
                'price' => 89.90,
                'compare_at' => 109.90,
                'color' => '#0369a1',
                'tags' => ['acero', 'corporativo'],
                'variants' => [
                    ['sku' => 'BOTE-TER-NEG', 'name' => 'Negro mate', 'stock' => 22, 'attributes' => ['Color' => 'Negro mate']],
                    ['sku' => 'BOTE-TER-PLA', 'name' => 'Plateado', 'stock' => 18, 'attributes' => ['Color' => 'Plateado']],
                ],
            ],
            [
                'name' => 'Polo Corporativo Bordado',
                'description' => 'Polo piqué con bordado del logo de la empresa. Pedido mínimo 20 unidades.',
                'vendor' => 'Andes Textiles',
                'type' => 'polo',
                'category' => 'Ropa',
                'collection' => 'Corporativo',
                'price' => 69.90,
                'status' => 'draft',
                'color' => '#475569',
                'personalizable' => false,
                'tags' => ['corporativo', 'bordado'],
                'variants' => [
                    ['sku' => 'POLO-COR-M', 'name' => 'M / Azul', 'stock' => 12, 'attributes' => ['Talla' => 'M', 'Color' => 'Azul']],
                    ['sku' => 'POLO-COR-L', 'name' => 'L / Azul', 'stock' => 8, 'attributes' => ['Talla' => 'L', 'Color' => 'Azul']],
                ],
            ],
            [
                'name' => 'Hoodie Edición Invierno',
                'description' => 'Edición limitada con forro polar interior. Lanzamiento en junio.',
                'vendor' => 'Andes Textiles',
                'type' => 'hoodie',
                'category' => 'Ropa',
                'collection' => 'Verano 2026',
                'price' => 149.90,
                'status' => 'draft',
                'color' => '#7c2d12',
                'tags' => ['edición limitada'],
                'variants' => [
                    ['sku' => 'HOOD-INV-M', 'name' => 'M / Vino', 'stock' => 9, 'attributes' => ['Talla' => 'M', 'Color' => 'Vino']],
                    ['sku' => 'HOOD-INV-L', 'name' => 'L / Vino', 'stock' => 6, 'attributes' => ['Talla' => 'L', 'Color' => 'Vino']],
                ],
            ],
            [
                'name' => 'Gift Card Digital',
                'description' => 'Tarjeta de regalo enviada por correo electrónico. Sin control de inventario.',
                'vendor' => 'TAP Studio',
                'type' => 'giftcard',
                'category' => 'Tarjetas de regalo',
                'collection' => 'Más vendidos',
                'price' => 100.00,
                'color' => '#b45309',
                'track' => false,
                'personalizable' => false,
                'tags' => ['digital', 'regalo'],
                'variants' => [
                    ['sku' => 'GIFT-100', 'name' => 'S/ 100', 'stock' => 0, 'attributes' => ['Monto' => 'S/ 100']],
                    ['sku' => 'GIFT-200', 'name' => 'S/ 200', 'stock' => 0, 'adjustment' => 100, 'attributes' => ['Monto' => 'S/ 200']],
                ],
            ],
            [
                'name' => 'Poster Personalizado A2',
                'description' => 'Impresión giclée en papel mate de 250 g. Aún sin publicar en la tienda.',
                'vendor' => 'Cusco Print Co.',
                'type' => 'poster',
                'category' => 'Papelería',
                'collection' => 'Personalizables 3D',
                'price' => 45.00,
                'color' => '#9333ea',
                'channels' => 0,
                'tags' => ['decoración'],
                'variants' => [
                    ['sku' => 'POST-A2-MAT', 'name' => 'Default Title', 'stock' => 35],
                ],
            ],
            [
                'name' => 'Mochila Urbana Personalizable',
                'description' => 'Descontinuada. Se mantiene archivada para el historial de órdenes.',
                'vendor' => 'Arequipa Craft',
                'type' => 'mochila',
                'category' => 'Accesorios',
                'collection' => 'Verano 2026',
                'price' => 179.90,
                'status' => 'archived',
                'color' => '#525252',
                'tags' => ['descontinuado'],
                'variants' => [
                    ['sku' => 'MOCH-URB-STD', 'name' => 'Default Title', 'stock' => 50],
                ],
            ],
            [
                'name' => 'Set Escritorio 3D',
                'description' => 'Organizador, portalápices y soporte de audífonos impresos en 3D.',
                'vendor' => 'TAP Studio',
                'type' => 'set',
                'category' => 'Tecnología',
                'collection' => 'Personalizables 3D',
                'price' => 249.90,
                'compare_at' => 299.90,
                'color' => '#0891b2',
                'tags' => ['impresión 3D', 'escritorio'],
                'variants' => [
                    ['sku' => 'SET-ESC-BAS', 'name' => 'Básico', 'stock' => 8, 'attributes' => ['Edición' => 'Básico']],
                    ['sku' => 'SET-ESC-PRO', 'name' => 'Pro', 'stock' => 4, 'adjustment' => 60, 'attributes' => ['Edición' => 'Pro']],
                ],
            ],
        ];
    }
}
