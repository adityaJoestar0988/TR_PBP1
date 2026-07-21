<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CashFlow;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CashFlowController extends Controller
{
    //custom date range
    private function getDateRange(Request $request)
    {
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');
        //rentang default
        if (!$startDate || !$endDate) {
            $startDate = now()->startOfMonth()->toDateString();
            $endDate = now()->endOfMonth()->toDateString();
        }

        return [$startDate, $endDate];
    }

    //Mengambil daftar riwayat transaksi arus kas secara rinci
    public function index(Request $request)
    {
        [$startDate, $endDate] = $this->getDateRange($request);
        
        $query = CashFlow::orderBy('date', 'desc')
            ->orderBy('created_at', 'desc')
            ->whereDate('date', '>=', $startDate)
            ->whereDate('date', '<=', $endDate);

        if ($request->has('type') && in_array($request->type, ['in', 'out'])) {
            $query->where('type', $request->type);
        }

        return response()->json([
            'status' => 'success',
            'data' => $query->paginate(15)
        ]);
    }


    public function summary(Request $request)
    {
        $periodType = $request->query('period', 'monthly');
        //Logika penentuan $startDate & $endDate berdasarkan opsi: daily, monthly, custom
        $startDate = null;
        $endDate = null;
        // untuk harian
        if ($periodType === 'daily') {
            $date = $request->query('date', now()->toDateString());
            $startDate = $date;
            $endDate = $date;
        //bulanan
        } elseif ($periodType === 'monthly') {
            $month = $request->query('month', now()->month);
            $year = $request->query('year', now()->year);
            $startDate = Carbon::create($year, $month, 1)->startOfMonth()->toDateString();
            $endDate = Carbon::create($year, $month, 1)->endOfMonth()->toDateString();\
        //custom
        } elseif ($periodType === 'custom') {
            $startDate = $request->query('start_date');
            $endDate = $request->query('end_date');
            
            if (!$startDate || !$endDate || $startDate > $endDate) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Rentang tanggal tidak valid.'
                ], 422);
            }
        } else {
            return response()->json([
                'status' => 'error',
                'message' => 'Periode tidak valid.'
            ], 422);
        }

        // Efficient aggregate query
        $totals = CashFlow::select('type', DB::raw('SUM(amount) as total'))
            ->whereDate('date', '>=', $startDate)
            ->whereDate('date', '<=', $endDate)
            ->groupBy('type')
            ->pluck('total', 'type');

        $totalIn = (float) ($totals['in'] ?? 0);
        $totalOut = (float) ($totals['out'] ?? 0);

        return response()->json([
            'status' => 'success',
            'data' => [
                'period' => [
                    'type' => $periodType,
                    'start_date' => $startDate,
                    'end_date' => $endDate,
                ],
                'total_cash_in' => $totalIn,
                'total_cash_out' => $totalOut,
                'saldo' => $totalIn - $totalOut,
            ]
        ]);
    }


    public function dailyBreakdown(Request $request)
    {
        //Ambil tanggal awal & akhir
        $startDate = clone Carbon::parse($request->query('start_date', now()->startOfMonth()));
        $endDate = clone Carbon::parse($request->query('end_date', now()->endOfMonth()));

        //Proteksi maksimal 366 hari
        if ($startDate->diffInDays($endDate) > 366) {
            return response()->json([
                'status' => 'error',
                'message' => 'Rentang tanggal maksimal 366 hari.'
            ], 422);
        }

        // Query data nyata dari database
        $data = CashFlow::select('date', 'type', DB::raw('SUM(amount) as total'))
            ->whereDate('date', '>=', $startDate->toDateString())
            ->whereDate('date', '<=', $endDate->toDateString())
            ->groupBy('date', 'type')
            ->get();

        // Pengisian tanggal kosong (Zero-Filling)
        $groupedData = [];
        foreach ($data as $row) {
            if (!isset($groupedData[$row->date])) {
                $groupedData[$row->date] = ['in' => 0, 'out' => 0];
            }
            $groupedData[$row->date][$row->type] = (float) $row->total;
        }

        // Generate zero-filled period
        $period = CarbonPeriod::create($startDate, $endDate);
        $breakdown = [];
        
        $cumulativeSaldo = 0; // if we wanted cumulative, but spec says `{ date, cash_in, cash_out, saldo }` where saldo per day is in - out? 
        // "saldo" in a daily context usually means net for that day, or running balance. I will use daily net.

        foreach ($period as $date) {
            $dateString = $date->toDateString();
            $cashIn = $groupedData[$dateString]['in'] ?? 0;
            $cashOut = $groupedData[$dateString]['out'] ?? 0;
            
            $breakdown[] = [
                'date' => $dateString,
                'cash_in' => $cashIn,
                'cash_out' => $cashOut,
                'saldo' => $cashIn - $cashOut,
            ];
        }

        return response()->json([
            'status' => 'success',
            'data' => $breakdown
        ]);
    }
}
