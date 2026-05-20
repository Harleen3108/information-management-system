<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Record;
use App\Models\Document;
use App\Models\ActivityLog;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ManagerDashboardController extends Controller
{
    /**
     * GET /api/manager/dashboard
     * Returns manager-scoped stats for the authenticated manager's department.
     */
    public function index(Request $request)
    {
        $manager      = auth()->user();
        $departmentId = $manager->department_id;

        // ── Team Members ────────────────────────────────────────────────────
        $teamMembers = User::where('department_id', $departmentId)
            ->where('id', '!=', $manager->id)
            ->with('roles')
            ->get();

        $teamIds = $teamMembers->pluck('id')->push($manager->id)->toArray();

        // ── Records in this department ──────────────────────────────────────
        $deptRecords = Record::where('department_id', $departmentId);

        $stats = [
            'team_members'       => $teamMembers->count(),
            'total_submissions'  => (clone $deptRecords)->count(),
            'pending_approvals'  => (clone $deptRecords)->whereIn('status', ['pending', 'in_review'])->count(),
            'approved_records'   => (clone $deptRecords)->where('status', 'approved')->count(),
            'rejected_records'   => (clone $deptRecords)->where('status', 'rejected')->count(),
            'draft_records'      => (clone $deptRecords)->where('status', 'draft')->count(),
        ];

        // ── Recent Submissions ──────────────────────────────────────────────
        $recentSubmissions = Record::where('department_id', $departmentId)
            ->with(['uploader', 'category', 'documents'])
            ->latest()
            ->take(8)
            ->get();

        // ── Pending to Review ───────────────────────────────────────────────
        $pendingReview = Record::where('department_id', $departmentId)
            ->whereIn('status', ['pending', 'in_review'])
            ->with(['uploader', 'category', 'documents', 'approvals.user'])
            ->latest()
            ->take(20)
            ->get();

        // ── Team Activity Logs ──────────────────────────────────────────────
        $recentActivity = ActivityLog::whereIn('user_id', $teamIds)
            ->with('user')
            ->latest()
            ->take(10)
            ->get();

        // ── Chart: submissions last 14 days ─────────────────────────────────
        $chartData = $this->getSubmissionTrend($departmentId);

        // ── Per-member submission counts ────────────────────────────────────
        $memberStats = $teamMembers->map(function ($member) {
            $records = Record::where('uploaded_by', $member->id);
            return [
                'id'          => $member->id,
                'name'        => $member->name,
                'email'       => $member->email,
                'role'        => $member->roles->first()->name ?? 'Employee',
                'status'      => $member->status,
                'total'       => (clone $records)->count(),
                'pending'     => (clone $records)->whereIn('status', ['pending', 'in_review'])->count(),
                'approved'    => (clone $records)->where('status', 'approved')->count(),
                'rejected'    => (clone $records)->where('status', 'rejected')->count(),
                'last_active' => $member->updated_at,
            ];
        });

        // ── Category breakdown ──────────────────────────────────────────────
        $categoryBreakdown = Record::where('department_id', $departmentId)
            ->select('category_id', DB::raw('count(*) as count'))
            ->groupBy('category_id')
            ->with('category')
            ->get()
            ->map(fn($r) => [
                'name'  => $r->category->name ?? 'Uncategorized',
                'count' => $r->count,
            ]);

        return response()->json([
            'stats'              => $stats,
            'recent_submissions' => $recentSubmissions,
            'pending_review'     => $pendingReview,
            'recent_activity'    => $recentActivity,
            'chart_data'         => $chartData,
            'member_stats'       => $memberStats,
            'category_breakdown' => $categoryBreakdown,
            'department_id'      => $departmentId,
        ]);
    }

    /**
     * GET /api/manager/records
     * Records within manager's department with filters.
     */
    public function records(Request $request)
    {
        $manager      = auth()->user();
        $departmentId = $manager->department_id;

        $query = Record::where('department_id', $departmentId)
            ->with(['uploader', 'category', 'department', 'documents', 'approvals.user']);

        if ($request->filled('status'))      $query->where('status', $request->status);
        if ($request->filled('category_id')) $query->where('category_id', $request->category_id);
        if ($request->filled('uploaded_by')) $query->where('uploaded_by', $request->uploaded_by);
        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(fn($q) => $q->where('title', 'like', "%{$s}%")->orWhere('description', 'like', "%{$s}%"));
        }

        $sortBy  = $request->get('sort_by', 'created_at');
        $sortDir = $request->get('sort_dir', 'desc');
        $query->orderBy($sortBy, $sortDir);

        $perPage = min($request->get('per_page', 15), 100);
        return response()->json($query->paginate($perPage));
    }

    /**
     * GET /api/manager/team
     * All team members with their submission stats.
     */
    public function team(Request $request)
    {
        $manager      = auth()->user();
        $departmentId = $manager->department_id;

        $members = User::where('department_id', $departmentId)
            ->with('roles')
            ->get()
            ->map(function ($member) {
                $records = Record::where('uploaded_by', $member->id);
                return [
                    'id'          => $member->id,
                    'name'        => $member->name,
                    'email'       => $member->email,
                    'role'        => $member->roles->first()->name ?? 'Employee',
                    'status'      => $member->status,
                    'total'       => (clone $records)->count(),
                    'pending'     => (clone $records)->whereIn('status', ['pending', 'in_review'])->count(),
                    'approved'    => (clone $records)->where('status', 'approved')->count(),
                    'rejected'    => (clone $records)->where('status', 'rejected')->count(),
                    'last_active' => $member->updated_at,
                    'created_at'  => $member->created_at,
                ];
            });

        return response()->json($members);
    }

    private function getSubmissionTrend(int $departmentId): array
    {
        $driver  = DB::getDriverName();
        $dateExpr = match ($driver) {
            'sqlite'         => "strftime('%Y-%m-%d', created_at)",
            'mysql','mariadb'=> 'DATE(created_at)',
            'pgsql'          => "TO_CHAR(created_at, 'YYYY-MM-DD')",
            default          => "strftime('%Y-%m-%d', created_at)",
        };

        $from = Carbon::now()->subDays(13)->startOfDay();
        $to   = Carbon::now();

        $records = Record::where('department_id', $departmentId)
            ->whereBetween('created_at', [$from, $to])
            ->select(DB::raw("{$dateExpr} as date"), DB::raw('count(*) as count'))
            ->groupBy('date')
            ->orderBy('date')
            ->pluck('count', 'date')
            ->toArray();

        $data   = [];
        $cursor = $from->copy();
        while ($cursor->lte($to->copy()->startOfDay())) {
            $key    = $cursor->format('Y-m-d');
            $data[] = ['label' => $cursor->format('M d'), 'count' => $records[$key] ?? 0];
            $cursor->addDay();
        }
        return $data;
    }
}
