<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CustomerController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = User::where('role', 'customer')
            ->withCount('orders')
            ->withSum('orders', 'total')
            ->withMax('orders', 'created_at');

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where('email', 'like', "%{$search}%");
        }

        $customers = $query->paginate(20);

        $customers->through(function ($user) {
            return [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone ?? null,
                'total_orders' => $user->orders_count,
                'total_spent' => (float) ($user->orders_sum_total ?? 0),
                'last_order_at' => $user->orders_max_created_at,
                'created_at' => $user->created_at->toISOString(),
                'updated_at' => $user->updated_at->toISOString(),
            ];
        });

        return response()->json($customers);
    }

    public function show(User $user): JsonResponse
    {
        return response()->json([
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'total_orders' => $user->orders()->count(),
                'total_spent' => (float) $user->orders()->sum('total'),
                'last_order_at' => $user->orders()->max('created_at'),
                'created_at' => $user->created_at,
                'updated_at' => $user->updated_at,
            ],
        ]);
    }
}
