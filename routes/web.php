<?php

use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\BranchController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\OwnerDashboardController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\PurchaseController;
use App\Http\Controllers\SaleController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\StockController;
use App\Http\Controllers\SupplierController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

Route::redirect('/', '/login')->name('home');

Route::get('/install', function () {
    return inertia('install/index');
})->name('install');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');

    Route::resource('categories', CategoryController::class);
    Route::resource('products', ProductController::class);
    Route::resource('customers', CustomerController::class);
    Route::resource('suppliers', SupplierController::class);
    Route::resource('branches', BranchController::class);
    Route::resource('users', UserController::class);
    Route::get('reports', [ReportController::class, 'index'])->name('reports.index');

    Route::prefix('inventory')->name('inventory.')->group(function () {
        Route::get('/', [StockController::class, 'index'])->name('index');
        Route::get('/history/{product}', [StockController::class, 'history'])->name('history');
        Route::get('/adjustment/{product}', [StockController::class, 'adjustment'])->name('adjustment');
        Route::post('/adjustment/{product}', [StockController::class, 'processAdjustment'])->name('processAdjustment');
        Route::get('/movements/{type}', [StockController::class, 'movements'])->name('movements');
    });

    Route::prefix('purchases')->name('purchases.')->group(function () {
        Route::get('/', [PurchaseController::class, 'index'])->name('index');
        Route::get('/create', [PurchaseController::class, 'create'])->name('create');
        Route::post('/', [PurchaseController::class, 'store'])->name('store');
        Route::get('/{purchase}', [PurchaseController::class, 'show'])->name('show');
        Route::get('/{purchase}/edit', [PurchaseController::class, 'edit'])->name('edit');
        Route::put('/{purchase}', [PurchaseController::class, 'update'])->name('update');
        Route::delete('/{purchase}', [PurchaseController::class, 'destroy'])->name('destroy');
        Route::get('/{purchase}/receive', [PurchaseController::class, 'receive'])->name('receive');
        Route::post('/{purchase}/receive', [PurchaseController::class, 'processReceive'])->name('processReceive');
    });

    Route::prefix('pos')->name('pos.')->group(function () {
        Route::get('/', [SaleController::class, 'pos'])->name('index');
        Route::post('/sales', [SaleController::class, 'store'])->name('store');
        Route::get('/receipt/{sale}', [SaleController::class, 'receipt'])->name('receipt');
    });

    Route::prefix('sales')->name('sales.')->group(function () {
        Route::get('/', [SaleController::class, 'index'])->name('index');
        Route::get('/{sale}', [SaleController::class, 'show'])->name('show');
    });

    Route::prefix('attendance')->name('attendance.')->group(function () {
        Route::get('/', [AttendanceController::class, 'index'])->name('index');
        Route::post('/clock-in', [AttendanceController::class, 'clockIn'])->name('clockIn');
        Route::post('/clock-out', [AttendanceController::class, 'clockOut'])->name('clockOut');
        Route::post('/request-leave', [AttendanceController::class, 'requestLeave'])->name('requestLeave');
        Route::get('/statistics', [AttendanceController::class, 'statistics'])->name('statistics');
    });


    Route::get('owner-dashboard', [OwnerDashboardController::class, 'index'])->name('owner-dashboard');
});

require __DIR__.'/settings.php';
