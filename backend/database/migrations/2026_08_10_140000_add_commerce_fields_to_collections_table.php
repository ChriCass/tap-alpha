<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('collections', function (Blueprint $table) {
            $table->string('image_url')->nullable()->after('description');
            $table->string('sort_order')->default('best_selling')->after('rules');
            $table->string('rules_match')->default('all')->after('rules');
            $table->unsignedInteger('channels_count')->default(1)->after('sort_order');
            $table->string('theme_template')->default('default')->after('channels_count');
            $table->string('seo_title')->nullable()->after('theme_template');
            $table->text('seo_description')->nullable()->after('seo_title');
            $table->timestamp('published_at')->nullable()->after('seo_description');
        });

        // Un producto puede estar en varias colecciones, como en Shopify.
        Schema::create('collection_product', function (Blueprint $table) {
            $table->id();
            $table->foreignId('collection_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('position')->default(0);
            $table->timestamps();

            $table->unique(['collection_id', 'product_id']);
        });

        // Bases creadas antes de este cambio traen products.collection_id: se
        // migra su contenido al pivote y se suelta la columna.
        if (! Schema::hasColumn('products', 'collection_id')) {
            return;
        }

        $assignments = DB::table('products')
            ->whereNotNull('collection_id')
            ->orderBy('id')
            ->get(['id', 'collection_id']);

        foreach ($assignments as $position => $row) {
            DB::table('collection_product')->insertOrIgnore([
                'collection_id' => $row->collection_id,
                'product_id' => $row->id,
                'position' => $position,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn('collection_id');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->foreignId('collection_id')->nullable()->constrained()->nullOnDelete();
        });

        // Se restaura la primera colección de cada producto.
        $pivots = DB::table('collection_product')->orderBy('position')->get();

        foreach ($pivots as $pivot) {
            DB::table('products')
                ->where('id', $pivot->product_id)
                ->whereNull('collection_id')
                ->update(['collection_id' => $pivot->collection_id]);
        }

        Schema::dropIfExists('collection_product');

        Schema::table('collections', function (Blueprint $table) {
            $table->dropColumn([
                'image_url',
                'sort_order',
                'rules_match',
                'channels_count',
                'theme_template',
                'seo_title',
                'seo_description',
                'published_at',
            ]);
        });
    }
};
