<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Adelgaza el catálogo quitando lo que Shopify arrastra por historia y aquí no
 * cumple ninguna función:
 *  - product_type duplicaba category_id (la taxonomía pasa a ser solo categorías)
 *  - channels_count / catalogs_count no los consumía nadie: la visibilidad ya la
 *    define status/published_at
 *  - continue_selling_when_out_of_stock prometía algo que ningún checkout valida
 *  - barcode solo sirve con lector o POS
 *  - el SKU deja de ser único: es una etiqueta para humanos, no una clave
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            // En SQLite no se puede soltar una columna indexada: primero el índice.
            $table->dropIndex(['product_type']);
        });

        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn([
                'product_type',
                'channels_count',
                'catalogs_count',
                'continue_selling_when_out_of_stock',
            ]);
        });

        Schema::table('product_variants', function (Blueprint $table) {
            $table->dropUnique('product_variants_sku_unique');
        });

        Schema::table('product_variants', function (Blueprint $table) {
            $table->dropColumn('barcode');
        });

        Schema::table('collections', function (Blueprint $table) {
            $table->dropColumn('channels_count');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->string('product_type')->nullable()->after('vendor');
            $table->unsignedInteger('channels_count')->default(1)->after('status');
            $table->unsignedInteger('catalogs_count')->default(1)->after('channels_count');
            $table->boolean('continue_selling_when_out_of_stock')->default(false)->after('track_inventory');
            $table->index('product_type');
        });

        Schema::table('product_variants', function (Blueprint $table) {
            $table->string('barcode')->nullable()->after('sku');
            $table->unique('sku');
        });

        Schema::table('collections', function (Blueprint $table) {
            $table->unsignedInteger('channels_count')->default(1)->after('sort_order');
        });
    }
};
