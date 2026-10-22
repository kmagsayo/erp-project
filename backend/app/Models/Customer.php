<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Customer extends Model
{
    protected $fillable = [
        'name',
        'code',
        'contact_person',
        'email',
        'phone',
        'address',
        'tin',
        'terms',
        'terms_type',
        'status',
    ];

    protected $casts = [
        'terms' => 'integer',
    ];

    public function projects(): HasMany
    {
        return $this->hasMany(Project::class);
    }
}
