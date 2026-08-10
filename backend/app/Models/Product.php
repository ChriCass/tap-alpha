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
        'product_type',
        'base_price',
        'compare_at_price',
        'cost_per_item',
        'is_personalizable',
        'track_inventory',
        'continue_selling_when_out_of_stock',
        'status',
        'channels_count',
        'catalogs_count',
        'tags',
        'seo_title',
        'seo_description',
        'published_at',
        'collection_id',
        'category_id',
    ];

    protected $casts = [
        'base_price' => 'float',
        'compare_at_price' => 'float',
        'cost_per_item' => 'float',
        'is_personalizable' => 'boolean',
        'track_inventory' => 'boolean',
        'continue_selling_when_out_of_stock' => 'boolean',
        'channels_count' => 'integer',
        'catalogs_count' => 'integer',
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

    public function collection()
    {
        return $this->belongsTo(Collection::class);
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
                ->orWhere('product_type', 'like', "%{$term}%")
                ->orWhereHas('variants', fn (Builder $v) => $v->where('sku', 'like', "%{$term}%"));
        });
    }
}
