<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('migration_checkpoints', function (Blueprint $table) {
            $table->id();
            $table->string('source_db');
            $table->string('target_db');
            $table->string('table_name');
            $table->string('checkpoint_column')->default('id');
            $table->string('last_value')->nullable();
            $table->timestamp('last_synced_at')->useCurrent();
            $table->unique(['source_db', 'target_db', 'table_name']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('migration_checkpoints');
    }
};
