<?php

namespace App\Http\Controllers\Api\Setup;

use App\Http\Controllers\Controller;
use App\Http\Requests\Setup\CategoryRequest;
use App\Models\Category;
use App\Services\Setup\CategoryService;
use App\Support\ApiResponse;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    use HandlesSetupActions;

    public function __construct(private readonly CategoryService $service) {}

    public function index(Request $request)
    {
        $categories = $this->service->getCategories($request);

        return ApiResponse::paginated($categories, 'categories', 'Categories retrieved successfully.');
    }

    public function store(CategoryRequest $request)
    {
        $category = $this->service->createCategory($request->validated());

        return ApiResponse::success(['category' => $category], 'Category created successfully.', 201);
    }

    public function show(Category $category)
    {
        return ApiResponse::success(['category' => $category], 'Category retrieved successfully.');
    }

    public function update(CategoryRequest $request, Category $category)
    {
        $category = $this->service->updateCategory($category, $request->validated());

        return ApiResponse::success(['category' => $category], 'Category updated successfully.');
    }

    public function destroy(Category $category)
    {
        return $this->runSetupAction(function () use ($category) {
            $this->service->deleteCategory($category);

            return ApiResponse::success(null, 'Category deleted successfully.');
        });
    }
}
