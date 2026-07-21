<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StoreSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'store_name',
        'address',
        'phone',
        'receipt_footer',
        'allow_kasir_discount',
        'allowed_discount_type',
        'payment_methods',
    ];


    protected $casts = [
        'allow_kasir_discount' => 'boolean',
        'payment_methods' => 'array',
    ];
}