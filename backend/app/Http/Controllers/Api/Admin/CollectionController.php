<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Collection;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CollectionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $collections = Collection::withCount('products')
            ->latest()
            ->paginate(20);

        return response()->json($collections);
    }

    public function show(Collection $collection): JsonResponse
    {
        $collection->loadCount('products');

        return response()->json(['data' => $collection]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'required|string|max:255|unique:collections,slug',
            'description' => 'nullable|string',
            'type' => 'in:manual,automatic',
            'rules' => 'nullable|array',
        ]);

        $collection = Collection::create($validated);

        return response()->json(['data' => $collection], 201);
    }

    public function update(Request $request, Collection $collection): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'string|max:255',
            'slug' => "string|max:255|unique:collections,slug,{$collection->id}",
            'description' => 'nullable|string',
            'type' => 'in:manual,automatic',
            'rules' => 'nullable|array',
        ]);

        $collection->update($validated);
        $collection->loadCount('products');

        return response()->json(['data' => $collection]);
    }

    public function destroy(Collection $collection): JsonResponse
    {
        $collection->delete();

        return response()->json(['message' => 'Colección eliminada']);
    }
}
