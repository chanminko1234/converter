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


Route::middleware('auth')->group(function () {
    Route::get('/dashboard', function () {
        return Inertia::render('Dashboard');
    })->name('dashboard');
    
    Route::get('/overview', function () {
        return Inertia::render('Overview');
    })->name('overview');

    Route::get('/validation', function () {
        return Inertia::render('Validation');
    })->name('validation');

    Route::get('/index-advisor', function () {
        return Inertia::render('IndexAdvisor');
    })->name('index-advisor');

    Route::get('/orchestrator', function () {
        return Inertia::render('Orchestrator');
    })->name('orchestrator');

    Route::get('/profile', [\App\Http\Controllers\ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [\App\Http\Controllers\ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [\App\Http\Controllers\ProfileController::class, 'destroy'])->name('profile.destroy');

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
        Route::post('/convert/tune', [ConversionController::class, 'recommendTuning'])->name('convert.tune');
        Route::post('/translate-query', [ConversionController::class, 'translateQuery'])->name('translate.query');
        Route::post('/cdc/capture', [ConversionController::class, 'captureCdcChange'])->name('cdc.capture');
        Route::post('/cdc/replay', [ConversionController::class, 'replayCdcChanges'])->name('cdc.replay');
        Route::post('/convert/validate', [\App\Http\Controllers\ValidationController::class, 'validateData'])->name('convert.validate');
        Route::post('/convert/advise-indexes', [\App\Http\Controllers\IndexAdvisorController::class, 'advise'])->name('convert.advise');
        Route::post('/convert/migration-status', [\App\Http\Controllers\OrchestrationController::class, 'getStatus'])->name('convert.migration_status');
        Route::post('/convert/cutover', [\App\Http\Controllers\OrchestrationController::class, 'cutover'])->name('convert.cutover');
        Route::get('/convert/stream-results', [\App\Http\Controllers\SseController::class, 'streamResults'])->name('convert.stream_results');
        Route::post('/support/inquiry', [\App\Http\Controllers\SupportController::class, 'submitInquiry'])->name('support.inquiry');
    });
});

require __DIR__.'/auth.php';
