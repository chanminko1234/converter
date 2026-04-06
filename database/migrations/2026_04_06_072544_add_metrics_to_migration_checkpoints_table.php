<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('migration_checkpoints', function (Blueprint $table) {
            if (!Schema::hasColumn('migration_checkpoints', 'rows_synced')) {
                $table->bigInteger('rows_synced')->default(0)->after('last_value');
                $table->float('last_throughput')->default(0)->after('rows_synced');
                $table->string('sync_status')->default('idle')->after('last_throughput');
            }
        });
    }

    public function down(): void
    {
        Schema::table('migration_checkpoints', function (Blueprint $table) {
            $table->dropColumn(['rows_synced', 'last_throughput', 'sync_status']);
        });
    }
};
