<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CashFlow extends Model
{
    use HasFactory;


    protected $fillable = [
        'type',
        'amount',
        'unit_price',
        'quantity',
        'source_type',
        'source_id',
        'date',
        'description',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'unit_price' => 'decimal:2',
        'quantity' => 'integer',
        'date' => 'date',
    ];
}