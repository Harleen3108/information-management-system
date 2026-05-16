<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreRecordRequest;
use App\Http\Requests\UpdateRecordRequest;
use App\Models\Record;
use App\Models\Document;
use App\Models\Notification;
use App\Traits\LogsActivity;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;

class RecordController extends Controller
{
    use LogsActivity;

    public function index(Request $request)
    {
        $user = $request->user();

        if (!$user->can('records.view')) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $query = Record::with(['category', 'department', 'uploader', 'documents']);

        // Role-based record scoping
        // Super Admin / Admin / Manager: see all records
        // Employee: see only their own records (uploaded_by = auth user id)
        // Viewer: see all records (read-only, enforced on write endpoints)
        if ($user->hasRole('Employee')) {
            $query->where('uploaded_by', $user->id);
        }

        if ($request->has('department_id') && $request->department_id) {
            $query->where('department_id', $request->department_id);
        }

        if ($request->has('category_id') && $request->category_id) {
            $query->where('category_id', $request->category_id);
        }

        if ($request->has('status') && $request->status) {
            $query->where('status', $request->status);
        }

        if ($request->has('uploaded_by') && $request->uploaded_by) {
            $query->where('uploaded_by', $request->uploaded_by);
        }

        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        $sortBy = $request->get('sort_by', 'created_at');
        $sortDir = $request->get('sort_dir', 'desc');
        $query->orderBy($sortBy, $sortDir);

        return response()->json($query->paginate($request->get('per_page', 15)));
    }

    public function store(StoreRecordRequest $request)
    {
        return DB::transaction(function () use ($request) {
            $record = Record::create([
                'title' => $request->title,
                'description' => $request->description,
                'category_id' => $request->category_id,
                'department_id' => $request->department_id,
                'uploaded_by' => auth()->id(),
                'tags' => $request->tags,
                'status' => $request->get('status', 'draft'),
            ]);

            if ($request->hasFile('files')) {
                foreach ($request->file('files') as $file) {
                    $path = $file->store('records/' . $record->id, 'public');

                    Document::create([
                        'record_id' => $record->id,
                        'file_name' => $file->getClientOriginalName(),
                        'file_path' => $path,
                        'file_type' => $file->getClientOriginalExtension(),
                        'file_size' => $file->getSize(),
                    ]);
                }
            }

            $this->logActivity('record_created', 'Record', $record->id, [
                'title' => $record->title,
                'status' => $record->status,
            ]);

            return response()->json($record->load('documents', 'category', 'department', 'uploader'), 201);
        });
    }

    public function show(Record $record)
    {
        $user = auth()->user();

        if (!$user->can('records.view')) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        // Employees can only view their own records
        if ($user->hasRole('Employee') && $record->uploaded_by !== $user->id) {
            return response()->json(['message' => 'You can only view your own records.'], 403);
        }

        return response()->json($record->load([
            'category', 'department', 'uploader', 'documents',
            'approvals' => function ($q) {
                $q->with('user')->orderBy('created_at', 'desc');
            }
        ]));
    }

    public function update(UpdateRecordRequest $request, Record $record)
    {
        $user = $request->user();

        // Employees can only edit their own draft records
        if ($user->hasRole('Employee')) {
            if ($record->uploaded_by !== $user->id) {
                return response()->json(['message' => 'You can only edit your own records.'], 403);
            }
            if (!in_array($record->status, ['draft', 'revision'])) {
                return response()->json(['message' => 'You can only edit draft or revision records.'], 403);
            }
        }

        // Viewers cannot edit
        if ($user->hasRole('Viewer')) {
            return response()->json(['message' => 'Viewers cannot edit records.'], 403);
        }

        $record->update($request->validated());

        $this->logActivity('record_updated', 'Record', $record->id, $request->validated());

        return response()->json($record->load('category', 'department', 'uploader', 'documents'));
    }

    public function destroy(Record $record)
    {
        $user = auth()->user();

        if (!$user->can('records.delete')) {
            return response()->json(['message' => 'You do not have permission to delete records.'], 403);
        }

        // Delete physical files
        foreach ($record->documents as $doc) {
            Storage::disk('public')->delete($doc->file_path);
        }

        $this->logActivity('record_deleted', 'Record', $record->id, ['title' => $record->title]);

        $record->delete();
        return response()->json(['message' => 'Record and associated files deleted']);
    }

    public function submitForApproval(Record $record)
    {
        $user = auth()->user();

        if (!$user->can('records.submit')) {
            return response()->json(['message' => 'You do not have permission to submit records.'], 403);
        }

        if (!in_array($record->status, ['draft', 'revision'])) {
            return response()->json(['message' => 'Record cannot be submitted in its current state.'], 422);
        }

        // Employees can only submit their own records
        if ($user->hasRole('Employee') && $record->uploaded_by !== $user->id) {
            return response()->json(['message' => 'You can only submit your own records.'], 403);
        }

        $record->update(['status' => 'pending']);

        $this->logActivity('record_submitted', 'Record', $record->id);

        // Notify managers/admins
        $managers = \App\Models\User::role(['Super Admin', 'Admin', 'Manager'])->get();
        foreach ($managers as $manager) {
            Notification::create([
                'user_id' => $manager->id,
                'type' => 'approval_request',
                'title' => 'New Approval Request',
                'message' => "Record \"{$record->title}\" has been submitted for approval.",
                'link' => '/records/' . $record->id,
            ]);
        }

        return response()->json($record->load('category', 'department', 'uploader'));
    }
}
