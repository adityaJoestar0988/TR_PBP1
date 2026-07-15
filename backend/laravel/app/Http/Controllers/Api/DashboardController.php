<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CashFlow;
use App\Models\Product;
use App\Models\Transaction;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    /**
     * Get dashboard summary data for owner.
     */
    public function summary()
    {
        $today = Carbon::today()->toDateString();
        $sevenDaysAgo = Carbon::today()->subDays(6)->toDateString();

        // Today's sales
        $todayTransactions = Transaction::whereDate('created_at', $today)->get();
        $todaySales = (float) $todayTransactions->sum('total');
        $todayTransactionCount = $todayTransactions->count();

        // Today's cashflow
        $todayCashflow = CashFlow::select('type', DB::raw('SUM(amount) as total'))
            ->whereDate('date', $today)
            ->groupBy('type')
            ->pluck('total', 'type');

        $todayCashIn = (float) ($todayCashflow['in'] ?? 0);
        $todayCashOut = (float) ($todayCashflow['out'] ?? 0);

        // Low stock products (top 5)
        $lowStockThreshold = 5;
        $lowStockProducts = Product::where('is_active', true)
            ->where('stock', '<=', $lowStockThreshold)
            ->orderBy('stock')
            ->limit(5)
            ->get(['id', 'name', 'stock']);

        // Sales last 7 days
        $dailySales = Transaction::select(
                DB::raw('DATE(created_at) as date'),
                DB::raw('SUM(total) as revenue')
            )
            ->whereDate('created_at', '>=', $sevenDaysAgo)
            ->whereDate('created_at', '<=', $today)
            ->groupBy('date')
            ->get()
            ->keyBy('date');

        $salesLast7Days = [];
        $period = \Carbon\CarbonPeriod::create($sevenDaysAgo, $today);
        foreach ($period as $date) {
            $dateString = $date->toDateString();
            $salesLast7Days[] = [
                'date' => $dateString,
                'revenue' => (float) ($dailySales[$dateString]->revenue ?? 0),
            ];
        }

        return response()->json([
            'status' => 'success',
            'data' => [
                'today' => [
                    'total_sales' => $todaySales,
                    'transaction_count' => $todayTransactionCount,
                    'cash_in' => $todayCashIn,
                    'cash_out' => $todayCashOut,
                    'saldo' => $todayCashIn - $todayCashOut,
                ],
                'low_stock_products' => $lowStockProducts,
                'sales_last_7_days' => $salesLast7Days,
            ]
        ]);
    }
}
