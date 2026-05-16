<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateRecordRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('records.edit');
    }

    public function rules(): array
    {
        return [
            'title' => 'sometimes|string|max:255',
            'description' => 'sometimes|string',
            'category_id' => 'sometimes|exists:categories,id',
            'department_id' => 'sometimes|exists:departments,id',
            'status' => 'sometimes|string|in:draft,pending,approved,rejected,archived',
            'tags' => 'sometimes|array',
        ];
    }
}
