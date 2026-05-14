<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Department;
use Illuminate\Http\Request;

class DepartmentController extends Controller
{
    public function index()
    {
        return response()->json(Department::withCount('users')->get());
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:departments',
            'description' => 'nullable|string',
        ]);

        $department = Department::create($request->all());

        return response()->json($department, 201);
    }

    public function show(Department $department)
    {
        return response()->json($department->load('users'));
    }

    public function update(Request $request, Department $department)
    {
        $request->validate([
            'name' => 'sometimes|string|max:255|unique:departments,name,' . $department->id,
            'description' => 'nullable|string',
        ]);

        $department->update($request->all());

        return response()->json($department);
    }

    public function destroy(Department $department)
    {
        if ($department->users()->count() > 0) {
            return response()->json(['message' => 'Cannot delete department with active users'], 422);
        }

        $department->delete();
        return response()->json(['message' => 'Department deleted successfully']);
    }
}
