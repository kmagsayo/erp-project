<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    protected $fillable = [
        'company_name',
        'company_address',
        'company_phone',
        'company_email',
        'user_name',
        'user_email',
        'date_format',
        'paper_size',
    ];
}
