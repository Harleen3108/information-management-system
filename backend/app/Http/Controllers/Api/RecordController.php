<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Record;
use App\Models\Document;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;

class RecordController extends Controller
{
    public function index(Request $request)
    {
        $query = Record::with(['category', 'department', 'uploader', 'documents']);

        if ($request->has('department_id')) {
            $query->where('department_id', $request->department_id);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('search')) {
            $query->where('title', 'like', '%' . $request->search . '%');
        }

        return response()->json($query->latest()->paginate(15));
    }

    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'category_id' => 'required|exists:categories,id',
            'department_id' => 'required|exists:departments,id',
            'files.*' => 'nullable|file|max:10240', // 10MB max
            'tags' => 'nullable|array',
        ]);

        return DB::transaction(function () use ($request) {
            $record = Record::create([
                'title' => $request->title,
                'description' => $request->description,
                'category_id' => $request->category_id,
                'department_id' => $request->department_id,
                'uploaded_by' => auth()->id(),
                'tags' => $request->tags,
                'status' => 'pending', // Default status
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

            return response()->json($record->load('documents'), 201);
        });
    }

    public function show(Record $record)
    {
        return response()->json($record->load(['category', 'department', 'uploader', 'documents', 'approvals.user']));
    }

    public function update(Request $request, Record $record)
    {
        $request->validate([
            'title' => 'sometimes|string|max:255',
            'status' => 'sometimes|string|in:pending,approved,rejected,archived',
        ]);

        $record->update($request->all());

        return response()->json($record);
    }

    public function destroy(Record $record)
    {
        // Delete physical files
        foreach ($record->documents as $doc) {
            Storage::disk('public')->delete($doc->file_path);
        }
        
        $record->delete();
        return response()->json(['message' => 'Record and associated files deleted']);
    }
}
