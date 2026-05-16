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

        // ─── Super Admin: Full access ───
        $superAdmin = Role::firstOrCreate(['name' => 'Super Admin']);
        $superAdmin->syncPermissions(Permission::all());

        // ─── Admin: Full operational access (no settings) ───
        $admin = Role::firstOrCreate(['name' => 'Admin']);
        $admin->syncPermissions([
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

        // ─── Manager: Same as Admin (can approve/reject, no settings) ───
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

        // ─── Employee: Dashboard, Records (own), Notifications, Profile ───
        $employee = Role::firstOrCreate(['name' => 'Employee']);
        $employee->syncPermissions([
            'dashboard.view',
            'records.view', 'records.create', 'records.edit', 'records.submit', 'records.download',
            'notifications.view',
            'profile.manage',
        ]);

        // ─── Viewer: Dashboard, Records (read-only + download), Profile ───
        $viewer = Role::firstOrCreate(['name' => 'Viewer']);
        $viewer->syncPermissions([
            'dashboard.view',
            'records.view', 'records.download',
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

        // ─── Create Test Users (one per role) ───
        $superAdminUser = User::updateOrCreate(
            ['email' => 'admin@ims.com'],
            ['name' => 'Super Admin', 'password' => Hash::make('password'), 'department_id' => $itDept->id, 'status' => 'active']
        );
        if (!$superAdminUser->hasRole('Super Admin')) $superAdminUser->syncRoles([$superAdmin]);

        $adminUser = User::updateOrCreate(
            ['email' => 'admin2@ims.com'],
            ['name' => 'Admin User', 'password' => Hash::make('password'), 'department_id' => $itDept->id, 'status' => 'active']
        );
        if (!$adminUser->hasRole('Admin')) $adminUser->syncRoles([$admin]);

        $managerUser = User::updateOrCreate(
            ['email' => 'manager@ims.com'],
            ['name' => 'Manager User', 'password' => Hash::make('password'), 'department_id' => $hrDept->id, 'status' => 'active']
        );
        if (!$managerUser->hasRole('Manager')) $managerUser->syncRoles([$manager]);

        $employeeUser = User::updateOrCreate(
            ['email' => 'employee@ims.com'],
            ['name' => 'Employee User', 'password' => Hash::make('password'), 'department_id' => $hrDept->id, 'status' => 'active']
        );
        if (!$employeeUser->hasRole('Employee')) $employeeUser->syncRoles([$employee]);

        $viewerUser = User::updateOrCreate(
            ['email' => 'viewer@ims.com'],
            ['name' => 'Viewer User', 'password' => Hash::make('password'), 'department_id' => $itDept->id, 'status' => 'active']
        );
        if (!$viewerUser->hasRole('Viewer')) $viewerUser->syncRoles([$viewer]);
    }
}
