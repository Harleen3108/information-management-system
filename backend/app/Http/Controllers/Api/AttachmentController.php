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

        if (!$user->can('records.download')) {
            return response()->json(['message' => 'You do not have permission to download files.'], 403);
        }

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

    /**
     * GET /api/attachments/{document}/preview
     * Serves the file inline so browsers can render it (PDF, images, etc.).
     * Requires records.view permission.
     */
    public function preview(Document $document)
    {
        $user = auth()->user();

        if (!$user->can('records.view')) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        if (!Storage::disk('public')->exists($document->file_path)) {
            return response()->json(['message' => 'File not found on server.'], 404);
        }

        $path     = Storage::disk('public')->path($document->file_path);
        $mimeType = mime_content_type($path) ?: 'application/octet-stream';

        return response()->file($path, [
            'Content-Type'        => $mimeType,
            'Content-Disposition' => 'inline; filename="' . $document->file_name . '"',
        ]);
    }
}

