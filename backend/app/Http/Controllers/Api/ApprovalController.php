<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Record;
use App\Models\Approval;
use Illuminate\Http\Request;

class ApprovalController extends Controller
{
    public function approve(Request $request, Record $record)
    {
        $request->validate(['comments' => 'nullable|string']);

        Approval::create([
            'record_id' => $record->id,
            'user_id' => auth()->id(),
            'status' => 'approved',
            'comments' => $request->comments,
        ]);

        $record->update(['status' => 'approved']);

        return response()->json(['message' => 'Record approved successfully']);
    }

    public function reject(Request $request, Record $record)
    {
        $request->validate(['comments' => 'required|string']);

        Approval::create([
            'record_id' => $record->id,
            'user_id' => auth()->id(),
            'status' => 'rejected',
            'comments' => $request->comments,
        ]);

        $record->update(['status' => 'rejected']);

        return response()->json(['message' => 'Record rejected successfully']);
    }
}
