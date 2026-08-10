<?php

namespace Database\Seeders;

use App\Models\Order;
use App\Models\Product;
use Illuminate\Database\Seeder;

class DemoOrderSeeder extends Seeder
{
    private const CUSTOMERS = [
        ['Lucía Ramos', 'lucia.ramos@example.com'],
        ['Diego Salas', 'diego.salas@example.com'],
        ['Camila Torres', 'camila.torres@example.com'],
        ['Jorge Béjar', 'jorge.bejar@example.com'],
        ['Andrea Quispe', 'andrea.quispe@example.com'],
        ['Renzo Delgado', 'renzo.delgado@example.com'],
        ['Valeria Pinto', 'valeria.pinto@example.com'],
        ['Mateo Cárdenas', 'mateo.cardenas@example.com'],
    ];

    private const STATUSES = [
        'delivered', 'delivered', 'delivered', 'shipped',
        'processing', 'confirmed', 'pending', 'cancelled',
    ];

    public function run(): void
    {
        $products = Product::with('variants')
            ->where('status', 'active')
            ->get()
            ->filter(fn (Product $p) => $p->variants->isNotEmpty());

        if ($products->isEmpty()) {
            return;
        }

        // Órdenes repartidas en los últimos 45 días para alimentar las métricas.
        for ($i = 0; $i < 60; $i++) {
            $placedAt = now()->subDays(random_int(0, 44))->subHours(random_int(0, 23));
            [$name, $email] = self::CUSTOMERS[array_rand(self::CUSTOMERS)];

            $order = Order::create([
                'customer_name' => $name,
                'customer_email' => $email,
                'status' => self::STATUSES[array_rand(self::STATUSES)],
                'subtotal' => 0,
                'tax' => 0,
                'shipping_cost' => 12.00,
                'total' => 0,
                'shipping_address' => [
                    'line1' => 'Av. Ejército '.random_int(100, 999),
                    'city' => 'Arequipa',
                    'state' => 'Arequipa',
                    'postal_code' => '04001',
                    'country' => 'PE',
                ],
            ]);

            $subtotal = 0;

            foreach ($products->random(random_int(1, 3)) as $product) {
                $variant = $product->variants->random();
                $quantity = random_int(1, 3);
                $unitPrice = round($product->base_price + $variant->price_adjustment, 2);
                $lineTotal = round($unitPrice * $quantity, 2);
                $subtotal += $lineTotal;

                $order->items()->create([
                    'product_id' => $product->id,
                    'variant_id' => $variant->id,
                    'product_name' => $product->name,
                    'variant_name' => $variant->name,
                    'quantity' => $quantity,
                    'unit_price' => $unitPrice,
                    'total_price' => $lineTotal,
                ]);
            }

            $tax = round($subtotal * 0.18, 2);

            // Los timestamps no son fillable: se fijan aparte para repartir el histórico.
            $order->forceFill([
                'subtotal' => $subtotal,
                'tax' => $tax,
                'total' => round($subtotal + $tax + 12.00, 2),
                'created_at' => $placedAt,
                'updated_at' => $placedAt,
            ])->saveQuietly();

            $order->items()->update(['created_at' => $placedAt, 'updated_at' => $placedAt]);
        }
    }
}
