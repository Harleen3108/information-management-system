<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Models\User;
use App\Models\Notification;
use App\Traits\LogsActivity;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class UserController extends Controller
{
    use LogsActivity;

    public function index(Request $request)
    {
        $query = User::with('roles', 'department');

        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($request->has('role') && $request->role) {
            $query->whereHas('roles', function ($q) use ($request) {
                $q->where('name', $request->role);
            });
        }

        if ($request->has('department_id') && $request->department_id) {
            $query->where('department_id', $request->department_id);
        }

        if ($request->has('status') && $request->status) {
            $query->where('status', $request->status);
        }

        $sortBy = $request->get('sort_by', 'created_at');
        $sortDir = $request->get('sort_dir', 'desc');
        $query->orderBy($sortBy, $sortDir);

        if ($request->has('per_page')) {
            return response()->json($query->paginate($request->get('per_page', 15)));
        }

        return response()->json($query->get());
    }

    public function store(StoreUserRequest $request)
    {
        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'department_id' => $request->department_id,
            'status' => $request->get('status', 'active'),
        ]);

        $user->assignRole($request->role);

        $this->logActivity('user_created', 'User', $user->id, [
            'name' => $user->name,
            'role' => $request->role,
        ]);

        Notification::create([
            'user_id' => $user->id,
            'type' => 'welcome',
            'title' => 'Welcome to IMS',
            'message' => 'Your account has been created. Welcome to the Information Management System!',
            'link' => '/profile',
        ]);

        return response()->json($user->load('roles', 'department'), 201);
    }

    public function show(User $user)
    {
        return response()->json($user->load('roles', 'department'));
    }

    public function update(UpdateUserRequest $request, User $user)
    {
        $user->update($request->only('name', 'email', 'department_id', 'status'));

        if ($request->has('role')) {
            $user->syncRoles([$request->role]);
        }

        $this->logActivity('user_updated', 'User', $user->id, $request->only('name', 'email', 'role', 'status'));

        return response()->json($user->load('roles', 'department'));
    }

    public function destroy(User $user)
    {
        if ($user->id === auth()->id()) {
            return response()->json(['message' => 'You cannot delete your own account.'], 422);
        }

        $this->logActivity('user_deleted', 'User', $user->id, ['name' => $user->name]);

        $user->delete();
        return response()->json(['message' => 'User deleted successfully']);
    }

    public function resetPassword(User $user)
    {
        $newPassword = 'password123';
        $user->update(['password' => Hash::make($newPassword)]);

        $this->logActivity('password_reset', 'User', $user->id);

        Notification::create([
            'user_id' => $user->id,
            'type' => 'password_reset',
            'title' => 'Password Reset',
            'message' => 'Your password has been reset by an administrator. Please change it after logging in.',
            'link' => '/profile',
        ]);

        return response()->json(['message' => 'Password reset to default successfully']);
    }

    public function toggleStatus(User $user)
    {
        if ($user->id === auth()->id()) {
            return response()->json(['message' => 'You cannot deactivate your own account.'], 422);
        }

        $newStatus = $user->status === 'active' ? 'inactive' : 'active';
        $user->update(['status' => $newStatus]);

        $this->logActivity('user_status_changed', 'User', $user->id, ['status' => $newStatus]);

        return response()->json($user->load('roles', 'department'));
    }

    public function roles()
    {
        return response()->json(Role::all());
    }
}
