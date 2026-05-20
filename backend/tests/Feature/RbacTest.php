<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Department;
use App\Models\Document;
use App\Models\Record;
use App\Models\User;
use Database\Seeders\CategorySeeder;
use Database\Seeders\RoleAndAdminSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class RbacTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private User $manager;
    private User $employee;
    private string $adminToken;
    private string $managerToken;
    private string $employeeToken;
    private Department $department;
    private Category $category;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleAndAdminSeeder::class);
        $this->seed(CategorySeeder::class);

        $this->admin = User::where('email', 'admin@ims.com')->first();
        $this->manager = User::where('email', 'manager@ims.com')->first();
        $this->employee = User::where('email', 'employee@ims.com')->first();

        $this->adminToken = $this->admin->createToken('t')->plainTextToken;
        $this->managerToken = $this->manager->createToken('t')->plainTextToken;
        $this->employeeToken = $this->employee->createToken('t')->plainTextToken;

        $this->department = Department::first();
        $this->category = Category::first();
    }

    // ── Permission assignment tests ──

    public function test_admin_has_full_operational_and_settings_permissions(): void
    {
        $this->assertTrue($this->admin->can('users.create'));
        $this->assertTrue($this->admin->can('records.approve'));
        $this->assertTrue($this->admin->can('records.download'));
        $this->assertTrue($this->admin->can('settings.view'));
        $this->assertTrue($this->admin->can('settings.edit'));
    }

    public function test_manager_has_approval_permissions(): void
    {
        $this->assertTrue($this->manager->can('records.approve'));
        $this->assertTrue($this->manager->can('records.reject'));
        $this->assertTrue($this->manager->can('users.view'));
        $this->assertTrue($this->manager->can('records.download'));
        // Manager must NOT have settings access
        $this->assertFalse($this->manager->can('settings.view'));
        $this->assertFalse($this->manager->can('settings.edit'));
    }

    public function test_employee_has_limited_permissions(): void
    {
        $this->assertTrue($this->employee->can('records.view'));
        $this->assertTrue($this->employee->can('records.create'));
        $this->assertTrue($this->employee->can('records.edit'));
        $this->assertTrue($this->employee->can('records.submit'));
        $this->assertTrue($this->employee->can('records.download'));
        $this->assertTrue($this->employee->can('notifications.view'));
        $this->assertTrue($this->employee->can('profile.manage'));
        // Employee must NOT have these
        $this->assertFalse($this->employee->can('users.view'));
        $this->assertFalse($this->employee->can('departments.view'));
        $this->assertFalse($this->employee->can('records.approve'));
        $this->assertFalse($this->employee->can('records.reject'));
        $this->assertFalse($this->employee->can('records.delete'));
        $this->assertFalse($this->employee->can('settings.view'));
        $this->assertFalse($this->employee->can('logs.view'));
    }

    // ── Employee record visibility ──

    public function test_employee_sees_own_records_in_list(): void
    {
        // Create records owned by employee
        Record::create(['title' => 'My Record 1', 'category_id' => $this->category->id, 'department_id' => $this->department->id, 'uploaded_by' => $this->employee->id, 'status' => 'draft']);
        Record::create(['title' => 'My Record 2', 'category_id' => $this->category->id, 'department_id' => $this->department->id, 'uploaded_by' => $this->employee->id, 'status' => 'approved']);

        $response = $this->withToken($this->employeeToken)->getJson('/api/records');
        $response->assertStatus(200);

        $titles = collect($response->json('data'))->pluck('title')->toArray();
        $this->assertContains('My Record 1', $titles);
        $this->assertContains('My Record 2', $titles);
    }

    public function test_employee_does_not_see_other_users_records(): void
    {
        // Record owned by admin
        Record::create(['title' => 'Admin Secret', 'category_id' => $this->category->id, 'department_id' => $this->department->id, 'uploaded_by' => $this->admin->id, 'status' => 'draft']);
        // Record owned by employee
        Record::create(['title' => 'Employee Own', 'category_id' => $this->category->id, 'department_id' => $this->department->id, 'uploaded_by' => $this->employee->id, 'status' => 'draft']);

        $response = $this->withToken($this->employeeToken)->getJson('/api/records');
        $response->assertStatus(200);

        $titles = collect($response->json('data'))->pluck('title')->toArray();
        $this->assertNotContains('Admin Secret', $titles);
        $this->assertContains('Employee Own', $titles);
    }

    // ── Dashboard chart real-time data ──

    public function test_dashboard_chart_reflects_new_records(): void
    {
        // Create a record right now
        Record::create(['title' => 'Fresh Record', 'category_id' => $this->category->id, 'department_id' => $this->department->id, 'uploaded_by' => $this->admin->id, 'status' => 'draft']);

        $response = $this->withToken($this->adminToken)->getJson('/api/dashboard?period=today');
        $response->assertStatus(200);

        $chartData = $response->json('chart_data');
        $this->assertIsArray($chartData);
        $this->assertNotEmpty($chartData);

        // At least one time slot should have count > 0
        $totalCount = collect($chartData)->sum('count');
        $this->assertGreaterThanOrEqual(1, $totalCount);
    }

    // ── Employee record operations ──

    public function test_employee_can_create_record(): void
    {
        $response = $this->withToken($this->employeeToken)->postJson('/api/records', [
            'title' => 'Employee Report',
            'category_id' => $this->category->id,
            'department_id' => $this->department->id,
            'status' => 'draft',
        ]);
        $response->assertStatus(201);
        $this->assertDatabaseHas('records', ['title' => 'Employee Report', 'uploaded_by' => $this->employee->id]);
    }

    public function test_employee_can_submit_own_record(): void
    {
        $record = Record::create([
            'title' => 'My Report', 'category_id' => $this->category->id,
            'department_id' => $this->department->id, 'uploaded_by' => $this->employee->id, 'status' => 'draft',
        ]);

        $response = $this->withToken($this->employeeToken)->postJson("/api/records/{$record->id}/submit");
        $response->assertStatus(200);
        $this->assertEquals('pending', $record->fresh()->status);
    }

    public function test_employee_cannot_approve_record(): void
    {
        $record = Record::create([
            'title' => 'Pending Record', 'category_id' => $this->category->id,
            'department_id' => $this->department->id, 'uploaded_by' => $this->employee->id, 'status' => 'pending',
        ]);

        $response = $this->withToken($this->employeeToken)->postJson("/api/records/{$record->id}/approve");
        $response->assertStatus(403);
    }

    public function test_employee_can_edit_own_draft_record(): void
    {
        $record = Record::create([
            'title' => 'Draft Report', 'category_id' => $this->category->id,
            'department_id' => $this->department->id, 'uploaded_by' => $this->employee->id, 'status' => 'draft',
        ]);

        $response = $this->withToken($this->employeeToken)->putJson("/api/records/{$record->id}", ['title' => 'Updated Draft']);
        $response->assertStatus(200);
        $this->assertEquals('Updated Draft', $record->fresh()->title);
    }

    public function test_employee_cannot_edit_others_record(): void
    {
        $record = Record::create([
            'title' => 'Admin Record', 'category_id' => $this->category->id,
            'department_id' => $this->department->id, 'uploaded_by' => $this->admin->id, 'status' => 'draft',
        ]);

        $response = $this->withToken($this->employeeToken)->putJson("/api/records/{$record->id}", ['title' => 'Hacked']);
        $response->assertStatus(403);
    }

    public function test_employee_cannot_edit_approved_record(): void
    {
        $record = Record::create([
            'title' => 'Approved Record', 'category_id' => $this->category->id,
            'department_id' => $this->department->id, 'uploaded_by' => $this->employee->id, 'status' => 'approved',
        ]);

        $response = $this->withToken($this->employeeToken)->putJson("/api/records/{$record->id}", ['title' => 'Changed']);
        $response->assertStatus(403);
    }

    // ── Download endpoint ──

    public function test_admin_can_download_attachment(): void
    {
        Storage::fake('public');
        Storage::disk('public')->put('records/1/test.pdf', 'fake-pdf-content');

        $record = Record::create([
            'title' => 'Doc Record', 'category_id' => $this->category->id,
            'department_id' => $this->department->id, 'uploaded_by' => $this->admin->id, 'status' => 'approved',
        ]);

        $document = Document::create([
            'record_id' => $record->id, 'file_name' => 'test.pdf',
            'file_path' => 'records/1/test.pdf', 'file_type' => 'pdf', 'file_size' => 1024,
        ]);

        $response = $this->withToken($this->adminToken)->get("/api/attachments/{$document->id}/download");
        $response->assertStatus(200);
        $response->assertDownload('test.pdf');
    }

    public function test_download_requires_authentication(): void
    {
        $response = $this->getJson('/api/attachments/1/download');
        $response->assertStatus(401);
    }

    // ── Unauthorized access returns 403 ──

    public function test_employee_cannot_access_users(): void
    {
        $response = $this->withToken($this->employeeToken)->postJson('/api/users', [
            'name' => 'Test', 'email' => 'test@test.com', 'password' => 'password123',
            'department_id' => $this->department->id, 'role' => 'Employee',
        ]);
        $response->assertStatus(403);
    }

    public function test_employee_cannot_access_settings(): void
    {
        $response = $this->withToken($this->employeeToken)->getJson('/api/settings');
        $response->assertStatus(403);
    }

    public function test_manager_cannot_access_settings(): void
    {
        $response = $this->withToken($this->managerToken)->getJson('/api/settings');
        $response->assertStatus(403);
    }

    public function test_admin_can_access_settings(): void
    {
        $response = $this->withToken($this->adminToken)->getJson('/api/settings');
        $response->assertStatus(200);
    }

    // ── Manager can approve ──

    public function test_manager_can_approve_record(): void
    {
        $record = Record::create([
            'title' => 'Needs Approval', 
            'category_id' => $this->category->id,
            'department_id' => $this->manager->department_id, 
            'uploaded_by' => $this->employee->id, 
            'status' => 'pending',
        ]);

        $response = $this->withToken($this->managerToken)->postJson("/api/records/{$record->id}/approve", ['comments' => 'Forwarding to admin']);
        $response->assertStatus(200);
        $this->assertEquals('in_review', $record->fresh()->status);
    }

    public function test_admin_can_final_approve_record(): void
    {
        $record = Record::create([
            'title' => 'Needs Final Approval', 
            'category_id' => $this->category->id,
            'department_id' => $this->department->id, 
            'uploaded_by' => $this->employee->id, 
            'status' => 'in_review',
        ]);

        $response = $this->withToken($this->adminToken)->postJson("/api/records/{$record->id}/approve", ['comments' => 'Looks perfect']);
        $response->assertStatus(200);
        $this->assertEquals('approved', $record->fresh()->status);
    }

    // ── /me returns permissions ──

    public function test_me_returns_permissions_for_employee(): void
    {
        $response = $this->withToken($this->employeeToken)->getJson('/api/me');
        $response->assertStatus(200)
            ->assertJsonStructure(['user', 'permissions']);

        $perms = $response->json('permissions');
        $this->assertContains('records.view', $perms);
        $this->assertContains('records.create', $perms);
        $this->assertContains('records.download', $perms);
        $this->assertNotContains('users.view', $perms);
        $this->assertNotContains('records.approve', $perms);
    }
}
