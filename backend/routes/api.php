<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\Admin\ProductController;
use App\Http\Controllers\Api\Admin\CollectionController;
use App\Http\Controllers\Api\Admin\OrderController;
use App\Http\Controllers\Api\Admin\CustomerController;
use App\Http\Controllers\Api\Admin\CouponController;
use App\Http\Controllers\Api\Admin\AnalyticsController;

// Public auth routes
Route::post('/auth/login', [AuthController::class, 'login']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    // Admin: Products
    Route::apiResource('/admin/products', ProductController::class);

    // Admin: Collections
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
});
