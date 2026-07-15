<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Expense extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
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

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'date' => 'date',
        'unit_price' => 'decimal:2',
        'quantity' => 'integer',
        'amount' => 'decimal:2',
    ];

    /**
     * Raw material for this expense, when applicable.
     */
    public function rawMaterial(): BelongsTo
    {
        return $this->belongsTo(RawMaterial::class);
    }

    /**
     * User who recorded the expense.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}