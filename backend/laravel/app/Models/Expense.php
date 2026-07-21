<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Expense extends Model
{
    use HasFactory;

    protected $fillable = [
        'date',
        'type',
        'raw_material_id',
        'unit_price',
        'quantity',
        'amount',
        'description',
        'user_id',
    ];


    protected $casts = [
        'date' => 'date',
        'unit_price' => 'decimal:2',
        'quantity' => 'integer',
        'amount' => 'decimal:2',
    ];

    public function rawMaterial(): BelongsTo
    {
        return $this->belongsTo(RawMaterial::class);
    }


    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}