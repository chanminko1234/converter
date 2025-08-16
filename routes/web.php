<?php

use App\Http\Controllers\ConversionController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome');
});

// Conversion API endpoints with CSRF protection and throttling
Route::middleware(['throttle:60,1'])->group(function () {
    Route::post('/convert', [ConversionController::class, 'convert'])->name('convert');
    Route::post('/convert/upload', [ConversionController::class, 'upload'])->name('convert.upload');
});
