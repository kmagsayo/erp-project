<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Supplier extends Model
{
    protected $fillable = [
        'name',
        'code',
        'contact_person',
        'phone',
        'address',
        'tin',
        'status',
    ];
}
