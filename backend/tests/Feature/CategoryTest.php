<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Department;
use App\Models\Record;
use App\Models\User;
use Database\Seeders\CategorySeeder;
use Database\Seeders\RoleAndAdminSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CategoryTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private string $token;

    protected function setUp(): void
    {
        parent::setUp();

        // Run seeders to create roles, permissions, and categories
        $this->seed(RoleAndAdminSeeder::class);
        $this->seed(CategorySeeder::class);

        // Get the seeded admin user and create a token
        $this->admin = User::where('email', 'admin@ims.com')->first();
        $this->token = $this->admin->createToken('test')->plainTextToken;
    }

    // ──────────────────────────────────────────────
    // SEEDER TESTS
    // ──────────────────────────────────────────────

    public function test_category_seeder_creates_all_six_default_categories(): void
    {
        $categories = Category::pluck('name')->toArray();

        $this->assertCount(6, $categories);
        $this->assertContains('General', $categories);
        $this->assertContains('HR', $categories);
        $this->assertContains('Finance', $categories);
        $this->assertContains('Projects', $categories);
        $this->assertContains('Legal', $categories);
        $this->assertContains('IT', $categories);
    }

    public function test_category_seeder_generates_slugs_automatically(): void
    {
        $category = Category::where('name', 'General')->first();

        $this->assertNotNull($category);
        $this->assertEquals('general', $category->slug);
    }

    public function test_category_seeder_is_idempotent(): void
    {
        // Run the seeder a second time
        $this->seed(CategorySeeder::class);

        // Should still be exactly 6 categories, not 12
        $this->assertCount(6, Category::all());
    }

    // ──────────────────────────────────────────────
    // API TESTS — GET /api/categories
    // ──────────────────────────────────────────────

    public function test_categories_api_returns_all_seeded_categories(): void
    {
        $response = $this->withToken($this->token)
            ->getJson('/api/categories');

        $response->assertStatus(200)
            ->assertJsonCount(6)
            ->assertJsonFragment(['name' => 'General'])
            ->assertJsonFragment(['name' => 'HR'])
            ->assertJsonFragment(['name' => 'Finance'])
            ->assertJsonFragment(['name' => 'Projects'])
            ->assertJsonFragment(['name' => 'Legal'])
            ->assertJsonFragment(['name' => 'IT']);
    }

    public function test_categories_api_includes_record_counts(): void
    {
        $response = $this->withToken($this->token)
            ->getJson('/api/categories');

        $response->assertStatus(200);

        // Each category should have a records_count key
        $data = $response->json();
        foreach ($data as $category) {
            $this->assertArrayHasKey('records_count', $category);
        }
    }

    public function test_categories_api_requires_authentication(): void
    {
        $response = $this->getJson('/api/categories');
        $response->assertStatus(401);
    }

    // ──────────────────────────────────────────────
    // API TESTS — POST /api/categories
    // ──────────────────────────────────────────────

    public function test_admin_can_create_category(): void
    {
        $response = $this->withToken($this->token)
            ->postJson('/api/categories', ['name' => 'Marketing']);

        $response->assertStatus(201)
            ->assertJsonFragment(['name' => 'Marketing']);

        $this->assertDatabaseHas('categories', ['name' => 'Marketing', 'slug' => 'marketing']);
    }

    public function test_create_category_fails_without_name(): void
    {
        $response = $this->withToken($this->token)
            ->postJson('/api/categories', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name']);
    }

    public function test_create_category_fails_with_duplicate_name(): void
    {
        $response = $this->withToken($this->token)
            ->postJson('/api/categories', ['name' => 'General']);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name']);
    }

    // ──────────────────────────────────────────────
    // API TESTS — DELETE /api/categories/{id}
    // ──────────────────────────────────────────────

    public function test_admin_can_delete_category_without_records(): void
    {
        $category = Category::where('name', 'Legal')->first();

        $response = $this->withToken($this->token)
            ->deleteJson("/api/categories/{$category->id}");

        $response->assertStatus(200)
            ->assertJsonFragment(['message' => 'Category deleted successfully.']);

        $this->assertDatabaseMissing('categories', ['id' => $category->id]);
    }

    public function test_cannot_delete_category_with_records(): void
    {
        $category = Category::where('name', 'General')->first();
        $department = Department::first();

        // Create a record linked to this category
        Record::create([
            'title' => 'Test Record',
            'category_id' => $category->id,
            'department_id' => $department->id,
            'uploaded_by' => $this->admin->id,
            'status' => 'draft',
        ]);

        $response = $this->withToken($this->token)
            ->deleteJson("/api/categories/{$category->id}");

        $response->assertStatus(422)
            ->assertJsonFragment(['message' => 'Cannot delete category that has associated records. Reassign or delete the records first.']);
    }

    // ──────────────────────────────────────────────
    // RECORD CREATION WITH SEEDED CATEGORY
    // ──────────────────────────────────────────────

    public function test_record_can_be_created_using_seeded_category(): void
    {
        $category = Category::where('name', 'Finance')->first();
        $department = Department::first();

        $response = $this->withToken($this->token)
            ->postJson('/api/records', [
                'title' => 'Q1 Financial Report',
                'description' => 'Quarterly financial report',
                'category_id' => $category->id,
                'department_id' => $department->id,
                'status' => 'draft',
            ]);

        $response->assertStatus(201)
            ->assertJsonFragment(['title' => 'Q1 Financial Report']);

        $this->assertDatabaseHas('records', [
            'title' => 'Q1 Financial Report',
            'category_id' => $category->id,
        ]);
    }

    public function test_record_creation_fails_with_invalid_category(): void
    {
        $department = Department::first();

        $response = $this->withToken($this->token)
            ->postJson('/api/records', [
                'title' => 'Bad Record',
                'category_id' => 9999,
                'department_id' => $department->id,
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['category_id']);
    }
}
