<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Traits\LogsActivity;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    use LogsActivity;

    /**
     * GET /api/categories
     * Returns all categories with their record counts.
     * Supports ?search= to filter by name.
     */
    public function index(Request $request)
    {
        $query = Category::withCount('records')->orderBy('name');

        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        return response()->json($query->get());
    }

    /**
     * POST /api/categories
     * Create a new category (admin-only via permission check).
     */
    public function store(Request $request)
    {
        if (!$request->user()->can('categories.create')) {
            return response()->json(['message' => 'Unauthorized. You do not have permission to create categories.'], 403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:categories,name',
            'description' => 'nullable|string|max:1000',
        ]);

        $category = Category::create($validated);

        $this->logActivity('category_created', 'Category', $category->id, [
            'name' => $category->name,
        ]);

        return response()->json([
            'message' => 'Category created successfully.',
            'category' => $category->loadCount('records'),
        ], 201);
    }

    /**
     * GET /api/categories/{category}
     * Return a single category with its records.
     */
    public function show(Category $category)
    {
        return response()->json(
            $category->loadCount('records')
        );
    }

    /**
     * PUT /api/categories/{category}
     * Update a category name.
     */
    public function update(Request $request, Category $category)
    {
        if (!$request->user()->can('categories.edit')) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:categories,name,' . $category->id,
            'description' => 'nullable|string|max:1000',
        ]);

        $category->update($validated);
        // Regenerate slug
        $category->slug = \Illuminate\Support\Str::slug($validated['name']);
        $category->save();

        $this->logActivity('category_updated', 'Category', $category->id, [
            'name' => $category->name,
        ]);

        return response()->json([
            'message' => 'Category updated successfully.',
            'category' => $category->loadCount('records'),
        ]);
    }

    /**
     * DELETE /api/categories/{category}
     * Delete a category (only if no records use it).
     */
    public function destroy(Request $request, Category $category)
    {
        if (!$request->user()->can('categories.delete')) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        if ($category->records()->count() > 0) {
            return response()->json([
                'message' => 'Cannot delete category that has associated records. Reassign or delete the records first.',
            ], 422);
        }

        $this->logActivity('category_deleted', 'Category', $category->id, [
            'name' => $category->name,
        ]);

        $category->delete();

        return response()->json([
            'message' => 'Category deleted successfully.',
        ]);
    }
}
