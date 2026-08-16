<?php

namespace Database\Seeders;

use App\Models\Theme;
use Illuminate\Database\Seeder;

class ThemeSeeder extends Seeder
{
    public function run(): void
    {
        $themes = [
            [
                'key' => 'minimal',
                'name' => 'Minimal',
                'description' => 'Limpio y claro, con mucho espacio en blanco y tipografía discreta.',
                'settings' => ['accent' => '#4f46e5', 'radius' => '0.5rem'],
                'is_active' => true,
            ],
            [
                'key' => 'bold',
                'name' => 'Bold',
                'description' => 'Portada oscura, títulos grandes y fichas de producto a todo color.',
                'settings' => ['accent' => '#f97316', 'radius' => '1rem'],
                'is_active' => false,
            ],
        ];

        foreach ($themes as $theme) {
            Theme::updateOrCreate(['key' => $theme['key']], $theme);
        }
    }
}
