<?php

use App\Http\Controllers\ConversionController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome');
});

Route::get('/docs', function () {
    return Inertia::render('Docs');
});

Route::get('/status', function () {
    return Inertia::render('Status');
});

Route::get('/support', function () {
    return Inertia::render('Support');
});

Route::get('/overview', function () {
    return Inertia::render('Overview');
});

// Conversion API endpoints with CSRF protection and throttling
Route::middleware(['throttle:60,1'])->group(function () {
    Route::post('/convert', [ConversionController::class, 'convert'])->name('convert');
    Route::post('/convert/upload', [ConversionController::class, 'upload'])->name('convert.upload');
    Route::post('/convert/stream', [ConversionController::class, 'stream'])->name('convert.stream');
    Route::post('/convert/analyze', [ConversionController::class, 'analyze'])->name('convert.analyze');
    /**
     * Get real-time migration status for dashboard
     */
    Route::post('/convert/status', [ConversionController::class, 'getStatus'])->name('convert.status');
    Route::post('/convert/sandbox', [ConversionController::class, 'sandboxRun'])->name('convert.sandbox');
    Route::post('/translate-query', [ConversionController::class, 'translateQuery'])->name('translate.query');
});
