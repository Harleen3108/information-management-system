<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateDepartmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('departments.edit');
    }

    public function rules(): array
    {
        $deptId = $this->route('department')->id ?? $this->route('department');

        return [
            'name' => 'sometimes|string|max:255|unique:departments,name,' . $deptId,
            'description' => 'nullable|string',
            'manager_id' => 'nullable|exists:users,id',
        ];
    }
}
