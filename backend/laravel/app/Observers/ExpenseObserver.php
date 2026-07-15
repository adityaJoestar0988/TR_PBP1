<?php

namespace App\Observers;

use App\Models\CashFlow;
use App\Models\Expense;

class ExpenseObserver
{
    public function created(Expense $expense): void
    {
        $expense->loadMissing('rawMaterial');

        CashFlow::create([
            'type' => 'out',
            'amount' => $expense->amount,
            'source_type' => 'expense',
            'source_id' => $expense->id,
            'date' => $expense->date,
            'description' => $this->buildDescription($expense),
        ]);
    }

    public function updated(Expense $expense): void
    {
        if (! $expense->wasChanged(['amount', 'date', 'type', 'raw_material_id', 'description'])) {
            return;
        }

        $cashFlow = CashFlow::where('source_type', 'expense')
            ->where('source_id', $expense->id)
            ->first();

        if (! $cashFlow) {
            return;
        }

        $expense->loadMissing('rawMaterial');

        $cashFlow->update([
            'amount' => $expense->amount,
            'date' => $expense->date,
            'description' => $this->buildDescription($expense),
        ]);
    }

    public function deleted(Expense $expense): void
    {
        CashFlow::where('source_type', 'expense')
            ->where('source_id', $expense->id)
            ->delete();
    }

    private function buildDescription(Expense $expense): string
    {
        if ($expense->type === 'pembelian_bahan_baku') {
            return 'Pembelian bahan baku: ' . ($expense->rawMaterial?->name ?? 'Tidak ada');
        }

        return 'Operasional: ' . ($expense->description ?? '-');
    }
}