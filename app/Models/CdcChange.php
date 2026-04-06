<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CdcChange extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'operation_type',
        'table_name',
        'payload',
        'binlog_position',
        'captured_at',
        'replayed',
        'replayed_at',
        'source_db',
        'target_db'
    ];

    protected $casts = [
        'payload' => 'array',
        'captured_at' => 'datetime',
        'replayed' => 'boolean',
        'replayed_at' => 'datetime'
    ];
}
