<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProductVariant extends Model
{
    protected $fillable = [
        'product_id',
        'sku',
        'barcode',
        'name',
        'price_adjustment',
        'stock',
        'position',
        'attributes',
    ];

    protected $casts = [
        'price_adjustment' => 'float',
        'stock' => 'integer',
        'position' => 'integer',
        'attributes' => 'array',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
