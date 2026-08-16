<?php

namespace App\Http\Controllers\Api\Store;

use App\Http\Controllers\Controller;
use App\Models\Theme;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * El "papelito" que lee el storefront al arrancar: qué piel ponerse.
 * Con ?key= devuelve otro tema sin publicarlo, para previsualizar borradores.
 */
class ThemeController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $theme = null;

        if ($key = $request->query('key')) {
            $theme = Theme::where('key', $key)->first();
        }

        $theme ??= Theme::active();

        // Sin tema activo la tienda igual debe abrir, no quedarse en blanco.
        return response()->json([
            'data' => [
                'key' => $theme?->key ?? 'minimal',
                'name' => $theme?->name ?? 'Minimal',
                'settings' => $theme?->resolvedSettings() ?? Theme::DEFAULT_SETTINGS,
            ],
        ]);
    }
}
