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
        if (!$request->user()->can('records.approve')) {
            return response()->json(['message' => 'You do not have permission to approve records.'], 403);
        }

        $request->validate(['comments' => 'nullable|string']);

        if ($record->status !== 'pending') {
            return response()->json(['message' => 'Only pending records can be approved.'], 422);
        }

        Approval::create([
            'record_id' => $record->id,
            'user_id' => auth()->id(),
            'status' => 'approved',
            'comments' => $request->comments,
        ]);

        $record->update(['status' => 'approved']);

        $this->logActivity('record_approved', 'Record', $record->id);

        // Notify record owner
        Notification::create([
            'user_id' => $record->uploaded_by,
            'type' => 'record_approved',
            'title' => 'Record Approved',
            'message' => "Your record \"{$record->title}\" has been approved.",
            'link' => '/records/' . $record->id,
        ]);

        return response()->json(['message' => 'Record approved successfully']);
    }

    public function reject(Request $request, Record $record)
    {
        if (!$request->user()->can('records.reject')) {
            return response()->json(['message' => 'You do not have permission to reject records.'], 403);
        }

        $request->validate(['comments' => 'required|string']);

        if ($record->status !== 'pending') {
            return response()->json(['message' => 'Only pending records can be rejected.'], 422);
        }

        Approval::create([
            'record_id' => $record->id,
            'user_id' => auth()->id(),
            'status' => 'rejected',
            'comments' => $request->comments,
        ]);

        $record->update(['status' => 'rejected']);

        $this->logActivity('record_rejected', 'Record', $record->id);

        Notification::create([
            'user_id' => $record->uploaded_by,
            'type' => 'record_rejected',
            'title' => 'Record Rejected',
            'message' => "Your record \"{$record->title}\" has been rejected: {$request->comments}",
            'link' => '/records/' . $record->id,
        ]);

        return response()->json(['message' => 'Record rejected successfully']);
    }

    public function returnForRevision(Request $request, Record $record)
    {
        if (!$request->user()->can('records.approve')) {
            return response()->json(['message' => 'You do not have permission to return records for revision.'], 403);
        }

        $request->validate(['comments' => 'required|string']);

        if ($record->status !== 'pending') {
            return response()->json(['message' => 'Only pending records can be returned for revision.'], 422);
        }

        Approval::create([
            'record_id' => $record->id,
            'user_id' => auth()->id(),
            'status' => 'revision',
            'comments' => $request->comments,
        ]);

        $record->update(['status' => 'revision']);

        $this->logActivity('record_returned', 'Record', $record->id);

        Notification::create([
            'user_id' => $record->uploaded_by,
            'type' => 'record_revision',
            'title' => 'Revision Required',
            'message' => "Your record \"{$record->title}\" needs revision: {$request->comments}",
            'link' => '/records/' . $record->id,
        ]);

        return response()->json(['message' => 'Record returned for revision']);
    }
}
