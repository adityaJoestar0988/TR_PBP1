<?php

namespace App\Http\Controllers\Api;

use App\Services\TransactionService;
use App\Http\Requests\StoreTransactionRequest;
use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Http\Request;

class PosController extends Controller
{
    
    public function getProducts(Request $request)
    {
        $query = Product::with('category:id,name')
            ->where('is_active', true)
            ->where('stock', '>', 0)
            ->select('id', 'name', 'price', 'stock', 'category_id', 'image');

        //filter berdasarkan nama
        if ($request->has('search') && $request->search != '') {
            $query->where('name', 'like', '%' . $request->search . '%');
        }
        //berdasarkan kategoru
        if ($request->has('category_id') && $request->category_id != '') {
            $query->where('category_id', $request->category_id);
        }

        return response()->json([
            'status' => 'success',
            'data' => $query->get()
        ]);
    }

    //Get all kategori untuk pos kasir
    public function getCategories()
    {
        $categories = Category::select('id', 'name')->get();
        
        return response()->json([
            'status' => 'success',
            'data' => $categories
        ]);
    }

    //Memuat Pengaturan Kasir & Struk
    public function getSettings()
    {
        $settings = \App\Models\StoreSetting::first();
        
        return response()->json([
            'status' => 'success',
            'data' => [
                'allow_kasir_discount' => $settings ? $settings->allow_kasir_discount : false,
                'allowed_discount_type' => $settings ? $settings->allowed_discount_type : null,
                'payment_methods' => $settings ? $settings->payment_methods : ['Cash'],
                'store_name' => $settings ? $settings->store_name : 'SMART POS',
                'address' => $settings ? $settings->address : 'Alamat Toko',
                'phone' => $settings ? $settings->phone : '08123456789',
                'receipt_footer' => $settings ? $settings->receipt_footer : 'Terima Kasih'
            ]
        ]);
    }

    //Memproses Checkout / Bayar
    public function storeTransaction(StoreTransactionRequest $request, TransactionService $service)
    {
        $transaction = $service->createTransaction($request->validated(), auth()->id());
        
        return response()->json([
            'status' => 'success',
            'data' => $transaction
        ], 201);
    }
}
