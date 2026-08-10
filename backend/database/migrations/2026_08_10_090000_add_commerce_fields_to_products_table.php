<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->string('vendor')->nullable()->after('description');
            $table->string('product_type')->nullable()->after('vendor');
            $table->foreignId('category_id')->nullable()->after('collection_id')->constrained()->nullOnDelete();
            $table->decimal('compare_at_price', 10, 2)->nullable()->after('base_price');
            $table->decimal('cost_per_item', 10, 2)->nullable()->after('compare_at_price');
            $table->boolean('track_inventory')->default(true)->after('is_personalizable');
            $table->boolean('continue_selling_when_out_of_stock')->default(false)->after('track_inventory');
            $table->unsignedInteger('channels_count')->default(1)->after('status');
            $table->unsignedInteger('catalogs_count')->default(1)->after('channels_count');
            $table->json('tags')->nullable()->after('catalogs_count');
            $table->string('seo_title')->nullable()->after('tags');
            $table->text('seo_description')->nullable()->after('seo_title');
            $table->timestamp('published_at')->nullable()->after('seo_description');

            $table->index('status');
            $table->index('vendor');
            $table->index('product_type');
        });

        Schema::table('product_variants', function (Blueprint $table) {
            $table->string('barcode')->nullable()->after('sku');
            $table->unsignedInteger('position')->default(0)->after('stock');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropIndex(['status']);
            $table->dropIndex(['vendor']);
            $table->dropIndex(['product_type']);
            $table->dropConstrainedForeignId('category_id');
            $table->dropColumn([
                'vendor',
                'product_type',
                'compare_at_price',
                'cost_per_item',
                'track_inventory',
                'continue_selling_when_out_of_stock',
                'channels_count',
                'catalogs_count',
                'tags',
                'seo_title',
                'seo_description',
                'published_at',
            ]);
        });

        Schema::table('product_variants', function (Blueprint $table) {
            $table->dropColumn(['barcode', 'position']);
        });
    }
};
