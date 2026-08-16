<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\Admin\ProductController;
use App\Http\Controllers\Api\Admin\CollectionController;
use App\Http\Controllers\Api\Admin\OrderController;
use App\Http\Controllers\Api\Admin\CustomerController;
use App\Http\Controllers\Api\Admin\CouponController;
use App\Http\Controllers\Api\Admin\AnalyticsController;
use App\Http\Controllers\Api\Admin\SearchController;
use App\Http\Controllers\Api\Admin\StoreSettingController;
use App\Http\Controllers\Api\Admin\ThemeController;
use App\Http\Controllers\Api\Store\ProductController as StoreProductController;
use App\Http\Controllers\Api\Store\CollectionController as StoreCollectionController;
use App\Http\Controllers\Api\Store\StoreSettingController as PublicStoreSettingController;
use App\Http\Controllers\Api\Store\ThemeController as PublicThemeController;

// Public auth routes
Route::post('/auth/login', [AuthController::class, 'login']);

// Public: catálogo de la tienda (sin login, solo lectura, solo productos/colecciones publicados)
Route::prefix('store')->group(function () {
    Route::get('/settings', [PublicStoreSettingController::class, 'show']);
    Route::get('/theme', [PublicThemeController::class, 'show']);
    Route::get('/products', [StoreProductController::class, 'index']);
    Route::get('/products/{slug}', [StoreProductController::class, 'show']);
    Route::get('/collections', [StoreCollectionController::class, 'index']);
    Route::get('/collections/{slug}', [StoreCollectionController::class, 'show']);
});

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    // Admin: Búsqueda global (Ctrl+K)
    Route::get('/admin/search', [SearchController::class, 'index']);

    // Admin: Products (las rutas fijas van antes del apiResource para no chocar con /{product})
    Route::get('/admin/products/filters', [ProductController::class, 'filterOptions']);
    Route::get('/admin/products/stats', [ProductController::class, 'stats']);
    Route::post('/admin/products/bulk', [ProductController::class, 'bulk']);
    Route::apiResource('/admin/products', ProductController::class);

    // Admin: Collections (rutas fijas antes del apiResource)
    Route::get('/admin/collections/rule-options', [CollectionController::class, 'ruleOptions']);
    Route::post('/admin/collections/preview', [CollectionController::class, 'preview']);
    Route::post('/admin/collections/bulk', [CollectionController::class, 'bulk']);
    Route::post('/admin/collections/{collection}/duplicate', [CollectionController::class, 'duplicate']);
    Route::apiResource('/admin/collections', CollectionController::class);

    // Admin: Orders
    Route::get('/admin/orders', [OrderController::class, 'index']);
    Route::get('/admin/orders/{order}', [OrderController::class, 'show']);
    Route::patch('/admin/orders/{order}/status', [OrderController::class, 'updateStatus']);

    // Admin: Customers
    Route::get('/admin/customers', [CustomerController::class, 'index']);
    Route::get('/admin/customers/{user}', [CustomerController::class, 'show']);

    // Admin: Coupons
    Route::apiResource('/admin/coupons', CouponController::class);

    // Admin: Analytics
    Route::get('/admin/analytics', [AnalyticsController::class, 'index']);

    // Admin: Datos de la tienda (singleton)
    Route::get('/admin/store-settings', [StoreSettingController::class, 'show']);
    Route::put('/admin/store-settings', [StoreSettingController::class, 'update']);

    // Admin: Temas del storefront
    Route::get('/admin/themes', [ThemeController::class, 'index']);
    Route::post('/admin/themes/{theme}/publish', [ThemeController::class, 'publish']);
    Route::put('/admin/themes/{theme}', [ThemeController::class, 'update']);
});
