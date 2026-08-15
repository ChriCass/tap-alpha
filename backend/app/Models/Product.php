<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Product extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'name',
        'slug',
        'description',
        'vendor',
        'base_price',
        'compare_at_price',
        'cost_per_item',
        'is_personalizable',
        'track_inventory',
        'status',
        'tags',
        'seo_title',
        'seo_description',
        'published_at',
        'category_id',
    ];

    protected $casts = [
        'base_price' => 'float',
        'compare_at_price' => 'float',
        'cost_per_item' => 'float',
        'is_personalizable' => 'boolean',
        'track_inventory' => 'boolean',
        'tags' => 'array',
        'published_at' => 'datetime',
    ];

    protected $appends = ['total_inventory', 'variants_count'];

    public function variants()
    {
        return $this->hasMany(ProductVariant::class)->orderBy('position');
    }

    public function images()
    {
        return $this->hasMany(ProductImage::class)->orderBy('position');
    }

    public function collections()
    {
        return $this->belongsToMany(Collection::class)
            ->withPivot('position')
            ->withTimestamps();
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function orderItems()
    {
        return $this->hasMany(OrderItem::class);
    }

    /**
     * Suma de stock de todas las variantes (equivalente a "in stock" de Shopify).
     */
    public function getTotalInventoryAttribute(): int
    {
        if ($this->relationLoaded('variants')) {
            return (int) $this->variants->sum('stock');
        }

        if (isset($this->attributes['variants_sum_stock'])) {
            return (int) $this->attributes['variants_sum_stock'];
        }

        return (int) $this->variants()->sum('stock');
    }

    public function getVariantsCountAttribute(): int
    {
        if ($this->relationLoaded('variants')) {
            return $this->variants->count();
        }

        if (isset($this->attributes['variants_count_aggregate'])) {
            return (int) $this->attributes['variants_count_aggregate'];
        }

        return (int) $this->variants()->count();
    }

    public function scopeSearch(Builder $query, ?string $term): Builder
    {
        if (! $term) {
            return $query;
        }

        return $query->where(function (Builder $q) use ($term) {
            $q->where('name', 'like', "%{$term}%")
                ->orWhere('slug', 'like', "%{$term}%")
                ->orWhere('vendor', 'like', "%{$term}%")
                ->orWhereHas('variants', fn (Builder $v) => $v->where('sku', 'like', "%{$term}%"));
        });
    }

    /** Lo que un visitante de la tienda pública puede ver: activo y ya publicado. */
    public function scopePublished(Builder $query): Builder
    {
        return $query->where('status', 'active')
            ->where(function (Builder $q) {
                $q->whereNull('published_at')->orWhere('published_at', '<=', now());
            });
    }
}
