<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Record;
use App\Models\Document;
use App\Models\Department;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index()
    {
        $stats = [
            'total_users' => User::count(),
            'total_documents' => Document::count(),
            'total_records' => Record::count(),
            'pending_approvals' => Record::where('status', 'pending')->count(),
            'department_stats' => Department::withCount('records')->get(),
            'recent_uploads' => Record::with('uploader', 'category')->latest()->take(5)->get(),
            'monthly_uploads' => Record::select(DB::raw('count(*) as count'), DB::raw('MONTHNAME(created_at) as month'))
                ->groupBy('month')
                ->orderBy('created_at')
                ->get(),
        ];

        return response()->json($stats);
    }
}
