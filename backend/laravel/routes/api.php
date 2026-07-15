<?php

use App\Http\Controllers\Api\ExpenseController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\RawMaterialController;
use App\Http\Controllers\Api\ProductController;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->group(function () {
    Route::post('login', [AuthController::class, 'login']);

    Route::middleware('auth:api')->group(function () {
        Route::post('logout', [AuthController::class, 'logout']);
        Route::get('me', [AuthController::class, 'me']);
    });
});

Route::middleware(['auth:api', 'role:owner'])->group(function () {
    Route::get('raw-materials', [RawMaterialController::class, 'index']);
    Route::post('raw-materials', [RawMaterialController::class, 'store']);
    Route::put('raw-materials/{id}', [RawMaterialController::class, 'update']);
    Route::delete('raw-materials/{id}', [RawMaterialController::class, 'destroy']);

    Route::get('expenses', [ExpenseController::class, 'index']);
    Route::post('expenses', [ExpenseController::class, 'store']);
    Route::put('expenses/{id}', [ExpenseController::class, 'update']);
    Route::delete('expenses/{id}', [ExpenseController::class, 'destroy']);

    Route::get('categories', [CategoryController::class, 'index']);
    Route::post('categories', [CategoryController::class, 'store']);
    Route::put('categories/{id}', [CategoryController::class, 'update']);
    Route::delete('categories/{id}', [CategoryController::class, 'destroy']);

    Route::get('products', [ProductController::class, 'index']);
    Route::get('products/low-stock', [ProductController::class, 'lowStock']);
    Route::post('products', [ProductController::class, 'store']);
    Route::put('products/{id}', [ProductController::class, 'update']);
    Route::delete('products/{id}', [ProductController::class, 'destroy']);
    Route::post('products/{id}/adjust-stock', [ProductController::class, 'adjustStock']);

    // Cashflow routes (Owner only, read-only)
    Route::get('cashflow/summary', [\App\Http\Controllers\Api\CashFlowController::class, 'summary']);
    Route::get('cashflow/daily-breakdown', [\App\Http\Controllers\Api\CashFlowController::class, 'dailyBreakdown']);
    Route::get('cashflow', [\App\Http\Controllers\Api\CashFlowController::class, 'index']);

    // Reports routes (Owner only, read-only)
    Route::get('reports/sales', [\App\Http\Controllers\Api\ReportController::class, 'sales']);
    Route::get('reports/raw-material-purchases', [\App\Http\Controllers\Api\ReportController::class, 'rawMaterialPurchases']);
    Route::get('reports/stock', [\App\Http\Controllers\Api\ReportController::class, 'stock']);
    Route::get('reports/profit-loss', [\App\Http\Controllers\Api\ReportController::class, 'profitLoss']);

    // Dashboard (Owner only)
    Route::get('dashboard/summary', [\App\Http\Controllers\Api\DashboardController::class, 'summary']);

    // Store Settings (Owner only, single-row get/update)
    Route::get('store-settings', [\App\Http\Controllers\Api\StoreSettingController::class, 'show']);
    Route::put('store-settings', [\App\Http\Controllers\Api\StoreSettingController::class, 'update']);

    // User Management (Owner only, kasir accounts)
    Route::get('users', [\App\Http\Controllers\Api\UserController::class, 'index']);
    Route::post('users', [\App\Http\Controllers\Api\UserController::class, 'store']);
    Route::put('users/{id}', [\App\Http\Controllers\Api\UserController::class, 'update']);
    Route::patch('users/{id}/toggle-active', [\App\Http\Controllers\Api\UserController::class, 'toggleActive']);
    Route::delete('users/{id}', [\App\Http\Controllers\Api\UserController::class, 'destroy']);
});

Route::middleware(['auth:api', 'role:owner,kasir'])->group(function () {
    Route::get('pos/products', [\App\Http\Controllers\Api\PosController::class, 'getProducts']);
    Route::get('pos/categories', [\App\Http\Controllers\Api\PosController::class, 'getCategories']);
    Route::get('pos/settings', [\App\Http\Controllers\Api\PosController::class, 'getSettings']);
    Route::post('pos/transactions', [\App\Http\Controllers\Api\PosController::class, 'storeTransaction']);
    
    // Transaction History (read-only by design)
    // Note: No PUT/PATCH/DELETE endpoints exist for transactions to maintain data integrity
    Route::get('transactions', [\App\Http\Controllers\Api\TransactionController::class, 'index']);
    Route::get('transactions/{id}', [\App\Http\Controllers\Api\TransactionController::class, 'show']);
});

Route::middleware(['auth:api', 'role:kasir'])->group(function () {
    // Step 6: POS interface (cart, payment, receipt) will go here
});