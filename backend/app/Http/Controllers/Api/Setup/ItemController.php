<?php

namespace App\Http\Controllers\Api\Setup;

use App\Http\Controllers\Controller;
use App\Http\Requests\Setup\ItemRequest;
use App\Models\Item;
use App\Services\Setup\ItemService;
use App\Support\ApiResponse;
use Illuminate\Http\Request;

class ItemController extends Controller
{
    use HandlesSetupActions;

    public function __construct(private readonly ItemService $service) {}

    public function index(Request $request)
    {
        $items = $this->service->getItems($request);

        return ApiResponse::paginated($items, 'items', 'Items retrieved successfully.');
    }

    public function store(ItemRequest $request)
    {
        $item = $this->service->createItem($request->validated());

        return ApiResponse::success(['item' => $item], 'Item created successfully.', 201);
    }

    public function show(Item $item)
    {
        $item = $this->service->getItemById($item->id);

        return ApiResponse::success(['item' => $item], 'Item retrieved successfully.');
    }

    public function update(ItemRequest $request, Item $item)
    {
        $item = $this->service->updateItem($item, $request->validated());

        return ApiResponse::success(['item' => $item], 'Item updated successfully.');
    }

    public function destroy(Item $item)
    {
        return $this->runSetupAction(function () use ($item) {
            $this->service->deleteItem($item);

            return ApiResponse::success(null, 'Item deleted successfully.');
        });
    }
}
