<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreRawMaterialRequest;
use App\Http\Requests\UpdateRawMaterialRequest;
use App\Models\Expense;
use App\Models\RawMaterial;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RawMaterialController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $rawMaterials = RawMaterial::query()
        //untuk pencarian kata kunci di URL
            ->when($request->filled('search'), function ($query) use ($request) {
                $query->where('name', 'like', '%' . $request->string('search') . '%');
            })
            ->orderBy('name')
            ->paginate(15);

        return response()->json($rawMaterials);
    }

    public function store(StoreRawMaterialRequest $request): JsonResponse
    {
        // Mengambil data yang sudah lolos validasi Form Request
        $data = $request->validated();
        if ($request->hasFile('image')) {
            $data['image'] = $request->file('image')->store('raw_materials', 'public');
        }
        
        $rawMaterial = RawMaterial::create($data);

        return response()->json($rawMaterial, 201);
    }

    public function update(UpdateRawMaterialRequest $request, int $id): JsonResponse
    {
        // Cari bahan baku berdasarkan ID 
        $rawMaterial = RawMaterial::findOrFail($id);
        $data = $request->validated();
        // Hapus gambar LAMA dari storage jika ada
        if ($request->hasFile('image')) {
            if ($rawMaterial->image) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($rawMaterial->image);
            }
            $data['image'] = $request->file('image')->store('raw_materials', 'public');
        }
        
        $rawMaterial->update($data);

        return response()->json($rawMaterial);
    }

    public function destroy(int $id): JsonResponse
    {
        $rawMaterial = RawMaterial::findOrFail($id);

        //cek apakah pernah bahan baku dipakai di tabel pengeluaran
        if (Expense::where('raw_material_id', $rawMaterial->id)->exists()) {
            return response()->json([
                'message' => 'Bahan baku tidak bisa dihapus karena sudah pernah digunakan di pengeluaran.',
            ], 422);
        }
        //jika belum delete
        $rawMaterial->delete();

        return response()->json([
            'message' => 'Bahan baku berhasil dihapus.',
        ]);
    }
}