<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class Collection extends Model
{
    /** Campos sobre los que puede filtrar una colección automática. */
    public const RULE_FIELDS = [
        'title',
        'product_type',
        'vendor',
        'price',
        'compare_at_price',
        'tag',
        'inventory_stock',
        'variant_sku',
        'is_personalizable',
    ];

    public const RULE_OPERATORS = [
        'equals',
        'not_equals',
        'contains',
        'not_contains',
        'starts_with',
        'ends_with',
        'greater_than',
        'less_than',
    ];

    /** Criterios de orden por defecto de los productos de la colección. */
    public const SORT_ORDERS = [
        'best_selling',
        'manual',
        'title_asc',
        'title_desc',
        'price_asc',
        'price_desc',
        'created_desc',
        'created_asc',
    ];

    protected $fillable = [
        'name',
        'slug',
        'description',
        'image_url',
        'type',
        'rules',
        'rules_match',
        'sort_order',
        'channels_count',
        'theme_template',
        'seo_title',
        'seo_description',
        'published_at',
    ];

    protected $casts = [
        'rules' => 'array',
        'channels_count' => 'integer',
        'published_at' => 'datetime',
    ];

    public function products()
    {
        return $this->belongsToMany(Product::class)
            ->withPivot('position')
            ->withTimestamps();
    }

    public function isAutomatic(): bool
    {
        return $this->type === 'automatic';
    }

    /**
     * Productos que pertenecen a la colección: los asignados a mano o los que
     * cumplen las condiciones si es automática.
     */
    public function resolvedProducts(): Builder
    {
        $query = $this->isAutomatic()
            ? $this->matchingProductsQuery()
            : Product::query()->whereIn(
                'id',
                DB::table('collection_product')
                    ->where('collection_id', $this->id)
                    ->select('product_id'),
            );

        return $this->applySortOrder($query);
    }

    /**
     * Traduce las reglas guardadas a una consulta sobre productos.
     */
    public function matchingProductsQuery(): Builder
    {
        $rules = array_filter(
            $this->rules ?? [],
            fn ($rule) => isset($rule['field'], $rule['operator']) && ($rule['value'] ?? '') !== '',
        );

        $query = Product::query();

        if ($rules === []) {
            // Sin condiciones una colección automática está vacía, no completa.
            return $query->whereRaw('0 = 1');
        }

        $matchAny = ($this->rules_match ?? 'all') === 'any';

        return $query->where(function (Builder $group) use ($rules, $matchAny) {
            foreach ($rules as $rule) {
                $apply = fn (Builder $q) => $this->applyRule($q, $rule);

                $matchAny ? $group->orWhere($apply) : $group->where($apply);
            }
        });
    }

    /**
     * @param  array<string, mixed>  $rule
     */
    private function applyRule(Builder $query, array $rule): void
    {
        $operator = $rule['operator'];
        $value = $rule['value'];

        match ($rule['field']) {
            'title' => $this->applyText($query, 'name', $operator, (string) $value),
            'product_type' => $this->applyText($query, 'product_type', $operator, (string) $value),
            'vendor' => $this->applyText($query, 'vendor', $operator, (string) $value),
            'variant_sku' => $query->whereHas(
                'variants',
                fn (Builder $v) => $this->applyText($v, 'sku', $operator, (string) $value),
            ),
            'price' => $this->applyNumeric($query, 'base_price', $operator, (float) $value),
            'compare_at_price' => $this->applyNumeric($query, 'compare_at_price', $operator, (float) $value),
            'is_personalizable' => $query->where(
                'is_personalizable',
                $operator === 'not_equals' ? '!=' : '=',
                filter_var($value, FILTER_VALIDATE_BOOLEAN),
            ),
            'tag' => $this->applyTag($query, $operator, (string) $value),
            'inventory_stock' => $this->applyStock($query, $operator, (int) $value),
            default => null,
        };
    }

    private function applyText(Builder $query, string $column, string $operator, string $value): void
    {
        match ($operator) {
            'equals' => $query->where($column, $value),
            'not_equals' => $query->where(fn (Builder $q) => $q
                ->where($column, '!=', $value)
                ->orWhereNull($column)),
            'not_contains' => $query->where(fn (Builder $q) => $q
                ->where($column, 'not like', "%{$value}%")
                ->orWhereNull($column)),
            'starts_with' => $query->where($column, 'like', "{$value}%"),
            'ends_with' => $query->where($column, 'like', "%{$value}"),
            default => $query->where($column, 'like', "%{$value}%"),
        };
    }

    private function applyNumeric(Builder $query, string $column, string $operator, float $value): void
    {
        $sqlOperator = match ($operator) {
            'greater_than' => '>',
            'less_than' => '<',
            'not_equals' => '!=',
            default => '=',
        };

        $query->where($column, $sqlOperator, $value);
    }

    private function applyTag(Builder $query, string $operator, string $value): void
    {
        // Las etiquetas viven en una columna JSON: se busca el literal entrecomillado.
        $needle = '%"'.$value.'"%';

        $operator === 'not_equals' || $operator === 'not_contains'
            ? $query->where(fn (Builder $q) => $q->where('tags', 'not like', $needle)->orWhereNull('tags'))
            : $query->where('tags', 'like', $needle);
    }

    private function applyStock(Builder $query, string $operator, int $value): void
    {
        $sqlOperator = match ($operator) {
            'greater_than' => '>',
            'less_than' => '<',
            'not_equals' => '!=',
            default => '=',
        };

        $subquery = DB::table('product_variants')
            ->selectRaw('COALESCE(SUM(stock), 0)')
            ->whereColumn('product_variants.product_id', 'products.id')
            ->toSql();

        $query->whereRaw("({$subquery}) {$sqlOperator} ?", [$value]);
    }

    private function applySortOrder(Builder $query): Builder
    {
        return match ($this->sort_order) {
            'title_asc' => $query->orderBy('name'),
            'title_desc' => $query->orderByDesc('name'),
            'price_asc' => $query->orderBy('base_price'),
            'price_desc' => $query->orderByDesc('base_price'),
            'created_asc' => $query->orderBy('created_at'),
            'created_desc' => $query->orderByDesc('created_at'),
            'manual' => $this->isAutomatic()
                ? $query->orderByDesc('created_at')
                : $query->orderByRaw(
                    '(select position from collection_product
                      where collection_product.product_id = products.id
                        and collection_product.collection_id = ?)',
                    [$this->id],
                ),
            // best_selling: por unidades vendidas, con los sin ventas al final.
            default => $query
                ->withSum('orderItems as units_sold', 'quantity')
                ->orderByDesc('units_sold'),
        };
    }
}
