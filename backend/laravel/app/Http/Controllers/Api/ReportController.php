<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Expense;
use App\Models\Product;
use App\Models\Transaction;
use App\Models\TransactionItem;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    /**
     * Helper to get start and end dates.
     */
    private function getDateRange(Request $request)
    {
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');

        if (!$startDate || !$endDate) {
            $startDate = now()->startOfMonth()->toDateString();
            $endDate = now()->endOfMonth()->toDateString();
        }

        return [$startDate, $endDate];
    }

    /**
     * Generate zero-filled period skeleton
     */
    private function generateZeroFilledPeriod($startDate, $endDate, $defaultStructure)
    {
        $period = CarbonPeriod::create($startDate, $endDate);
        $result = [];
        
        foreach ($period as $date) {
            $dateString = $date->toDateString();
            $result[$dateString] = array_merge(['date' => $dateString], $defaultStructure);
        }
        
        return $result;
    }

    /**
     * Laporan Penjualan (Sales Report)
     */
    public function sales(Request $request)
    {
        [$startDate, $endDate] = $this->getDateRange($request);

        // Overall Totals
        $transactions = Transaction::whereDate('created_at', '>=', $startDate)
            ->whereDate('created_at', '<=', $endDate)
            ->get();

        $totalTransactions = $transactions->count();
        $totalRevenue = $transactions->sum('total');
        
        // Items logic (join for aggregation)
        $itemsQuery = TransactionItem::join('transactions', 'transaction_items.transaction_id', '=', 'transactions.id')
            ->whereDate('transactions.created_at', '>=', $startDate)
            ->whereDate('transactions.created_at', '<=', $endDate);

        $totalItemsSold = $itemsQuery->sum('transaction_items.quantity');

        // By Product
        $byProduct = TransactionItem::select(
                'product_id',
                DB::raw('MAX(product_name) as product_name'), // taking the max name to resolve naming changes mid-period
                DB::raw('SUM(quantity) as quantity_sold'),
                DB::raw('SUM(subtotal) as revenue')
            )
            ->join('transactions', 'transaction_items.transaction_id', '=', 'transactions.id')
            ->whereDate('transactions.created_at', '>=', $startDate)
            ->whereDate('transactions.created_at', '<=', $endDate)
            ->groupBy('product_id')
            ->orderBy('revenue', 'desc')
            ->get();

        // By Day
        $dailyTransactions = Transaction::select(
                DB::raw('DATE(created_at) as date'),
                DB::raw('COUNT(id) as transaction_count'),
                DB::raw('SUM(total) as revenue')
            )
            ->whereDate('created_at', '>=', $startDate)
            ->whereDate('created_at', '<=', $endDate)
            ->groupBy('date')
            ->get()
            ->keyBy('date');

        $byDay = $this->generateZeroFilledPeriod($startDate, $endDate, ['transaction_count' => 0, 'revenue' => 0]);
        
        foreach ($dailyTransactions as $date => $data) {
            $byDay[$date]['transaction_count'] = (int) $data->transaction_count;
            $byDay[$date]['revenue'] = (float) $data->revenue;
        }

        return response()->json([
            'status' => 'success',
            'data' => [
                'total_transactions' => $totalTransactions,
                'total_revenue' => (float) $totalRevenue,
                'total_items_sold' => (int) $totalItemsSold,
                'by_product' => $byProduct,
                'by_day' => array_values($byDay)
            ]
        ]);
    }

    /**
     * Laporan Pembelian Bahan Baku
     */
    public function rawMaterialPurchases(Request $request)
    {
        [$startDate, $endDate] = $this->getDateRange($request);

        $expenses = Expense::with('rawMaterial')
            ->where('type', 'pembelian_bahan_baku')
            ->whereDate('date', '>=', $startDate)
            ->whereDate('date', '<=', $endDate)
            ->get();

        $totalPurchases = $expenses->sum('amount');
        $totalTransactions = $expenses->count();

        // By raw material (aggregating in PHP since we need relationship names)
        $byRawMaterialMap = [];
        foreach ($expenses as $expense) {
            $name = $expense->rawMaterial ? $expense->rawMaterial->name : 'Unknown/Deleted';
            if (!isset($byRawMaterialMap[$name])) {
                $byRawMaterialMap[$name] = ['raw_material_name' => $name, 'total_amount' => 0, 'purchase_count' => 0];
            }
            $byRawMaterialMap[$name]['total_amount'] += $expense->amount;
            $byRawMaterialMap[$name]['purchase_count']++;
        }
        
        $byRawMaterial = array_values($byRawMaterialMap);
        usort($byRawMaterial, fn($a, $b) => $b['total_amount'] <=> $a['total_amount']);

        // By Day
        $dailyExpenses = Expense::select(
                DB::raw('DATE(date) as expense_day'),
                DB::raw('SUM(amount) as total_amount')
            )
            ->where('type', 'pembelian_bahan_baku')
            ->whereDate('date', '>=', $startDate)
            ->whereDate('date', '<=', $endDate)
            ->groupBy('expense_day')
            ->get()
            ->keyBy('expense_day');

        $byDay = $this->generateZeroFilledPeriod($startDate, $endDate, ['total_amount' => 0]);
        
        foreach ($dailyExpenses as $date => $data) {
            $byDay[$date]['total_amount'] = (float) $data->total_amount;
        }

        return response()->json([
            'status' => 'success',
            'data' => [
                'total_purchases' => (float) $totalPurchases,
                'total_transactions' => $totalTransactions,
                'by_raw_material' => $byRawMaterial,
                'by_day' => array_values($byDay)
            ]
        ]);
    }

    /**
     * Laporan Stok Produk (No period filters, current snapshot only)
     */
    public function stock(Request $request)
    {
        $lowStockThreshold = 5;
        $query = Product::with('category:id,name')->orderBy('stock', 'asc');

        if ($request->has('category_id') && $request->category_id != '') {
            $query->where('category_id', $request->category_id);
        }

        if ($request->has('low_stock_only') && $request->low_stock_only === 'true') {
            $query->where('stock', '<=', $lowStockThreshold);
        }

        $products = $query->get()->map(function ($product) use ($lowStockThreshold) {
            return [
                'id' => $product->id,
                'product_name' => $product->name,
                'category_name' => $product->category ? $product->category->name : 'Uncategorized',
                'current_stock' => $product->stock,
                'is_low_stock' => $product->stock <= $lowStockThreshold,
                'price' => $product->price,
                'is_active' => $product->is_active
            ];
        });

        return response()->json([
            'status' => 'success',
            'data' => $products
        ]);
    }

    /**
     * Laporan Laba Rugi
     */
    public function profitLoss(Request $request)
    {
        [$startDate, $endDate] = $this->getDateRange($request);

        // Revenue (from transactions)
        $transactions = Transaction::select(
                DB::raw('DATE(created_at) as date'),
                DB::raw('SUM(total) as revenue')
            )
            ->whereDate('created_at', '>=', $startDate)
            ->whereDate('created_at', '<=', $endDate)
            ->groupBy('date')
            ->get()
            ->keyBy('date');

        $totalRevenue = $transactions->sum('revenue');

        // Expenses (from expenses)
        $expenses = Expense::select(
                'type',
                DB::raw('DATE(date) as expense_day'),
                DB::raw('SUM(amount) as amount')
            )
            ->whereDate('date', '>=', $startDate)
            ->whereDate('date', '<=', $endDate)
            ->groupBy('type', 'expense_day')
            ->get();

        $totalRawMaterialExpenses = 0;
        $totalOperationalExpenses = 0;
        
        $dailyExpenses = [];
        foreach ($expenses as $expense) {
            $date = $expense->expense_day;
            if (!isset($dailyExpenses[$date])) $dailyExpenses[$date] = 0;
            
            $dailyExpenses[$date] += $expense->amount;

            if ($expense->type === 'pembelian_bahan_baku') {
                $totalRawMaterialExpenses += $expense->amount;
            } else {
                $totalOperationalExpenses += $expense->amount;
            }
        }
        
        $totalExpenses = $totalRawMaterialExpenses + $totalOperationalExpenses;
        $netProfit = $totalRevenue - $totalExpenses;

        // By Day mapping
        $byDay = $this->generateZeroFilledPeriod($startDate, $endDate, ['revenue' => 0, 'expenses' => 0, 'net_profit' => 0]);
        
        foreach ($byDay as $date => &$data) {
            $rev = isset($transactions[$date]) ? (float) $transactions[$date]->revenue : 0;
            $exp = isset($dailyExpenses[$date]) ? (float) $dailyExpenses[$date] : 0;
            
            $data['revenue'] = $rev;
            $data['expenses'] = $exp;
            $data['net_profit'] = $rev - $exp;
        }

        return response()->json([
            'status' => 'success',
            'data' => [
                'total_revenue' => (float) $totalRevenue,
                'total_expenses' => (float) $totalExpenses,
                'total_raw_material_expenses' => (float) $totalRawMaterialExpenses,
                'total_operational_expenses' => (float) $totalOperationalExpenses,
                'net_profit' => (float) $netProfit,
                'by_day' => array_values($byDay),
                'note' => 'Laporan ini menghitung laba kotor berdasarkan total penjualan dikurangi seluruh pengeluaran (bahan baku + operasional), tanpa perhitungan HPP per produk.'
            ]
        ]);
    }
}
