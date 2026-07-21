<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCategoryRequest;
use App\Http\Requests\UpdateCategoryRequest;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    public function index(Request $request): JsonResponse
    {   //mencari kategori
        $categories = Category::query()
            ->when($request->filled('search'), function ($query) use ($request) {
                $query->where('name', 'like', '%' . $request->string('search') . '%');
            })
            ->orderBy('name')
            ->paginate(15);

        return response()->json($categories);
    }
    //tambah kategori
    public function store(StoreCategoryRequest $request): JsonResponse
    {
        $category = Category::create($request->validated());

        return response()->json($category, 201);
    }
    //update kategorui
    public function update(UpdateCategoryRequest $request, int $id): JsonResponse
    {
        $category = Category::findOrFail($id);
        $category->update($request->validated());

        return response()->json($category);
    }
    //menghapus kategori
    public function destroy(int $id): JsonResponse
    {
        $category = Category::findOrFail($id);
        //jika sudah ada produk menggunakan kategor tidak bisa dihapus
        if (Product::withTrashed()->where('category_id', $category->id)->exists()) {
            return response()->json([
                'message' => 'Kategori tidak bisa dihapus karena masih digunakan oleh produk.',
            ], 422);
        }

        $category->delete();

        return response()->json([
            'message' => 'Kategori berhasil dihapus.',
        ]);
    }
}