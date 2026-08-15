<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Collection;
use App\Models\OrderItem;
use App\Models\Product;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ProductController extends Controller
{
    /** Estados de orden que no cuentan como venta realizada. */
    private const NON_SALE_STATUSES = ['cancelled', 'refunded'];

    /** Umbral por debajo del cual el inventario se considera bajo. */
    private const LOW_STOCK_THRESHOLD = 10;

    public function index(Request $request): JsonResponse
    {
        $query = $this->filteredQuery($request)
            ->with(['variants', 'images', 'collections', 'category']);

        $this->applySort($query, $request->input('sort', 'created_desc'));

        $perPage = min((int) $request->input('per_page', 20), 100);
        $paginator = $query->paginate($perPage)->withQueryString();

        return response()->json(array_merge($paginator->toArray(), [
            'counts' => $this->tabCounts($request),
        ]));
    }

    /**
     * Valores disponibles para los filtros del index (vendors, tipos, categorías…).
     */
    public function filterOptions(): JsonResponse
    {
        return response()->json([
            'data' => [
                'vendors' => Product::query()
                    ->whereNotNull('vendor')
                    ->distinct()
                    ->orderBy('vendor')
                    ->pluck('vendor'),
                // La categoría es la única taxonomía: se devuelve con la ruta
                // completa («Ropa › Polos») para que el filtro sea legible.
                'categories' => $this->categoryOptions(),
                'collections' => Collection::query()
                    ->orderBy('name')
                    ->get(['id', 'name']),
                'tags' => Product::query()
                    ->whereNotNull('tags')
                    ->pluck('tags')
                    ->flatten()
                    ->unique()
                    ->sort()
                    ->values(),
            ],
        ]);
    }

    /**
     * Categorías con su ruta jerárquica resuelta, ordenadas por esa ruta.
     *
     * @return array<int, array{id: int, name: string}>
     */
    private function categoryOptions(): array
    {
        $categories = Category::query()->get(['id', 'name', 'parent_id'])->keyBy('id');

        return $categories
            ->map(function (Category $category) use ($categories) {
                $parent = $category->parent_id ? $categories->get($category->parent_id) : null;

                return [
                    'id' => $category->id,
                    'name' => $parent ? "{$parent->name} › {$category->name}" : $category->name,
                ];
            })
            ->sortBy('name')
            ->values()
            ->all();
    }

    /**
     * Métricas de la cabecera: sell-through y días de inventario restante.
     */
    public function stats(Request $request): JsonResponse
    {
        $days = (int) $request->input('days', 30);
        $since = now()->subDays($days);

        $sales = OrderItem::query()
            ->select('product_id')
            ->selectRaw('SUM(quantity) as units')
            ->selectRaw('SUM(total_price) as revenue')
            ->whereHas('order', fn (Builder $q) => $q
                ->where('created_at', '>=', $since)
                ->whereNotIn('status', self::NON_SALE_STATUSES))
            ->whereNotNull('product_id')
            ->groupBy('product_id')
            ->get()
            ->keyBy('product_id');

        $products = Product::query()
            ->where('status', '!=', 'archived')
            ->with('variants:id,product_id,stock')
            ->get(['id', 'name', 'track_inventory']);

        $unitsSold = (int) $sales->sum('units');
        $onHand = $products->sum(fn (Product $p) => $p->track_inventory ? $p->total_inventory : 0);

        $sellThrough = ($unitsSold + $onHand) > 0
            ? round($unitsSold / ($unitsSold + $onHand) * 100, 1)
            : 0.0;

        // Días de inventario restante = stock / venta diaria promedio.
        $buckets = ['0-30' => 0, '30-60' => 0, '60-90' => 0, '90+' => 0, 'unknown' => 0];

        foreach ($products as $product) {
            if (! $product->track_inventory) {
                continue;
            }

            $dailyRate = ((float) ($sales[$product->id]->units ?? 0)) / max($days, 1);

            if ($dailyRate <= 0) {
                $buckets['unknown']++;

                continue;
            }

            $remaining = $product->total_inventory / $dailyRate;

            $key = match (true) {
                $remaining < 30 => '0-30',
                $remaining < 60 => '30-60',
                $remaining < 90 => '60-90',
                default => '90+',
            };

            $buckets[$key]++;
        }

        return response()->json([
            'data' => [
                'days' => $days,
                'sell_through_rate' => $sellThrough,
                'units_sold' => $unitsSold,
                'units_on_hand' => $onHand,
                'days_of_inventory' => $buckets,
            ],
        ]);
    }

    public function show(Product $product): JsonResponse
    {
        $product->load(['variants', 'images', 'collections', 'category']);

        return response()->json(['data' => $product]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $this->validatePayload($request);

        $variants = $validated['variants'] ?? null;
        $images = $validated['images'] ?? null;
        $collectionIds = $validated['collection_ids'] ?? null;
        unset($validated['variants'], $validated['images'], $validated['collection_ids']);

        $validated['slug'] ??= $this->uniqueSlug($validated['name']);

        if (($validated['status'] ?? 'draft') === 'active' && empty($validated['published_at'])) {
            $validated['published_at'] = now();
        }

        $product = Product::create($validated);

        if ($variants !== null) {
            $this->syncVariants($product, $variants);
        } else {
            // Shopify siempre crea una variante por defecto para poder llevar stock.
            $product->variants()->create([
                'sku' => Str::upper(Str::slug($product->slug)).'-DEFAULT',
                'name' => 'Default Title',
                'price_adjustment' => 0,
                'stock' => 0,
                'position' => 0,
                'attributes' => [],
            ]);
        }

        if ($images !== null) {
            $this->syncImages($product, $images);
        }

        if ($collectionIds !== null) {
            $product->collections()->sync($collectionIds);
        }

        $product->load(['variants', 'images', 'collections', 'category']);

        return response()->json(['data' => $product], 201);
    }

    public function update(Request $request, Product $product): JsonResponse
    {
        $validated = $this->validatePayload($request, $product);

        $variants = $validated['variants'] ?? null;
        $images = $validated['images'] ?? null;
        $collectionIds = $validated['collection_ids'] ?? null;
        unset($validated['variants'], $validated['images'], $validated['collection_ids']);

        if (($validated['status'] ?? $product->status) === 'active' && ! $product->published_at) {
            $validated['published_at'] = now();
        }

        $product->update($validated);

        if ($variants !== null) {
            $this->syncVariants($product, $variants);
        }

        if ($images !== null) {
            $this->syncImages($product, $images);
        }

        if ($collectionIds !== null) {
            $product->collections()->sync($collectionIds);
        }

        $product->refresh()->load(['variants', 'images', 'collections', 'category']);

        return response()->json(['data' => $product]);
    }

    public function destroy(Product $product): JsonResponse
    {
        $product->delete();

        return response()->json(['message' => 'Producto eliminado']);
    }

    /**
     * Acciones masivas de la barra de selección (activar, archivar, eliminar…).
     */
    public function bulk(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'action' => 'required|in:activate,draft,archive,delete,personalizable_on,personalizable_off',
            'ids' => 'required|array|min:1',
            'ids.*' => 'integer|exists:products,id',
        ]);

        $query = Product::whereIn('id', $validated['ids']);

        $affected = match ($validated['action']) {
            'activate' => $query->update(['status' => 'active', 'published_at' => now()]),
            'draft' => $query->update(['status' => 'draft']),
            'archive' => $query->update(['status' => 'archived']),
            'personalizable_on' => $query->update(['is_personalizable' => true]),
            'personalizable_off' => $query->update(['is_personalizable' => false]),
            'delete' => $query->delete(),
        };

        return response()->json([
            'message' => "{$affected} productos actualizados",
            'affected' => $affected,
        ]);
    }

    /**
     * Aplica búsqueda y filtros comunes al listado.
     */
    private function filteredQuery(Request $request, bool $withStatus = true): Builder
    {
        $query = Product::query()->search($request->input('search'));

        if ($withStatus && $request->filled('status') && $request->input('status') !== 'all') {
            $query->where('status', $request->input('status'));
        }

        if ($values = $this->listParam($request, 'vendor')) {
            $query->whereIn('vendor', $values);
        }

        if ($values = $this->listParam($request, 'category_id')) {
            $query->whereIn('category_id', $values);
        }

        // Las colecciones son N a N: se filtra por el pivote.
        if ($values = $this->listParam($request, 'collection_id')) {
            $query->whereHas(
                'collections',
                fn (Builder $q) => $q->whereIn('collections.id', $values),
            );
        }

        if ($tags = $this->listParam($request, 'tag')) {
            $query->where(function (Builder $q) use ($tags) {
                foreach ($tags as $tag) {
                    $q->orWhere('tags', 'like', '%"'.$tag.'"%');
                }
            });
        }

        if ($request->filled('personalizable')) {
            $query->where('is_personalizable', $request->boolean('personalizable'));
        }

        if ($stock = $request->input('stock')) {
            $this->applyStockFilter($query, $stock);
        }

        return $query;
    }

    private function applyStockFilter(Builder $query, string $stock): void
    {
        $stockSum = fn () => DB::table('product_variants')
            ->selectRaw('COALESCE(SUM(stock), 0)')
            ->whereColumn('product_variants.product_id', 'products.id');

        match ($stock) {
            'not_tracked' => $query->where('track_inventory', false),
            'out_of_stock' => $query->where('track_inventory', true)
                ->whereRaw('('.$stockSum()->toSql().') <= 0'),
            'low_stock' => $query->where('track_inventory', true)
                ->whereRaw('('.$stockSum()->toSql().') BETWEEN 1 AND '.self::LOW_STOCK_THRESHOLD),
            'in_stock' => $query->where('track_inventory', true)
                ->whereRaw('('.$stockSum()->toSql().') > 0'),
            default => null,
        };
    }

    private function applySort(Builder $query, string $sort): void
    {
        match ($sort) {
            'title_asc' => $query->orderBy('name'),
            'title_desc' => $query->orderByDesc('name'),
            'created_asc' => $query->orderBy('created_at'),
            'updated_desc' => $query->orderByDesc('updated_at'),
            'updated_asc' => $query->orderBy('updated_at'),
            'price_asc' => $query->orderBy('base_price'),
            'price_desc' => $query->orderByDesc('base_price'),
            'inventory_asc' => $query->withSum('variants as stock_total', 'stock')->orderBy('stock_total'),
            'inventory_desc' => $query->withSum('variants as stock_total', 'stock')->orderByDesc('stock_total'),
            default => $query->orderByDesc('created_at'),
        };
    }

    /**
     * @return array<string, int>
     */
    private function tabCounts(Request $request): array
    {
        $base = fn () => $this->filteredQuery($request, withStatus: false);

        return [
            'all' => (clone $base())->count(),
            'active' => (clone $base())->where('status', 'active')->count(),
            'draft' => (clone $base())->where('status', 'draft')->count(),
            'archived' => (clone $base())->where('status', 'archived')->count(),
        ];
    }

    /**
     * Lee un parámetro que puede venir como `?vendor=a,b` o `?vendor[]=a&vendor[]=b`.
     *
     * @return array<int, string>
     */
    private function listParam(Request $request, string $key): array
    {
        $raw = $request->input($key);

        if ($raw === null || $raw === '') {
            return [];
        }

        return array_values(array_filter(
            is_array($raw) ? $raw : explode(',', $raw),
            fn ($value) => $value !== '' && $value !== null,
        ));
    }

    /**
     * @return array<string, mixed>
     */
    private function validatePayload(Request $request, ?Product $product = null): array
    {
        $required = $product ? 'sometimes|required' : 'required';
        $slugRule = 'nullable|string|max:255|unique:products,slug'.($product ? ",{$product->id}" : '');

        return $request->validate([
            'name' => "{$required}|string|max:255",
            'slug' => $slugRule,
            'description' => 'nullable|string',
            'vendor' => 'nullable|string|max:255',
            'base_price' => "{$required}|numeric|min:0",
            'compare_at_price' => 'nullable|numeric|min:0',
            'cost_per_item' => 'nullable|numeric|min:0',
            'is_personalizable' => 'boolean',
            'track_inventory' => 'boolean',
            'status' => 'in:draft,active,archived',
            'tags' => 'nullable|array',
            'tags.*' => 'string|max:60',
            'seo_title' => 'nullable|string|max:255',
            'seo_description' => 'nullable|string',
            'collection_ids' => 'nullable|array',
            'collection_ids.*' => 'integer|exists:collections,id',
            'category_id' => 'nullable|exists:categories,id',
            'variants' => 'nullable|array',
            'variants.*.id' => 'nullable|integer',
            'variants.*.sku' => 'nullable|string|max:255',
            'variants.*.name' => 'required|string|max:255',
            'variants.*.price_adjustment' => 'numeric',
            'variants.*.stock' => 'integer|min:0',
            'variants.*.attributes' => 'nullable|array',
            'images' => 'nullable|array',
            'images.*.id' => 'nullable|integer',
            'images.*.url' => 'required|string',
            'images.*.alt' => 'nullable|string|max:255',
        ]);
    }

    /**
     * Crea, actualiza y elimina variantes para dejarlas idénticas al payload.
     *
     * @param  array<int, array<string, mixed>>  $variants
     */
    private function syncVariants(Product $product, array $variants): void
    {
        $keptIds = [];

        foreach (array_values($variants) as $position => $variant) {
            $payload = [
                'sku' => $variant['sku'] ?? null,
                'name' => $variant['name'],
                'price_adjustment' => $variant['price_adjustment'] ?? 0,
                'stock' => $variant['stock'] ?? 0,
                'position' => $position,
                'attributes' => $variant['attributes'] ?? [],
            ];

            $existing = empty($variant['id'])
                ? null
                : $product->variants()->whereNotIn('id', $keptIds)->find($variant['id']);

            if ($existing) {
                $existing->update($payload);
                $keptIds[] = $existing->id;

                continue;
            }

            $keptIds[] = $product->variants()->create($payload)->id;
        }

        $product->variants()->whereNotIn('id', $keptIds)->delete();
    }

    /**
     * Igual que syncVariants pero para la galería: el orden lo define el array.
     *
     * @param  array<int, array<string, mixed>>  $images
     */
    private function syncImages(Product $product, array $images): void
    {
        $keptIds = [];

        foreach (array_values($images) as $position => $image) {
            $payload = [
                'url' => $image['url'],
                'alt' => $image['alt'] ?? null,
                'position' => $position,
            ];

            $existing = empty($image['id'])
                ? null
                : $product->images()->whereNotIn('id', $keptIds)->find($image['id']);

            if ($existing) {
                $existing->update($payload);
                $keptIds[] = $existing->id;

                continue;
            }

            $keptIds[] = $product->images()->create($payload)->id;
        }

        $product->images()->whereNotIn('id', $keptIds)->delete();
    }

    private function uniqueSlug(string $name): string
    {
        $base = Str::slug($name);
        $slug = $base;
        $suffix = 2;

        while (Product::withTrashed()->where('slug', $slug)->exists()) {
            $slug = "{$base}-{$suffix}";
            $suffix++;
        }

        return $slug;
    }
}
