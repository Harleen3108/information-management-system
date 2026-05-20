<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Traits\LogsActivity;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    use LogsActivity;

    /**
     * Return all settings. Super Admin only.
     */
    public function index(Request $request)
    {
        if (!$request->user()->hasRole('Admin')) {
            return response()->json(['message' => 'You do not have permission to access system configuration.'], 403);
        }

        $settings = Setting::all()->groupBy('group')->map(function ($items) {
            return $items->pluck('value', 'key');
        });

        return response()->json($settings);
    }

    /**
     * Bulk update settings. Super Admin only.
     */
    public function update(Request $request)
    {
        if (!$request->user()->hasRole('Admin')) {
            return response()->json(['message' => 'You do not have permission to edit system configuration.'], 403);
        }

        $request->validate([
            'settings' => 'required|array',
            'settings.*.key' => 'required|string',
            'settings.*.value' => 'nullable|string',
            'settings.*.group' => 'sometimes|string',
        ]);

        foreach ($request->settings as $item) {
            Setting::updateOrCreate(
                ['key' => $item['key']],
                [
                    'value' => $item['value'] ?? '',
                    'group' => $item['group'] ?? 'general',
                ]
            );
        }

        $this->logActivity('settings_updated', 'Setting', null, [
            'keys' => array_column($request->settings, 'key'),
        ]);

        return response()->json(['message' => 'Settings updated successfully']);
    }
}
