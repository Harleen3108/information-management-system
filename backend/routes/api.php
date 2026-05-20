<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\DepartmentController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\RecordController;
use App\Http\Controllers\Api\ApprovalController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\SettingController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\ActivityLogController;
use App\Http\Controllers\Api\AttachmentController;
use App\Http\Controllers\Api\ManagerDashboardController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Public Routes
Route::post('/login', [AuthController::class, 'login']);

// Protected Routes
Route::middleware('auth:sanctum')->group(function () {
    // Auth
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/change-password', [AuthController::class, 'changePassword']);

    // Dashboard Stats
    Route::get('/dashboard', [DashboardController::class, 'index']);

    // Roles list (for dropdowns)
    Route::get('/roles', [UserController::class, 'roles']);

    // User Management
    Route::apiResource('users', UserController::class);
    Route::post('/users/{user}/reset-password', [UserController::class, 'resetPassword']);
    Route::post('/users/{user}/toggle-status', [UserController::class, 'toggleStatus']);

    // Department Management
    Route::apiResource('departments', DepartmentController::class);

    // DMS Core
    Route::apiResource('categories', CategoryController::class);
    Route::apiResource('records', RecordController::class);
    Route::post('/records/{record}/submit', [RecordController::class, 'submitForApproval']);

    // Workflow / Approvals
    Route::post('/records/{record}/review', [ApprovalController::class, 'review']);
    Route::post('/records/{record}/approve', [ApprovalController::class, 'approve']);
    Route::post('/records/{record}/reject', [ApprovalController::class, 'reject']);
    Route::post('/records/{record}/return', [ApprovalController::class, 'returnForRevision']);

    // File Downloads & Preview
    Route::get('/attachments/{document}/download', [AttachmentController::class, 'download']);
    Route::get('/attachments/{document}/preview', [AttachmentController::class, 'preview']);

    // Settings
    Route::get('/settings', [SettingController::class, 'index']);
    Route::put('/settings', [SettingController::class, 'update']);

    // Notifications
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount']);
    Route::post('/notifications/{notification}/read', [NotificationController::class, 'markAsRead']);
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllAsRead']);

    // Activity Logs
    Route::get('/activity-logs', [ActivityLogController::class, 'index']);
    Route::get('/activity-logs/actions', [ActivityLogController::class, 'actions']);

    // Manager Panel Routes
    Route::prefix('manager')->group(function () {
        Route::get('/dashboard', [ManagerDashboardController::class, 'index']);
        Route::get('/records',   [ManagerDashboardController::class, 'records']);
        Route::get('/team',      [ManagerDashboardController::class, 'team']);
    });
});
