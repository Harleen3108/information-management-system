<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Record;
use App\Models\Document;
use App\Models\Department;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $period = $request->get('period', 'today');

        $stats = [
            'total_users' => User::count(),
            'total_documents' => Document::count(),
            'total_records' => Record::count(),
            'total_departments' => Department::count(),
            'pending_approvals' => Record::where('status', 'pending')->count(),
            'approved_records' => Record::where('status', 'approved')->count(),
            'rejected_records' => Record::where('status', 'rejected')->count(),
            'draft_records' => Record::where('status', 'draft')->count(),
            'active_users' => User::where('status', 'active')->count(),
            'department_stats' => Department::withCount('records', 'users')->get(),
            'recent_uploads' => Record::with('uploader', 'category')
                ->latest()
                ->take(5)
                ->get(),
            'recent_activity' => ActivityLog::with('user')
                ->latest()
                ->take(10)
                ->get(),
            'records_by_status' => Record::select('status', DB::raw('count(*) as count'))
                ->groupBy('status')
                ->get(),
            'chart_data' => $this->getChartData($period),
        ];

        return response()->json($stats);
    }

    private function getChartData(string $period): array
    {
        $now = Carbon::now();

        return match ($period) {
            'today' => $this->getHourlyData($now->copy()->startOfDay(), $now),
            '7days' => $this->getDailyData($now->copy()->subDays(6)->startOfDay(), $now),
            '30days' => $this->getDailyData($now->copy()->subDays(29)->startOfDay(), $now),
            'year' => $this->getMonthlyData($now->copy()->startOfYear(), $now),
            default => $this->getHourlyData($now->copy()->startOfDay(), $now),
        };
    }

    private function getHourlyData(Carbon $from, Carbon $to): array
    {
        $driver = DB::getDriverName();

        $hourExpr = match ($driver) {
            'sqlite' => "CAST(strftime('%H', created_at) AS INTEGER)",
            'mysql', 'mariadb' => 'HOUR(created_at)',
            'pgsql' => "EXTRACT(HOUR FROM created_at)::integer",
            default => "CAST(strftime('%H', created_at) AS INTEGER)",
        };

        $records = Record::whereBetween('created_at', [$from, $to])
            ->select(
                DB::raw("{$hourExpr} as hour"),
                DB::raw('count(*) as count')
            )
            ->groupBy('hour')
            ->orderBy('hour')
            ->pluck('count', 'hour')
            ->toArray();

        $data = [];
        for ($h = 0; $h < 24; $h++) {
            $data[] = [
                'label' => str_pad($h, 2, '0', STR_PAD_LEFT) . ':00',
                'count' => $records[$h] ?? 0,
            ];
        }

        return $data;
    }

    private function getDailyData(Carbon $from, Carbon $to): array
    {
        $driver = DB::getDriverName();

        $dateExpr = match ($driver) {
            'sqlite' => "strftime('%Y-%m-%d', created_at)",
            'mysql', 'mariadb' => 'DATE(created_at)',
            'pgsql' => "TO_CHAR(created_at, 'YYYY-MM-DD')",
            default => "strftime('%Y-%m-%d', created_at)",
        };

        $records = Record::whereBetween('created_at', [$from, $to])
            ->select(
                DB::raw("{$dateExpr} as date"),
                DB::raw('count(*) as count')
            )
            ->groupBy('date')
            ->orderBy('date')
            ->pluck('count', 'date')
            ->toArray();

        $data = [];
        $cursor = $from->copy();
        while ($cursor->lte($to->copy()->startOfDay())) {
            $key = $cursor->format('Y-m-d');
            $data[] = [
                'label' => $cursor->format('M d'),
                'count' => $records[$key] ?? 0,
            ];
            $cursor->addDay();
        }

        return $data;
    }

    private function getMonthlyData(Carbon $from, Carbon $to): array
    {
        $driver = DB::getDriverName();

        $monthExpr = match ($driver) {
            'sqlite' => "strftime('%m', created_at)",
            'mysql', 'mariadb' => "LPAD(MONTH(created_at), 2, '0')",
            'pgsql' => "TO_CHAR(created_at, 'MM')",
            default => "strftime('%m', created_at)",
        };

        $records = Record::whereBetween('created_at', [$from, $to])
            ->select(
                DB::raw("{$monthExpr} as month_num"),
                DB::raw('count(*) as count')
            )
            ->groupBy('month_num')
            ->orderBy('month_num')
            ->pluck('count', 'month_num')
            ->toArray();

        $months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        $data = [];
        for ($m = 1; $m <= 12; $m++) {
            $key = str_pad($m, 2, '0', STR_PAD_LEFT);
            $data[] = [
                'label' => $months[$m - 1],
                'count' => $records[$key] ?? 0,
            ];
        }

        return $data;
    }
}
