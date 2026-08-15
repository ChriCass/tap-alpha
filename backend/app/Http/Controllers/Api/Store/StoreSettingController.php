<?php

namespace App\Http\Controllers\Api\Store;

use App\Http\Controllers\Controller;
use App\Models\StoreSetting;
use Illuminate\Http\JsonResponse;

class StoreSettingController extends Controller
{
    public function show(): JsonResponse
    {
        $store = StoreSetting::current();

        return response()->json([
            'data' => [
                'name' => $store->name,
                'email' => $store->email,
                'phone' => $store->phone,
            ],
        ]);
    }
}
