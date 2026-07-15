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
            ->when($request->filled('search'), function ($query) use ($request) {
                $query->where('name', 'like', '%' . $request->string('search') . '%');
            })
            ->when($request->filled('category_id'), function ($query) use ($request) {
                $query->where('category_id', $request->integer('category_id'));
            })
            ->orderBy('name')
            ->paginate(15);

        $products->getCollection()->transform(function (Product $product) {
            $product->setAttribute('is_low_stock', $product->stock <= self::LOW_STOCK_THRESHOLD);

            return $product;
        });

        return response()->json($products);
    }

    public function lowStock(): JsonResponse
    {
        $products = Product::query()
            ->with('category')
            ->where('is_active', true)
            ->where('stock', '<=', self::LOW_STOCK_THRESHOLD)
            ->orderBy('stock')
            ->get()
            ->map(function (Product $product) {
                $product->setAttribute('is_low_stock', true);

                return $product;
            });

        return response()->json($products);
    }

    public function store(StoreProductRequest $request): JsonResponse
    {
        $data = $request->validated();
        if ($request->hasFile('image')) {
            $data['image'] = $request->file('image')->store('products', 'public');
        }
        
        $product = Product::create($data);
        $product->load('category');
        $product->setAttribute('is_low_stock', $product->stock <= self::LOW_STOCK_THRESHOLD);

        return response()->json($product, 201);
    }

    public function update(UpdateProductRequest $request, int $id): JsonResponse
    {
        $product = Product::findOrFail($id);
        $data = $request->validated();
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

    public function destroy(int $id): JsonResponse
    {
        $product = Product::withTrashed()->find($id);

        if (! $product || $product->trashed()) {
            return response()->json([
                'message' => 'Produk tidak ditemukan.',
            ], 404);
        }

        // TODO: Step 6+ will add a check here — block delete if product has transaction_items
        $product->delete();

        return response()->json([
            'message' => 'Produk berhasil dihapus.',
        ]);
    }

    public function adjustStock(AdjustStockRequest $request, int $id): JsonResponse
    {
        $product = Product::findOrFail($id);
        $quantityChange = $request->integer('quantity');
        $newStock = $product->stock + $quantityChange;

        if ($newStock < 0) {
            return response()->json([
                'message' => 'Stok tidak boleh kurang dari 0.',
            ], 422);
        }

        $product->update([
            'stock' => $newStock,
        ]);

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