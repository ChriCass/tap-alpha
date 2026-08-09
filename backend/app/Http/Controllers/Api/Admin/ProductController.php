<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Product::with(['variants', 'images', 'collection']);

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('slug', 'like', "%{$search}%");
            });
        }

        $products = $query->latest()->paginate(20);

        return response()->json($products);
    }

    public function show(Product $product): JsonResponse
    {
        $product->load(['variants', 'images', 'collection']);

        return response()->json(['data' => $product]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'required|string|max:255|unique:products,slug',
            'description' => 'nullable|string',
            'base_price' => 'required|numeric|min:0',
            'is_personalizable' => 'boolean',
            'status' => 'in:draft,active,archived',
            'collection_id' => 'nullable|exists:collections,id',
        ]);

        $product = Product::create($validated);

        return response()->json(['data' => $product], 201);
    }

    public function update(Request $request, Product $product): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'string|max:255',
            'slug' => "string|max:255|unique:products,slug,{$product->id}",
            'description' => 'nullable|string',
            'base_price' => 'numeric|min:0',
            'is_personalizable' => 'boolean',
            'status' => 'in:draft,active,archived',
            'collection_id' => 'nullable|exists:collections,id',
        ]);

        $product->update($validated);
        $product->load(['variants', 'images', 'collection']);

        return response()->json(['data' => $product]);
    }

    public function destroy(Product $product): JsonResponse
    {
        $product->delete();

        return response()->json(['message' => 'Producto eliminado']);
    }
}
