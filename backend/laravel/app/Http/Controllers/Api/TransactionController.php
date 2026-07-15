<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use Illuminate\Http\Request;

class TransactionController extends Controller
{
    /**
     * Get paginated transaction history.
     */
    public function index(Request $request)
    {
        $query = Transaction::with('user:id,name')
            ->orderBy('created_at', 'desc');

        // Filter by user role (Kasir sees only their own, owner sees all)
        if (auth()->user()->role === 'kasir') {
            $query->where('user_id', auth()->id());
        }

        // Filter by date range
        if ($request->has('start_date') && $request->start_date != '') {
            $query->whereDate('created_at', '>=', $request->start_date);
        }
        if ($request->has('end_date') && $request->end_date != '') {
            $query->whereDate('created_at', '<=', $request->end_date);
        }

        // Filter by payment method
        if ($request->has('payment_method') && $request->payment_method != '') {
            $query->where('payment_method', $request->payment_method);
        }

        return response()->json([
            'status' => 'success',
            'data' => $query->paginate(15)
        ]);
    }

    /**
     * Get transaction detail.
     */
    public function show($id)
    {
        $transaction = Transaction::with(['transactionItems', 'user:id,name'])->findOrFail($id);

        if (auth()->user()->role === 'kasir' && $transaction->user_id !== auth()->id()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Anda tidak memiliki akses ke transaksi ini.'
            ], 403);
        }

        return response()->json([
            'status' => 'success',
            'data' => $transaction
        ]);
    }
}
