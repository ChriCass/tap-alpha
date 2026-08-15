<?php

namespace App\Http\Controllers\Api\Store;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * API pública de solo lectura para el catálogo: sin auth, y solo expone lo
 * que un visitante de la tienda debería ver (Product::published()).
 */
class ProductController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $products = Product::query()
            ->published()
            ->search($request->input('search'))
            ->with(['category', 'images' => fn ($q) => $q->orderBy('position')])
            ->latest('published_at')
            ->paginate(12);

        return response()->json($products->through(fn (Product $product) => $this->present($product)));
    }

    public function show(string $slug): JsonResponse
    {
        $product = Product::query()
            ->published()
            ->where('slug', $slug)
            ->with(['category', 'images', 'variants'])
            ->firstOrFail();

        return response()->json(['data' => $this->present($product, withVariants: true)]);
    }

    private function present(Product $product, bool $withVariants = false): array
    {
        return [
            'id' => $product->id,
            'name' => $product->name,
            'slug' => $product->slug,
            'description' => $product->description,
            'vendor' => $product->vendor,
            'base_price' => $product->base_price,
            'compare_at_price' => $product->compare_at_price,
            'is_personalizable' => $product->is_personalizable,
            'category' => $product->category
                ? ['id' => $product->category->id, 'name' => $product->category->name]
                : null,
            'images' => $product->images->map(fn ($image) => [
                'id' => $image->id,
                'url' => $image->url,
                'alt' => $image->alt,
            ])->values(),
            'variants' => $withVariants
                ? $product->variants->map(fn ($variant) => [
                    'id' => $variant->id,
                    'name' => $variant->name,
                    'price' => round((float) $product->base_price + $variant->price_adjustment, 2),
                    'in_stock' => ! $product->track_inventory || $variant->stock > 0,
                    'attributes' => $variant->attributes,
                ])->values()
                : [],
        ];
    }
}
