<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreExpenseRequest;
use App\Http\Requests\UpdateExpenseRequest;
use App\Models\Expense;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ExpenseController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $expenses = Expense::query()
            ->with('rawMaterial')
            ->when($request->filled('start_date'), function ($query) use ($request) {
                $query->whereDate('date', '>=', $request->date('start_date'));
            })
            ->when($request->filled('end_date'), function ($query) use ($request) {
                $query->whereDate('date', '<=', $request->date('end_date'));
            })
            ->when($request->filled('type'), function ($query) use ($request) {
                $query->where('type', $request->string('type'));
            })
            ->orderByDesc('date')
            ->paginate(15);

        return response()->json($expenses);
    }

    public function store(StoreExpenseRequest $request): JsonResponse
    {
        $expense = DB::transaction(function () use ($request) {
            return Expense::create([
                ...$request->validated(),
                'user_id' => $request->user('api')->id,
            ]);
        });

        $expense->load('rawMaterial');

        return response()->json($expense, 201);
    }

    public function update(UpdateExpenseRequest $request, int $id): JsonResponse
    {
        $expense = Expense::findOrFail($id);

        DB::transaction(function () use ($request, $expense) {
            $expense->update($request->validated());
        });

        $expense->load('rawMaterial');

        return response()->json($expense);
    }

    public function destroy(int $id): JsonResponse
    {
        $expense = Expense::findOrFail($id);

        DB::transaction(function () use ($expense) {
            $expense->delete();
        });

        return response()->json([
            'message' => 'Pengeluaran berhasil dihapus.',
        ]);
    }
}