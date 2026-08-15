<?php

namespace App\Http\Controllers\Api\Store;

use App\Http\Controllers\Controller;
use App\Models\Collection;
use App\Models\Product;
use Illuminate\Http\JsonResponse;

class CollectionController extends Controller
{
    public function index(): JsonResponse
    {
        $collections = Collection::query()->published()->get();

        return response()->json([
            'data' => $collections->map(fn (Collection $collection) => [
                'id' => $collection->id,
                'name' => $collection->name,
                'slug' => $collection->slug,
                'description' => $collection->description,
                'image_url' => $collection->image_url,
            ])->values(),
        ]);
    }

    public function show(string $slug): JsonResponse
    {
        $collection = Collection::query()->published()->where('slug', $slug)->firstOrFail();

        $products = $collection->resolvedProducts()
            ->published()
            ->with(['category', 'images' => fn ($q) => $q->orderBy('position')])
            ->paginate(24);

        return response()->json([
            'data' => [
                'id' => $collection->id,
                'name' => $collection->name,
                'slug' => $collection->slug,
                'description' => $collection->description,
                'image_url' => $collection->image_url,
            ],
            'products' => $products->through(fn (Product $product) => [
                'id' => $product->id,
                'name' => $product->name,
                'slug' => $product->slug,
                'vendor' => $product->vendor,
                'base_price' => $product->base_price,
                'compare_at_price' => $product->compare_at_price,
                'image_url' => $product->images->first()?->url,
            ]),
        ]);
    }
}
