<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Theme;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ThemeController extends Controller
{
    public function index(): JsonResponse
    {
        $themes = Theme::orderByDesc('is_active')->orderBy('name')->get();

        return response()->json([
            'data' => $themes->map(fn (Theme $theme) => $this->present($theme))->values(),
        ]);
    }

    /** Deja este tema como el único activo (el "Publicar" de Shopify). */
    public function publish(Theme $theme): JsonResponse
    {
        $theme->publish();

        return response()->json(['data' => $this->present($theme->refresh())]);
    }

    public function update(Request $request, Theme $theme): JsonResponse
    {
        $validated = $request->validate([
            'settings' => 'required|array',
            'settings.accent' => 'nullable|string|max:30',
            'settings.radius' => 'nullable|string|max:30',
        ]);

        $theme->update([
            'settings' => array_merge($theme->resolvedSettings(), array_filter($validated['settings'])),
        ]);

        return response()->json(['data' => $this->present($theme->refresh())]);
    }

    private function present(Theme $theme): array
    {
        return [
            'id' => $theme->id,
            'name' => $theme->name,
            'key' => $theme->key,
            'description' => $theme->description,
            'settings' => $theme->resolvedSettings(),
            'is_active' => $theme->is_active,
        ];
    }
}
