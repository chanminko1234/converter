<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('cdc_changes', function (Blueprint $blueprint) {
            $blueprint->id();
            $blueprint->string('operation_type'); // INSERT, UPDATE, DELETE
            $blueprint->string('table_name');
            $blueprint->json('payload'); // The data changed
            $blueprint->unsignedBigInteger('binlog_position')->nullable();
            $blueprint->timestamp('captured_at')->useCurrent();
            $blueprint->boolean('replayed')->default(false);
            $blueprint->timestamp('replayed_at')->nullable();
            $blueprint->string('source_db');
            $blueprint->string('target_db');
            
            $blueprint->index(['table_name', 'replayed']);
            $blueprint->index('captured_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cdc_changes');
    }
};
