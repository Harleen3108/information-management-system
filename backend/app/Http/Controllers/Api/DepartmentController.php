<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreDepartmentRequest;
use App\Http\Requests\UpdateDepartmentRequest;
use App\Models\Department;
use App\Traits\LogsActivity;
use Illuminate\Http\Request;

class DepartmentController extends Controller
{
    use LogsActivity;

    public function index(Request $request)
    {
        $query = Department::withCount('users', 'records')->with('manager');

        if ($request->has('search') && $request->search) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        $sortBy = $request->get('sort_by', 'name');
        $sortDir = $request->get('sort_dir', 'asc');
        $query->orderBy($sortBy, $sortDir);

        return response()->json($query->get());
    }

    public function store(StoreDepartmentRequest $request)
    {
        $department = Department::create($request->validated());

        $this->logActivity('department_created', 'Department', $department->id, [
            'name' => $department->name,
        ]);

        return response()->json($department->load('manager')->loadCount('users', 'records'), 201);
    }

    public function show(Department $department)
    {
        return response()->json($department->load('users.roles', 'manager')->loadCount('users', 'records'));
    }

    public function update(UpdateDepartmentRequest $request, Department $department)
    {
        $department->update($request->validated());

        $this->logActivity('department_updated', 'Department', $department->id, $request->validated());

        return response()->json($department->load('manager')->loadCount('users', 'records'));
    }

    public function destroy(Department $department)
    {
        if ($department->users()->count() > 0) {
            return response()->json(['message' => 'Cannot delete department with active users'], 422);
        }

        $this->logActivity('department_deleted', 'Department', $department->id, ['name' => $department->name]);

        $department->delete();
        return response()->json(['message' => 'Department deleted successfully']);
    }
}
