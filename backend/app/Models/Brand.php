<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Brand extends Model
{
    protected $fillable = [
        'name',
        'code',
        'description',
        'status',
    ];

    public function productModels(): HasMany
    {
        return $this->hasMany(ProductModel::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(Item::class);
    }
}
