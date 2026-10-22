<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Item extends Model
{
    protected $fillable = [
        'item_code',
        'barcode',
        'requires_serial',
        'item_name',
        'unit_price',
        'category_id',
        'brand_id',
        'model_id',
        'unit_of_measure_id',
        'description',
        'minimum_stock',
        'stock_on_hand',
        'status',
    ];

    protected $casts = [
        'unit_price' => 'decimal:2',
        'requires_serial' => 'boolean',
        'minimum_stock' => 'integer',
        'stock_on_hand' => 'integer',
    ];

    protected $appends = [
        'display_name',
        'stock_status',
    ];

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function brand(): BelongsTo
    {
        return $this->belongsTo(Brand::class);
    }

    public function model(): BelongsTo
    {
        return $this->belongsTo(ProductModel::class, 'model_id');
    }

    public function unitOfMeasure(): BelongsTo
    {
        return $this->belongsTo(UnitOfMeasure::class);
    }

    public function getDisplayNameAttribute(): string
    {
        $brand = $this->relationLoaded('brand') ? $this->brand?->name : null;
        $model = $this->relationLoaded('model') ? $this->model?->name : null;

        return trim(implode(' ', array_filter([$brand, $model, $this->item_name])));
    }

    public function getStockStatusAttribute(): string
    {
        $stock = (int) $this->stock_on_hand;
        $minimum = (int) $this->minimum_stock;

        if ($stock <= 0) {
            return 'out';
        }

        if ($minimum > 0 && $stock <= $minimum) {
            return 'low';
        }

        return 'in';
    }

    public static function buildDisplayName(
        ?string $brandName,
        ?string $modelName,
        string $itemName,
    ): string {
        return trim(implode(' ', array_filter([$brandName, $modelName, $itemName])));
    }
}
