<?php

namespace App\Http\Requests;

use Carbon\Carbon;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreExpenseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'date' => ['required', 'date', function (string $attribute, mixed $value, \Closure $fail): void {
                if (Carbon::parse($value)->startOfDay()->gt(now()->startOfDay())) {
                    $fail('Tanggal pengeluaran tidak boleh di masa depan.');
                }
            }],
            'type' => ['required', Rule::in(['pembelian_bahan_baku', 'operasional'])],
            'raw_material_id' => ['required_if:type,pembelian_bahan_baku', 'prohibited_if:type,operasional', 'nullable', 'integer', 'exists:raw_materials,id'],
            'unit_price' => ['nullable', 'numeric', 'min:0'],
            'quantity' => ['nullable', 'integer', 'min:1'],
            'amount' => ['required', 'numeric', 'gt:0'],
            'description' => ['nullable', 'string'],
        ];
    }
}