<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BillingScheduleController;
use App\Http\Controllers\Api\DeliveryReceiptTokenController;
use App\Http\Controllers\Api\ReceivingScanController;
use App\Http\Controllers\Api\SettingController;
use App\Http\Controllers\Api\Setup\BranchController;
use App\Http\Controllers\Api\Setup\BrandController;
use App\Http\Controllers\Api\Setup\CategoryController;
use App\Http\Controllers\Api\Setup\CompanyController;
use App\Http\Controllers\Api\Setup\CustomerController;
use App\Http\Controllers\Api\Setup\ItemController;
use App\Http\Controllers\Api\Setup\PositionController;
use App\Http\Controllers\Api\Setup\ProductModelController;
use App\Http\Controllers\Api\Setup\ProjectController;
use App\Http\Controllers\Api\Setup\SupplierController;
use App\Http\Controllers\Api\Setup\UnitOfMeasureController;
use App\Http\Controllers\Api\Setup\UserController;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Route;

Route::get('/health', function () {
    $database = 'ok';

    try {
        DB::connection()->getPdo();
        DB::select('select 1 as ok');
    } catch (\Throwable $exception) {
        $database = 'error';
        Log::error('Health check database failure.', [
            'connection' => config('database.default'),
            'exception' => $exception::class,
        ]);
    }

    $healthy = $database === 'ok';

    return response()->json([
        'status' => $healthy ? 'ok' : 'degraded',
        'app' => config('app.name'),
        'database' => $database,
    ], $healthy ? 200 : 503);
});

Route::post('/login', [AuthController::class, 'login']);

Route::get('/network', [ReceivingScanController::class, 'network']);
Route::get('/r', [ReceivingScanController::class, 'open']);

Route::get('/settings', [SettingController::class, 'show']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/receiving-scans', [ReceivingScanController::class, 'index']);
    Route::post('/receiving-scans/claim', [ReceivingScanController::class, 'claim']);
    Route::get('/delivery-receipt-tokens', [DeliveryReceiptTokenController::class, 'show']);
    Route::post('/delivery-receipt-tokens', [DeliveryReceiptTokenController::class, 'store']);
    Route::post('/delivery-receipt-tokens/confirm', [DeliveryReceiptTokenController::class, 'confirm']);

    Route::get('/user', [AuthController::class, 'user']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/billings', [BillingScheduleController::class, 'index']);
    Route::post('/billings/schedules', [BillingScheduleController::class, 'store']);
    Route::delete('/billings/schedules/{schedule}', [BillingScheduleController::class, 'destroySchedule']);
    Route::delete('/billings/{billing}', [BillingScheduleController::class, 'destroy']);
    Route::put('/settings', [SettingController::class, 'update']);
    Route::put('/settings/password', [SettingController::class, 'updatePassword']);

    Route::prefix('setups')->group(function () {
        Route::get('companies', [CompanyController::class, 'index']);
        Route::post('companies', [CompanyController::class, 'store']);
        Route::get('companies/{company}', [CompanyController::class, 'show']);
        Route::put('companies/{company}', [CompanyController::class, 'update']);
        Route::delete('companies/{company}', [CompanyController::class, 'destroy']);
        Route::post('companies/{company}/logo', [CompanyController::class, 'uploadLogo']);

        Route::apiResource('branches', BranchController::class);
        Route::apiResource('projects', ProjectController::class);
        Route::apiResource('positions', PositionController::class);
        Route::apiResource('categories', CategoryController::class);
        Route::apiResource('brands', BrandController::class);

        Route::get('models/brand/{brandId}', [ProductModelController::class, 'byBrand']);
        Route::apiResource('models', ProductModelController::class)
            ->parameters(['models' => 'model']);

        Route::apiResource('units', UnitOfMeasureController::class)
            ->parameters(['units' => 'unit']);

        Route::apiResource('items', ItemController::class);
        Route::apiResource('suppliers', SupplierController::class);
        Route::apiResource('customers', CustomerController::class);
        Route::apiResource('users', UserController::class);
    });
});
