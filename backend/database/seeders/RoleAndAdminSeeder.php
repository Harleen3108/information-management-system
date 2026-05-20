<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Department;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use Illuminate\Support\Facades\Hash;

class RoleAndAdminSeeder extends Seeder
{
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Create Permissions
        $permissions = [
            // Dashboard
            'dashboard.view',
            // Users
            'users.view', 'users.create', 'users.edit', 'users.delete',
            // Departments
            'departments.view', 'departments.create', 'departments.edit', 'departments.delete',
            // Records
            'records.view', 'records.create', 'records.edit', 'records.delete',
            'records.submit', 'records.download',
            // Approvals
            'records.approve', 'records.reject',
            // Categories
            'categories.view', 'categories.create', 'categories.edit', 'categories.delete',
            // Settings
            'settings.view', 'settings.edit',
            // Activity Logs
            'logs.view',
            // Notifications
            'notifications.view',
            // Profile
            'profile.manage',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission]);
        }

        // ─── Create 3 Roles ───

        // 1. Admin: Full permissions to manage settings, users, and final approvals
        $admin = Role::firstOrCreate(['name' => 'Admin']);
        $admin->syncPermissions(Permission::all());

        // 2. Manager: Department approval control layer
        $manager = Role::firstOrCreate(['name' => 'Manager']);
        $manager->syncPermissions([
            'dashboard.view',
            'users.view', 'users.create', 'users.edit', 'users.delete',
            'departments.view', 'departments.create', 'departments.edit', 'departments.delete',
            'records.view', 'records.create', 'records.edit', 'records.delete',
            'records.submit', 'records.download',
            'records.approve', 'records.reject',
            'categories.view', 'categories.create', 'categories.edit', 'categories.delete',
            'logs.view',
            'notifications.view',
            'profile.manage',
        ]);

        // 3. Employee: Submission layer
        $employee = Role::firstOrCreate(['name' => 'Employee']);
        $employee->syncPermissions([
            'dashboard.view',
            'records.view', 'records.create', 'records.edit', 'records.submit', 'records.download',
            'notifications.view',
            'profile.manage',
        ]);

        // ─── Create Departments ───
        $itDept = Department::firstOrCreate(
            ['name' => 'IT Department'],
            ['description' => 'Information Technology and Systems']
        );

        $hrDept = Department::firstOrCreate(
            ['name' => 'HR Department'],
            ['description' => 'Human Resources']
        );

        // ─── Create the 3 clean Users ───
        
        // Admin User
        $adminUser = User::updateOrCreate(
            ['email' => 'admin@ims.com'],
            [
                'name' => 'Admin User',
                'password' => Hash::make('password'),
                'department_id' => $itDept->id,
                'status' => 'active'
            ]
        );
        $adminUser->syncRoles([$admin]);

        // Manager User
        $managerUser = User::updateOrCreate(
            ['email' => 'manager@ims.com'],
            [
                'name' => 'Manager User',
                'password' => Hash::make('password'),
                'department_id' => $hrDept->id,
                'status' => 'active'
            ]
        );
        $managerUser->syncRoles([$manager]);

        // Employee User
        $employeeUser = User::updateOrCreate(
            ['email' => 'employee@ims.com'],
            [
                'name' => 'Employee User',
                'password' => Hash::make('password'),
                'department_id' => $hrDept->id,
                'status' => 'active'
            ]
        );
        $employeeUser->syncRoles([$employee]);
    }
}
