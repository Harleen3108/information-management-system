<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Record;
use App\Models\Category;
use App\Models\Department;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DashboardAndSearchTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\RoleAndAdminSeeder::class);
        $this->seed(\Database\Seeders\CategorySeeder::class);
    }

    private function adminUser(): User
    {
        return User::where('email', 'admin@ims.com')->first();
    }

    private function createRecordAt(string $datetime): Record
    {
        $cat = Category::first();
        $dept = Department::first();
        $user = $this->adminUser();

        $record = Record::create([
            'title' => 'Test Record ' . $datetime,
            'description' => 'Created at ' . $datetime,
            'category_id' => $cat->id,
            'department_id' => $dept->id,
            'uploaded_by' => $user->id,
            'status' => 'draft',
        ]);

        // Manually set created_at
        $record->update(['created_at' => $datetime]);

        return $record;
    }

    // ─── Dashboard Period Tests ───

    public function test_dashboard_returns_chart_data_for_today()
    {
        $this->createRecordAt(now()->format('Y-m-d H:i:s'));

        $response = $this->actingAs($this->adminUser())
            ->getJson('/api/dashboard?period=today');

        $response->assertOk();
        $response->assertJsonStructure(['chart_data']);

        $chartData = $response->json('chart_data');
        $this->assertCount(24, $chartData); // 24 hours
        $this->assertEquals('00:00', $chartData[0]['label']);
        $this->assertEquals('23:00', $chartData[23]['label']);
    }

    public function test_dashboard_returns_chart_data_for_7days()
    {
        $this->createRecordAt(now()->subDays(2)->format('Y-m-d H:i:s'));

        $response = $this->actingAs($this->adminUser())
            ->getJson('/api/dashboard?period=7days');

        $response->assertOk();
        $chartData = $response->json('chart_data');
        $this->assertGreaterThanOrEqual(7, count($chartData));
        // Each label should be like "May 15"
        $this->assertMatchesRegularExpression('/^[A-Z][a-z]{2} \d{2}$/', $chartData[0]['label']);
    }

    public function test_dashboard_returns_chart_data_for_30days()
    {
        $response = $this->actingAs($this->adminUser())
            ->getJson('/api/dashboard?period=30days');

        $response->assertOk();
        $chartData = $response->json('chart_data');
        $this->assertGreaterThanOrEqual(30, count($chartData));
    }

    public function test_dashboard_returns_chart_data_for_year()
    {
        $response = $this->actingAs($this->adminUser())
            ->getJson('/api/dashboard?period=year');

        $response->assertOk();
        $chartData = $response->json('chart_data');
        $this->assertCount(12, $chartData); // 12 months
        $this->assertEquals('Jan', $chartData[0]['label']);
        $this->assertEquals('Dec', $chartData[11]['label']);
    }

    public function test_dashboard_defaults_to_today()
    {
        $response = $this->actingAs($this->adminUser())
            ->getJson('/api/dashboard');

        $response->assertOk();
        $chartData = $response->json('chart_data');
        $this->assertCount(24, $chartData);
    }

    public function test_dashboard_chart_includes_record_counts()
    {
        // Create a record right now
        $this->createRecordAt(now()->format('Y-m-d H:i:s'));

        $response = $this->actingAs($this->adminUser())
            ->getJson('/api/dashboard?period=today');

        $chartData = $response->json('chart_data');
        $currentHour = (int) now()->format('H');
        $this->assertGreaterThanOrEqual(1, $chartData[$currentHour]['count']);
    }

    // ─── Search Tests ───

    public function test_users_search_by_name()
    {
        $response = $this->actingAs($this->adminUser())
            ->getJson('/api/users?search=Admin');

        $response->assertOk();
        $this->assertTrue(
            collect($response->json())->contains(fn ($u) => str_contains($u['name'], 'Admin'))
        );
    }

    public function test_users_search_by_email()
    {
        $response = $this->actingAs($this->adminUser())
            ->getJson('/api/users?search=admin@ims');

        $response->assertOk();
        $this->assertGreaterThanOrEqual(1, count($response->json()));
    }

    public function test_users_search_returns_empty_for_nonexistent()
    {
        $response = $this->actingAs($this->adminUser())
            ->getJson('/api/users?search=nonexistentuserxyz123');

        $response->assertOk();
        $this->assertCount(0, $response->json());
    }

    public function test_departments_search_by_name()
    {
        $response = $this->actingAs($this->adminUser())
            ->getJson('/api/departments?search=IT');

        $response->assertOk();
        $this->assertTrue(
            collect($response->json())->contains(fn ($d) => str_contains($d['name'], 'IT'))
        );
    }

    public function test_categories_search_by_name()
    {
        $response = $this->actingAs($this->adminUser())
            ->getJson('/api/categories?search=General');

        $response->assertOk();
        $this->assertTrue(
            collect($response->json())->contains(fn ($c) => str_contains($c['name'], 'General'))
        );
    }

    public function test_categories_search_returns_empty()
    {
        $response = $this->actingAs($this->adminUser())
            ->getJson('/api/categories?search=nonexistentcategoryzzz');

        $response->assertOk();
        $this->assertCount(0, $response->json());
    }

    public function test_activity_logs_search_by_action()
    {
        // Trigger an activity by logging in
        $this->postJson('/api/login', [
            'email' => 'admin@ims.com',
            'password' => 'password',
        ]);

        $response = $this->actingAs($this->adminUser())
            ->getJson('/api/activity-logs?search=login');

        $response->assertOk();
        // May or may not have results depending on login logging, but should not error
        $response->assertJsonStructure(['data']);
    }

    public function test_records_search_by_title()
    {
        $cat = Category::first();
        $dept = Department::first();
        $user = $this->adminUser();

        Record::create([
            'title' => 'Unique Searchable Title XYZ',
            'description' => 'Test description',
            'category_id' => $cat->id,
            'department_id' => $dept->id,
            'uploaded_by' => $user->id,
            'status' => 'draft',
        ]);

        $response = $this->actingAs($user)
            ->getJson('/api/records?search=Unique Searchable');

        $response->assertOk();
        $this->assertTrue(
            collect($response->json('data'))->contains(fn ($r) => str_contains($r['title'], 'Unique Searchable'))
        );
    }

    public function test_records_search_returns_empty()
    {
        $response = $this->actingAs($this->adminUser())
            ->getJson('/api/records?search=absolutelynonexistent999');

        $response->assertOk();
        $this->assertCount(0, $response->json('data'));
    }
}
