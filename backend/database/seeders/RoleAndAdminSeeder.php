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

        // Create Roles
        $superAdmin = Role::create(['name' => 'Super Admin']);
        $admin = Role::create(['name' => 'Admin']);
        $manager = Role::create(['name' => 'Manager']);
        $employee = Role::create(['name' => 'Employee']);
        $viewer = Role::create(['name' => 'Viewer']);

        // Create initial Department
        $itDept = Department::create([
            'name' => 'IT Department',
            'description' => 'Information Technology and Systems'
        ]);

        // Create Super Admin User
        $user = User::create([
            'name' => 'Super Admin',
            'email' => 'admin@ims.com',
            'password' => Hash::make('password'),
            'department_id' => $itDept->id,
            'status' => 'active'
        ]);

        $user->assignRole($superAdmin);
    }
}
