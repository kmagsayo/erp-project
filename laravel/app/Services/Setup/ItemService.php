<?php

namespace App\Services\Setup;

use App\Models\Brand;
use App\Models\Category;
use App\Models\Item;
use App\Models\ProductModel;
use App\Models\UnitOfMeasure;
use App\Services\Setup\Concerns\AllocatesSetupCodes;
use App\Services\Setup\Concerns\PaginatesSetupQueries;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ItemService
{
    use AllocatesSetupCodes;
    use PaginatesSetupQueries;

    public function getItems(Request $request)
    {
        $query = Item::query()
            ->with(['category', 'brand', 'model', 'unitOfMeasure'])
            ->orderBy('item_code');

        $this->applySearch($query, $request->query('search'), ['item_code', 'barcode', 'item_name', 'description']);
        $this->applyStatusFilter($query, $request->query('status'));

        if ($barcode = trim((string) $request->query('barcode'))) {
            $needle = mb_strtolower($barcode);
            $query->where(function ($barcodeQuery) use ($needle) {
                $barcodeQuery
                    ->whereRaw('LOWER(barcode) = ?', [$needle])
                    ->orWhereRaw('LOWER(item_code) = ?', [$needle]);
            });
        }

        if ($categoryId = $request->query('category_id')) {
            $query->where('category_id', $categoryId);
        }

        if ($brandId = $request->query('brand_id')) {
            $query->where('brand_id', $brandId);
        }

        if ($modelId = $request->query('model_id')) {
            $query->where('model_id', $modelId);
        }

        return $this->paginateQuery($query, $request);
    }

    public function getItemById(int $id): Item
    {
        return Item::query()
            ->with(['category', 'brand', 'model', 'unitOfMeasure'])
            ->findOrFail($id);
    }

    public function createItem(array $data): Item
    {
        $this->assertRelationshipsAreValid($data);

        return DB::transaction(function () use ($data) {
            $payload = $this->preparePayload($data);
            $payload['item_code'] = 'ITM-TMP-'.uniqid();
            $item = Item::query()->create($payload);
            $item->update(['item_code' => $this->nextSequentialCode('items', 'item_code', 'ITM-', 4, $item->id)]);

            return $item->fresh(['category', 'brand', 'model', 'unitOfMeasure']);
        });
    }

    public function updateItem(Item $item, array $data): Item
    {
        $this->assertRelationshipsAreValid($data);

        return DB::transaction(function () use ($item, $data) {
            $payload = $this->preparePayload($data, $item);
            $item->update($payload);

            return $item->fresh(['category', 'brand', 'model', 'unitOfMeasure']);
        });
    }

    public function deleteItem(Item $item): void
    {
        $item->delete();
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    protected function preparePayload(array $data, ?Item $existing = null): array
    {
        unset($data['item_code'], $data['description']);
        $data['minimum_stock'] = (int) ($data['minimum_stock'] ?? 0);
        $data['stock_on_hand'] = (int) ($data['stock_on_hand'] ?? 0);
        $data['unit_price'] = round((float) ($data['unit_price'] ?? 0), 2);

        if (array_key_exists('barcode', $data)) {
            $barcode = trim((string) ($data['barcode'] ?? ''));
            $data['barcode'] = $barcode === '' ? null : $barcode;
        }

        if (array_key_exists('requires_serial', $data)) {
            $data['requires_serial'] = filter_var($data['requires_serial'], FILTER_VALIDATE_BOOLEAN);
        }

        if ($existing) {
            $data['item_code'] = $existing->item_code;
        }

        return $data;
    }

    protected function assertRelationshipsAreValid(array $data): void
    {
        Category::query()->findOrFail($data['category_id']);
        Brand::query()->findOrFail($data['brand_id']);
        UnitOfMeasure::query()->findOrFail($data['unit_of_measure_id']);

        $model = ProductModel::query()->findOrFail($data['model_id']);

        if ((int) $model->brand_id !== (int) $data['brand_id']) {
            throw ValidationException::withMessages([
                'model_id' => ['The selected model does not belong to the selected brand.'],
            ]);
        }
    }
}
