<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Collection;
use App\Models\Coupon;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Búsqueda global (Ctrl+K) sobre las entidades reales de TAP: no es un índice
 * genérico como el de Shopify (Apps, Settings, Metafields, ...) porque esas
 * superficies no existen aquí.
 */
class SearchController extends Controller
{
    private const LIMIT = 5;

    public function index(Request $request): JsonResponse
    {
        $term = trim((string) $request->input('q', ''));

        if ($term === '') {
            return response()->json([
                'query' => '',
                'counts' => ['products' => 0, 'collections' => 0, 'orders' => 0, 'customers' => 0, 'coupons' => 0],
                'results' => ['products' => [], 'collections' => [], 'orders' => [], 'customers' => [], 'coupons' => []],
            ]);
        }

        [$productResults, $productsCount] = $this->searchProducts($term);
        [$collectionResults, $collectionsCount] = $this->searchCollections($term);
        [$orderResults, $ordersCount] = $this->searchOrders($term);
        [$customerResults, $customersCount] = $this->searchCustomers($term);
        [$couponResults, $couponsCount] = $this->searchCoupons($term);

        return response()->json([
            'query' => $term,
            'counts' => [
                'products' => $productsCount,
                'collections' => $collectionsCount,
                'orders' => $ordersCount,
                'customers' => $customersCount,
                'coupons' => $couponsCount,
            ],
            'results' => [
                'products' => $productResults,
                'collections' => $collectionResults,
                'orders' => $orderResults,
                'customers' => $customerResults,
                'coupons' => $couponResults,
            ],
        ]);
    }

    private function searchProducts(string $term): array
    {
        $base = Product::query()->search($term);
        $count = (clone $base)->count();

        $products = $base->with(['category', 'images' => fn ($q) => $q->orderBy('position')->limit(1)])
            ->limit(self::LIMIT)
            ->get()
            ->map(fn (Product $product) => [
                'id' => $product->id,
                'title' => $product->name,
                'subtitle' => collect([$product->vendor, $product->category?->name])
                    ->filter()
                    ->implode(' · ') ?: null,
                'image_url' => $product->images->first()?->url,
                'status' => $product->status,
            ]);

        return [$products->values()->all(), $count];
    }

    private function searchCollections(string $term): array
    {
        $base = Collection::query()->where(
            fn ($q) => $q->where('name', 'like', "%{$term}%")->orWhere('slug', 'like', "%{$term}%"),
        );
        $count = (clone $base)->count();

        $collections = $base->limit(self::LIMIT)->get()->map(fn (Collection $collection) => [
            'id' => $collection->id,
            'title' => $collection->name,
            'subtitle' => $collection->resolvedProducts()->count().' productos',
            'image_url' => $collection->image_url,
        ]);

        return [$collections->values()->all(), $count];
    }

    private function searchOrders(string $term): array
    {
        $base = Order::query()->where(function ($q) use ($term) {
            $q->where('customer_name', 'like', "%{$term}%")
                ->orWhere('customer_email', 'like', "%{$term}%");

            if (ctype_digit($term)) {
                $q->orWhere('id', (int) $term);
            }
        });
        $count = (clone $base)->count();

        $orders = $base->latest()->limit(self::LIMIT)->get()->map(fn (Order $order) => [
            'id' => $order->id,
            'title' => '#'.$order->id,
            'subtitle' => trim($order->customer_name.' · S/ '.number_format((float) $order->total, 2)),
        ]);

        return [$orders->values()->all(), $count];
    }

    private function searchCustomers(string $term): array
    {
        $base = User::query()->where('role', 'customer')->where(
            fn ($q) => $q->where('name', 'like', "%{$term}%")->orWhere('email', 'like', "%{$term}%"),
        );
        $count = (clone $base)->count();

        $customers = $base->limit(self::LIMIT)->get()->map(fn (User $user) => [
            'id' => $user->id,
            'title' => $user->name,
            'subtitle' => $user->email,
        ]);

        return [$customers->values()->all(), $count];
    }

    private function searchCoupons(string $term): array
    {
        $base = Coupon::query()->where('code', 'like', "%{$term}%");
        $count = (clone $base)->count();

        $coupons = $base->limit(self::LIMIT)->get()->map(fn (Coupon $coupon) => [
            'id' => $coupon->id,
            'title' => $coupon->code,
            'subtitle' => $coupon->type === 'percentage'
                ? "{$coupon->value}% de descuento"
                : 'S/ '.number_format((float) $coupon->value, 2).' de descuento',
        ]);

        return [$coupons->values()->all(), $count];
    }
}
