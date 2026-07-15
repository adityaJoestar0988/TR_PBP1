<?php

namespace App\Observers;

use App\Models\CashFlow;
use App\Models\Transaction;

class TransactionObserver
{
    /**
     * Handle the Transaction "created" event.
     */
    public function created(Transaction $transaction): void
    {
        CashFlow::create([
            'type' => 'in',
            'amount' => $transaction->total,
            'source_type' => 'transaction',
            'source_id' => $transaction->id,
            'date' => now()->toDateString(),
            'description' => "Penjualan: {$transaction->transaction_number}",
        ]);
    }

    /**
     * Handle the Transaction "updated" event.
     */
    public function updated(Transaction $transaction): void
    {
        //
    }

    /**
     * Handle the Transaction "deleted" event.
     */
    public function deleted(Transaction $transaction): void
    {
        //
    }

    /**
     * Handle the Transaction "restored" event.
     */
    public function restored(Transaction $transaction): void
    {
        //
    }

    /**
     * Handle the Transaction "force deleted" event.
     */
    public function forceDeleted(Transaction $transaction): void
    {
        //
    }
}
