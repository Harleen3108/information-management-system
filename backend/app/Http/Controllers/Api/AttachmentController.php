<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Document;
use App\Traits\LogsActivity;
use Illuminate\Support\Facades\Storage;

class AttachmentController extends Controller
{
    use LogsActivity;

    /**
     * GET /api/attachments/{document}/download
     * Securely download a file attachment.
     * Requires records.download permission.
     */
    public function download(Document $document)
    {
        $user = auth()->user();

        // Check permission
        if (!$user->can('records.download')) {
            return response()->json(['message' => 'You do not have permission to download files.'], 403);
        }

        // Verify file exists on disk
        if (!Storage::disk('public')->exists($document->file_path)) {
            return response()->json(['message' => 'File not found on server.'], 404);
        }

        $this->logActivity('file_downloaded', 'Document', $document->id, [
            'file_name' => $document->file_name,
            'record_id' => $document->record_id,
        ]);

        return Storage::disk('public')->download(
            $document->file_path,
            $document->file_name
        );
    }
}
