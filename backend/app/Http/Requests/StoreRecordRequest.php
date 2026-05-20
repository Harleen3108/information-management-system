<?php

namespace App\Http\Requests;

use App\Models\Category;
use Illuminate\Foundation\Http\FormRequest;

class StoreRecordRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('records.create');
    }

    public function rules(): array
    {
        // Determine allowed file extensions from the chosen category
        $mimes = null;
        if ($this->category_id) {
            $category = Category::find($this->category_id);
            if ($category && !empty($category->allowed_extensions)) {
                $exts = $category->allowed_extensions_array;
                if (!empty($exts)) {
                    $mimes = 'mimes:' . implode(',', $exts);
                }
            }
        }

        return [
            'title'         => 'required|string|max:255',
            'description'   => 'nullable|string',
            'category_id'   => 'required|exists:categories,id',
            'department_id' => 'required|exists:departments,id',
            'files.*'       => array_filter(['nullable', 'file', 'max:10240', $mimes]),
            'tags'          => 'nullable|array',
            'status'        => 'sometimes|string|in:draft,pending',
        ];
    }

    public function messages(): array
    {
        return [
            'files.*.mimes' => 'One or more files are not allowed for this category. Please upload files of the correct type.',
        ];
    }
}
