<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class AnalyticsController extends Controller
{
    public function index(): JsonResponse
    {
        $ordersCount = Order::count();
        $productsCount = Product::count();
        $customersCount = User::where('role', 'customer')->count();
        $averageOrderValue = Order::avg('total') ?? 0;

        $revenue = Order::whereNotNull('total')
            ->select(DB::raw('DATE(created_at) as date'), DB::raw('SUM(total) as amount'))
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        $topProducts = DB::table('order_items')
            ->join('products', 'products.id', '=', 'order_items.product_id')
            ->select(
                'products.id',
                'products.name',
                DB::raw('SUM(order_items.quantity) as sold'),
                DB::raw('SUM(order_items.total_price) as revenue')
            )
            ->groupBy('products.id', 'products.name')
            ->orderByDesc('sold')
            ->limit(10)
            ->get();

        return response()->json([
            'data' => [
                'revenue' => $revenue,
                'orders_count' => $ordersCount,
                'products_count' => $productsCount,
                'customers_count' => $customersCount,
                'average_order_value' => round((float) $averageOrderValue, 2),
                'top_products' => $topProducts,
            ],
        ]);
    }
}
