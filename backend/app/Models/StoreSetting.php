<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Fila única con los datos de identidad de la tienda. No hay UI multi-tienda
 * todavía, así que basta con un singleton (id 1) en vez de un CRUD completo.
 */
class StoreSetting extends Model
{
    protected $fillable = [
        'name',
        'email',
        'phone',
        'address',
    ];

    public static function current(): self
    {
        return static::firstOrCreate(['id' => 1], ['name' => 'Mi Tienda']);
    }
}
