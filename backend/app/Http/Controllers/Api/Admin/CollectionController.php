<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Collection;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class CollectionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = $this->filteredQuery($request);

        $this->applySort($query, $request->input('sort', 'created_desc'));

        $perPage = min((int) $request->input('per_page', 20), 100);
        $paginator = $query->paginate($perPage)->withQueryString();

        // El conteo de las automáticas se resuelve por reglas, no por el pivote.
        $paginator->getCollection()->transform(function (Collection $collection) {
            $collection->setAttribute('products_count', $collection->resolvedProducts()->count());

            return $collection;
        });

        return response()->json(array_merge($paginator->toArray(), [
            'counts' => $this->tabCounts($request),
        ]));
    }

    public function show(Collection $collection): JsonResponse
    {
        return response()->json([
            'data' => $this->present($collection),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $this->validatePayload($request);

        $productIds = $validated['product_ids'] ?? null;
        unset($validated['product_ids']);

        $validated['slug'] ??= $this->uniqueSlug($validated['name']);
        $validated['published_at'] ??= now();

        $collection = Collection::create($validated);

        if ($productIds !== null && ! $collection->isAutomatic()) {
            $this->syncProducts($collection, $productIds);
        }

        return response()->json(['data' => $this->present($collection)], 201);
    }

    public function update(Request $request, Collection $collection): JsonResponse
    {
        $validated = $this->validatePayload($request, $collection);

        $productIds = $validated['product_ids'] ?? null;
        unset($validated['product_ids']);

        $collection->update($validated);

        // Al pasar a automática la lista manual deja de aplicar y se descarta.
        if ($collection->isAutomatic()) {
            $collection->products()->detach();
        } elseif ($productIds !== null) {
            $this->syncProducts($collection, $productIds);
        }

        return response()->json(['data' => $this->present($collection->refresh())]);
    }

    public function destroy(Collection $collection): JsonResponse
    {
        $collection->delete();

        return response()->json(['message' => 'Colección eliminada']);
    }

    /**
     * Duplica una colección con sus reglas y sus productos asignados.
     */
    public function duplicate(Collection $collection): JsonResponse
    {
        $copy = $collection->replicate(['created_at', 'updated_at']);
        $copy->name = "{$collection->name} (copia)";
        $copy->slug = $this->uniqueSlug($copy->name);
        $copy->published_at = null;
        $copy->save();

        if (! $collection->isAutomatic()) {
            $pivot = $collection->products()
                ->pluck('collection_product.position', 'products.id')
                ->all();

            $copy->products()->attach(
                array_map(fn ($position) => ['position' => $position], $pivot),
            );
        }

        return response()->json(['data' => $this->present($copy)], 201);
    }

    public function bulk(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'action' => 'required|in:delete,publish,unpublish',
            'ids' => 'required|array|min:1',
            'ids.*' => 'integer|exists:collections,id',
        ]);

        $query = Collection::whereIn('id', $validated['ids']);

        $affected = match ($validated['action']) {
            'publish' => $query->update(['published_at' => now()]),
            'unpublish' => $query->update(['published_at' => null]),
            'delete' => $query->delete(),
        };

        return response()->json([
            'message' => "{$affected} colecciones actualizadas",
            'affected' => $affected,
        ]);
    }

    /**
     * Resuelve unas condiciones sin guardarlas: alimenta la vista previa del editor.
     */
    public function preview(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'rules' => 'nullable|array',
            'rules.*.field' => ['required', Rule::in(Collection::RULE_FIELDS)],
            'rules.*.operator' => ['required', Rule::in(Collection::RULE_OPERATORS)],
            'rules.*.value' => 'present|nullable|string|max:255',
            'rules_match' => 'in:all,any',
            'sort_order' => ['nullable', Rule::in(Collection::SORT_ORDERS)],
        ]);

        $draft = new Collection([
            'type' => 'automatic',
            'rules' => $validated['rules'] ?? [],
            'rules_match' => $validated['rules_match'] ?? 'all',
            'sort_order' => $validated['sort_order'] ?? 'best_selling',
        ]);

        $products = $draft->resolvedProducts()
            ->with(['images', 'variants'])
            ->limit(100)
            ->get();

        return response()->json([
            'data' => [
                'products_count' => $products->count(),
                'products' => $products,
            ],
        ]);
    }

    /**
     * Campos y operadores admitidos por el editor de condiciones.
     */
    public function ruleOptions(): JsonResponse
    {
        return response()->json([
            'data' => [
                'fields' => Collection::RULE_FIELDS,
                'operators' => Collection::RULE_OPERATORS,
                'sort_orders' => Collection::SORT_ORDERS,
            ],
        ]);
    }

    private function filteredQuery(Request $request, bool $withType = true): Builder
    {
        $query = Collection::query();

        if ($search = $request->input('search')) {
            $query->where(function (Builder $q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('slug', 'like', "%{$search}%");
            });
        }

        if ($withType && in_array($request->input('type'), ['manual', 'automatic'], true)) {
            $query->where('type', $request->input('type'));
        }

        return $query;
    }

    private function applySort(Builder $query, string $sort): void
    {
        match ($sort) {
            'title_asc' => $query->orderBy('name'),
            'title_desc' => $query->orderByDesc('name'),
            'created_asc' => $query->orderBy('created_at'),
            'updated_desc' => $query->orderByDesc('updated_at'),
            default => $query->orderByDesc('created_at'),
        };
    }

    /**
     * @return array<string, int>
     */
    private function tabCounts(Request $request): array
    {
        $base = fn () => $this->filteredQuery($request, withType: false);

        return [
            'all' => (clone $base())->count(),
            'manual' => (clone $base())->where('type', 'manual')->count(),
            'automatic' => (clone $base())->where('type', 'automatic')->count(),
        ];
    }

    /**
     * Añade a la colección sus productos resueltos y el conteo.
     *
     * @return array<string, mixed>
     */
    private function present(Collection $collection): array
    {
        $products = $collection->resolvedProducts()
            ->with(['images', 'variants'])
            ->limit(100)
            ->get();

        return array_merge($collection->toArray(), [
            'products_count' => $products->count(),
            'products' => $products,
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function validatePayload(Request $request, ?Collection $collection = null): array
    {
        $required = $collection ? 'sometimes|required' : 'required';

        return $request->validate([
            'name' => "{$required}|string|max:255",
            'slug' => [
                'nullable',
                'string',
                'max:255',
                Rule::unique('collections', 'slug')->ignore($collection?->id),
            ],
            'description' => 'nullable|string',
            'image_url' => 'nullable|string',
            'type' => 'in:manual,automatic',
            'rules' => 'nullable|array',
            'rules.*.field' => ['required', Rule::in(Collection::RULE_FIELDS)],
            'rules.*.operator' => ['required', Rule::in(Collection::RULE_OPERATORS)],
            'rules.*.value' => 'present|nullable|string|max:255',
            'rules_match' => 'in:all,any',
            'sort_order' => ['nullable', Rule::in(Collection::SORT_ORDERS)],
            'theme_template' => 'nullable|string|max:60',
            'seo_title' => 'nullable|string|max:255',
            'seo_description' => 'nullable|string',
            'published_at' => 'nullable|date',
            'product_ids' => 'nullable|array',
            'product_ids.*' => 'integer|exists:products,id',
        ]);
    }

    /**
     * @param  array<int, int>  $productIds
     */
    private function syncProducts(Collection $collection, array $productIds): void
    {
        $payload = [];

        foreach (array_values(array_unique($productIds)) as $position => $productId) {
            $payload[$productId] = ['position' => $position];
        }

        $collection->products()->sync($payload);
    }

    private function uniqueSlug(string $name): string
    {
        $base = Str::slug($name) ?: 'coleccion';
        $slug = $base;
        $suffix = 2;

        while (Collection::where('slug', $slug)->exists()) {
            $slug = "{$base}-{$suffix}";
            $suffix++;
        }

        return $slug;
    }
}
