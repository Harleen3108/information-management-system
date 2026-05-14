<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\DepartmentController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\RecordController;
use App\Http\Controllers\Api\ApprovalController;
use App\Http\Controllers\Api\DashboardController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Public Routes
Route::post('/login', [AuthController::class, 'login']);

// Protected Routes
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // Dashboard Stats
    Route::get('/dashboard', [DashboardController::class, 'index']);

    // User & Department Management
    Route::apiResource('users', UserController::class);
    Route::apiResource('departments', DepartmentController::class);
    
    // DMS Core
    Route::apiResource('categories', CategoryController::class);
    Route::apiResource('records', RecordController::class);
    
    // Workflow / Approvals
    Route::post('/records/{record}/approve', [ApprovalController::class, 'approve']);
    Route::post('/records/{record}/reject', [ApprovalController::class, 'reject']);
});
