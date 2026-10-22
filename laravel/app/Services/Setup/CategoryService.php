<?php

namespace App\Services\Setup;

use App\Models\Category;
use App\Services\Setup\Concerns\AllocatesSetupCodes;
use App\Services\Setup\Concerns\PaginatesSetupQueries;
use Illuminate\Http\Request;

class CategoryService
{
    use AllocatesSetupCodes;
    use PaginatesSetupQueries;

    public function getCategories(Request $request)
    {
        $query = Category::query()->orderBy('id');

        $this->applySearch($query, $request->query('search'), ['name', 'code', 'description']);
        $this->applyStatusFilter($query, $request->query('status'));

        return $this->paginateQuery($query, $request);
    }

    public function getCategoryById(int $id): Category
    {
        return Category::query()->findOrFail($id);
    }

    public function createCategory(array $data): Category
    {
        unset($data['code']);
        $category = Category::query()->create([
            ...$data,
            'code' => 'CAT-TMP-'.uniqid(),
        ]);
        $category->update([
            'code' => $this->nextSequentialCode('categories', 'code', 'CAT-', 3, $category->id),
        ]);

        return $category->fresh();
    }

    public function updateCategory(Category $category, array $data): Category
    {
        unset($data['code']);
        $category->update($data);

        return $category->fresh();
    }

    public function deleteCategory(Category $category): void
    {
        if ($category->items()->exists()) {
            throw new \RuntimeException(
                'Cannot delete this category because it is currently being used by existing items.',
            );
        }

        $category->delete();
    }
}
