<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

/**
 * Un tema es la "piel" del storefront: su `key` apunta a una carpeta de
 * componentes en apps/storefront/src/themes, y `settings` guarda los ajustes
 * (color de acento, redondeo) que esa piel aplica como variables CSS.
 * Solo uno puede estar activo a la vez.
 */
class Theme extends Model
{
    /** Las 3 secciones que compone hoy el Home de cualquier tema, en su orden de fábrica. */
    public const DEFAULT_SECTIONS = [
        ['key' => 'hero', 'visible' => true],
        ['key' => 'search', 'visible' => true],
        ['key' => 'grid', 'visible' => true],
    ];

    /** Ajustes admitidos, con su valor por defecto si el tema no los define. */
    public const DEFAULT_SETTINGS = [
        'accent' => '#4f46e5',
        'radius' => '0.5rem',
        'sections' => self::DEFAULT_SECTIONS,
    ];

    protected $fillable = [
        'name',
        'key',
        'description',
        'settings',
        'is_active',
    ];

    protected $casts = [
        'settings' => 'array',
        'is_active' => 'boolean',
    ];

    public static function active(): ?self
    {
        return static::where('is_active', true)->first();
    }

    /** Deja este tema como el único activo. */
    public function publish(): void
    {
        DB::transaction(function () {
            static::where('id', '!=', $this->id)->update(['is_active' => false]);
            $this->update(['is_active' => true]);
        });
    }

    /** Ajustes del tema completados con los valores por defecto. */
    public function resolvedSettings(): array
    {
        return array_merge(self::DEFAULT_SETTINGS, $this->settings ?? []);
    }
}
