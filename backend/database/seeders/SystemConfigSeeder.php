<?php

namespace Database\Seeders;

use App\Models\Setting;
use Illuminate\Database\Seeder;

class SystemConfigSeeder extends Seeder
{
    public function run(): void
    {
        $defaults = [
            // General
            ['key' => 'app_name', 'value' => 'Information Management System', 'group' => 'general'],
            ['key' => 'organization_name', 'value' => 'Acme Corporation', 'group' => 'general'],
            ['key' => 'organization_logo', 'value' => '', 'group' => 'general'],
            ['key' => 'support_email', 'value' => 'support@acme.com', 'group' => 'general'],
            ['key' => 'timezone', 'value' => 'UTC', 'group' => 'general'],
            ['key' => 'date_format', 'value' => 'YYYY-MM-DD', 'group' => 'general'],

            // Workflow
            ['key' => 'require_approval', 'value' => 'true', 'group' => 'workflow'],
            ['key' => 'default_record_status', 'value' => 'draft', 'group' => 'workflow'],
            ['key' => 'allow_edit_submitted', 'value' => 'false', 'group' => 'workflow'],
            ['key' => 'auto_archive_days', 'value' => '90', 'group' => 'workflow'],

            // File Upload
            ['key' => 'max_upload_size_mb', 'value' => '10', 'group' => 'file_upload'],
            ['key' => 'allowed_file_types', 'value' => 'pdf,docx,xlsx,jpg,png', 'group' => 'file_upload'],

            // Notifications
            ['key' => 'enable_in_app_notifications', 'value' => 'true', 'group' => 'notifications'],
            ['key' => 'enable_email_notifications', 'value' => 'false', 'group' => 'notifications'],
            ['key' => 'notify_manager_on_submission', 'value' => 'true', 'group' => 'notifications'],
            ['key' => 'notify_employee_on_decision', 'value' => 'true', 'group' => 'notifications'],

            // Security
            ['key' => 'session_timeout_minutes', 'value' => '30', 'group' => 'security'],
            ['key' => 'min_password_length', 'value' => '8', 'group' => 'security'],
            ['key' => 'require_strong_password', 'value' => 'true', 'group' => 'security'],
        ];

        foreach ($defaults as $setting) {
            Setting::firstOrCreate(
                ['key' => $setting['key']],
                ['value' => $setting['value'], 'group' => $setting['group']]
            );
        }
    }
}
