<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreRecordRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('records.create');
    }

    public function rules(): array
    {
        return [
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'category_id' => 'required|exists:categories,id',
            'department_id' => 'required|exists:departments,id',
            'files.*' => 'nullable|file|max:10240',
            'tags' => 'nullable|array',
            'status' => 'sometimes|string|in:draft,pending',
        ];
    }
}
