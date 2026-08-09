<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Collection extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'description',
        'type',
        'rules',
    ];

    protected $casts = [
        'rules' => 'array',
    ];

    public function products()
    {
        return $this->hasMany(Product::class);
    }
}
