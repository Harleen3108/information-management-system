<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Record;
use App\Models\Approval;
use App\Models\Notification;
use App\Traits\LogsActivity;
use Illuminate\Http\Request;

class ApprovalController extends Controller
{
    use LogsActivity;

    public function approve(Request $request, Record $record)
    {
        $user = $request->user();
        $request->validate(['comments' => 'nullable|string']);

        if (!$user->hasAnyRole(['Admin', 'Manager'])) {
            return response()->json(['message' => 'Unauthorized action.'], 403);
        }

        // Manager Approval Workflow: pending -> in_review
        if ($user->hasRole('Manager')) {
            if ($record->status !== 'pending') {
                return response()->json(['message' => 'Managers can only approve pending records.'], 422);
            }

            // Enforce department scoped approval
            if ($record->department_id !== $user->department_id) {
                return response()->json(['message' => 'You can only approve records within your department.'], 403);
            }

            $record->update(['status' => 'in_review']);

            Approval::create([
                'record_id' => $record->id,
                'user_id' => $user->id,
                'status' => 'in_review',
                'comments' => $request->comments ?: 'Approved by Manager. Forwarded to Admin for final approval.',
            ]);

            $this->logActivity('record_manager_approved', 'Record', $record->id);

            // Notify Admins
            $admins = \App\Models\User::role(['Admin'])->get();
            foreach ($admins as $admin) {
                Notification::create([
                    'user_id' => $admin->id,
                    'type' => 'approval_request',
                    'title' => 'Manager Approved Record',
                    'message' => "Record \"{$record->title}\" has been approved by Manager \"{$user->name}\" and awaits final Admin approval.",
                    'link' => '/records/' . $record->id,
                ]);
            }

            return response()->json(['message' => 'Record approved by manager and sent to Admin.']);
        }

        // Admin Final Approval Workflow: in_review (or pending) -> approved
        if ($user->hasRole('Admin')) {
            if (!in_array($record->status, ['pending', 'in_review'])) {
                return response()->json(['message' => 'Admins can only final approve pending or in-review records.'], 422);
            }

            $record->update(['status' => 'approved']);

            Approval::create([
                'record_id' => $record->id,
                'user_id' => $user->id,
                'status' => 'approved',
                'comments' => $request->comments ?: 'Final Approved by Admin.',
            ]);

            $this->logActivity('record_approved', 'Record', $record->id);

            // Notify Owner
            Notification::create([
                'user_id' => $record->uploaded_by,
                'type' => 'record_approved',
                'title' => 'Record Final Approved',
                'message' => "Your record \"{$record->title}\" has been final approved and stored.",
                'link' => '/records/' . $record->id,
            ]);

            return response()->json(['message' => 'Record final approved successfully.']);
        }

        return response()->json(['message' => 'Unauthorized action.'], 403);
    }

    public function review(Request $request, Record $record)
    {
        // Simple manual move to review if needed, but Manager Approve now handles this automatically.
        if (!$request->user()->can('records.approve')) {
            return response()->json(['message' => 'You do not have permission to review records.'], 403);
        }

        $request->validate(['comments' => 'nullable|string']);

        if ($record->status !== 'pending') {
            return response()->json(['message' => 'Only pending records can be marked as under review.'], 422);
        }

        $record->update(['status' => 'in_review']);

        Approval::create([
            'record_id' => $record->id,
            'user_id' => auth()->id(),
            'status' => 'in_review',
            'comments' => $request->comments ?: 'Marked as under review.',
        ]);

        $this->logActivity('record_reviewed', 'Record', $record->id);

        Notification::create([
            'user_id' => $record->uploaded_by,
            'type' => 'record_reviewed',
            'title' => 'Record In Review',
            'message' => "Your record \"{$record->title}\" is now under review.",
            'link' => '/records/' . $record->id,
        ]);

        return response()->json(['message' => 'Record status updated to in review successfully.']);
    }

    public function reject(Request $request, Record $record)
    {
        $user = $request->user();
        $request->validate(['comments' => 'required|string']);

        if ($user->hasRole('Manager')) {
            if ($record->status !== 'pending') {
                return response()->json(['message' => 'Managers can only reject pending records.'], 422);
            }
            if ($record->department_id !== $user->department_id) {
                return response()->json(['message' => 'You can only reject records within your department.'], 403);
            }
        } elseif ($user->hasRole('Admin')) {
            if (!in_array($record->status, ['pending', 'in_review'])) {
                return response()->json(['message' => 'Admins can only reject pending or in-review records.'], 422);
            }
        } else {
            return response()->json(['message' => 'Unauthorized action.'], 403);
        }

        $record->update(['status' => 'rejected']);

        Approval::create([
            'record_id' => $record->id,
            'user_id' => $user->id,
            'status' => 'rejected',
            'comments' => $request->comments,
        ]);

        $this->logActivity('record_rejected', 'Record', $record->id);

        Notification::create([
            'user_id' => $record->uploaded_by,
            'type' => 'record_rejected',
            'title' => 'Record Rejected',
            'message' => "Your record \"{$record->title}\" has been rejected: {$request->comments}",
            'link' => '/records/' . $record->id,
        ]);

        return response()->json(['message' => 'Record rejected successfully.']);
    }

    public function returnForRevision(Request $request, Record $record)
    {
        $user = $request->user();
        $request->validate(['comments' => 'required|string']);

        if ($user->hasRole('Manager')) {
            if ($record->status !== 'pending') {
                return response()->json(['message' => 'Managers can only return pending records.'], 422);
            }
            if ($record->department_id !== $user->department_id) {
                return response()->json(['message' => 'You can only return records within your department.'], 403);
            }
        } elseif ($user->hasRole('Admin')) {
            if (!in_array($record->status, ['pending', 'in_review'])) {
                return response()->json(['message' => 'Admins can only return pending or in-review records.'], 422);
            }
        } else {
            return response()->json(['message' => 'Unauthorized action.'], 403);
        }

        $record->update(['status' => 'revision']);

        Approval::create([
            'record_id' => $record->id,
            'user_id' => $user->id,
            'status' => 'revision',
            'comments' => $request->comments,
        ]);

        $this->logActivity('record_returned', 'Record', $record->id);

        Notification::create([
            'user_id' => $record->uploaded_by,
            'type' => 'record_revision',
            'title' => 'Revision Required',
            'message' => "Your record \"{$record->title}\" needs revision: {$request->comments}",
            'link' => '/records/' . $record->id,
        ]);

        return response()->json(['message' => 'Record returned for revision successfully.']);
    }
}
