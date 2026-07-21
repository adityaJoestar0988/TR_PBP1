<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\AdjustStockRequest;
use App\Http\Requests\StoreProductRequest;
use App\Http\Requests\UpdateProductRequest;
use App\Models\Product;
use App\Models\StockAdjustment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductController extends Controller
{      

    private const LOW_STOCK_THRESHOLD = 5;

    public function index(Request $request): JsonResponse
    {
        $products = Product::query()
            ->with('category')
            //Melakukan Pencarian Produk
            ->when($request->filled('search'), function ($query) use ($request) {
                $query->where('name', 'like', '%' . $request->string('search') . '%');
            })
            //Memfilter Berdasarkan Kategori
            ->when($request->filled('category_id'), function ($query) use ($request) {
                $query->where('category_id', $request->integer('category_id'));
            })
            ->orderBy('name')
            ->paginate(15);

            //stock menipis
        $products->getCollection()->transform(function (Product $product) {
            $product->setAttribute('is_low_stock', $product->stock <= self::LOW_STOCK_THRESHOLD);

            return $product;
        });

        return response()->json($products);
    }

    public function lowStock(): JsonResponse
    {
            //menampilkan produk aktif
        $products = Product::query()
            ->with('category')
            ->where('is_active', true)
            //stock paling sedikit muncul paling pertama
            ->where('stock', '<=', self::LOW_STOCK_THRESHOLD)
            ->orderBy('stock')
            ->get()
            ->map(function (Product $product) {
                $product->setAttribute('is_low_stock', true);

                return $product;
            });

        return response()->json($products);
    }

    //tambah produk baru ke database
    public function store(StoreProductRequest $request): JsonResponse
    {
        $data = $request->validated();
        if ($request->hasFile('image')) {
            $data['image'] = $request->file('image')->store('products', 'public');
        }
        
        $product = Product::create($data);
        //Mengambil Relasi Kategori
        $product->load('category');
        $product->setAttribute('is_low_stock', $product->stock <= self::LOW_STOCK_THRESHOLD);

        return response()->json($product, 201);
    }

    //memperbarui data produk
    public function update(UpdateProductRequest $request, int $id): JsonResponse
    {
        $product = Product::findOrFail($id);
        $data = $request->validated();
        //jika upload gambar baru, gambar lama dihapus
        if ($request->hasFile('image')) {
            if ($product->image) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($product->image);
            }
            $data['image'] = $request->file('image')->store('products', 'public');
        }
        
        $product->update($data);
        $product->load('category');
        $product->setAttribute('is_low_stock', $product->stock <= self::LOW_STOCK_THRESHOLD);

        return response()->json($product);
    }

    //menghapus data produk
    public function destroy(int $id): JsonResponse
    {
        $product = Product::withTrashed()->find($id);
        //Memastikan Produk Masih Aktif
        if (! $product || $product->trashed()) {
            return response()->json([
                'message' => 'Produk tidak ditemukan.',
            ], 404);
        }

        //jika sudah ada transaksi maka tidak bisa dihapus
        $product->delete();

        return response()->json([
            'message' => 'Produk berhasil dihapus.',
        ]);
    }
    //penyesuaian stock produk dan mencatat riwayat transaksi
    public function adjustStock(AdjustStockRequest $request, int $id): JsonResponse
    {
        $product = Product::findOrFail($id);
        //Mengambil jumlah stok yang akan ditambahkan atau dikurangi.
        $quantityChange = $request->integer('quantity');
        //Menghitung jumlah stok setelah dilakukan penyesuaian.
        $newStock = $product->stock + $quantityChange;

        if ($newStock < 0) {
            return response()->json([
                'message' => 'Stok tidak boleh kurang dari 0.',
            ], 422);
        }
    
        $product->update([
            'stock' => $newStock,
        ]);
        //Mencatat Riwayat Penyesuaian ke tabel stock_adjustments.
        StockAdjustment::create([
            'product_id' => $product->id,
            'quantity_change' => $quantityChange,
            'note' => $request->input('note'),
            'user_id' => $request->user('api')->id,
        ]);

        $product->load('category');
        $product->setAttribute('is_low_stock', $product->stock <= self::LOW_STOCK_THRESHOLD);

        return response()->json($product);
    }
}