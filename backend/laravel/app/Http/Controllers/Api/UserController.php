<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreKasirRequest;
use App\Http\Requests\UpdateKasirRequest;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    //list akun kasir
    public function index()
    {
        // Always filter to kasir role server-side
        $users = User::where('role', 'kasir')
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        return response()->json([
            'status' => 'success',
            'data' => $users
        ]);
    }

    //membuat akun kasir baru
    public function store(StoreKasirRequest $request)
    {
        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => 'kasir', 
            'is_active' => true,
        ]);

        return response()->json([
            'status' => 'success',
            'data' => $user
        ], 201);
    }

    //update akun kasir
    public function update(UpdateKasirRequest $request, $id)
    {
        $user = User::where('role', 'kasir')->find($id);

        if (!$user) {
            return response()->json([
                'status' => 'error',
                'message' => 'Akun kasir tidak ditemukan.'
            ], 404);
        }

        $user->update([
            'name' => $request->name,
            'email' => $request->email,
        ]);

        return response()->json([
            'status' => 'success',
            'data' => $user->fresh()
        ]);
    }

    //toogle status altif/nonaktif akun kasir
    public function toggleActive($id)
    {
        $user = User::where('role', 'kasir')->find($id);

        if (!$user) {
            return response()->json([
                'status' => 'error',
                'message' => 'Akun kasir tidak ditemukan.'
            ], 404);
        }

        $user->update([
            'is_active' => !$user->is_active,
        ]);

        return response()->json([
            'status' => 'success',
            'data' => $user->fresh()
        ]);
    }

    //delete jika tidak ada transaksi
    public function destroy($id)
    {
        $user = User::where('role', 'kasir')->find($id);

        if (!$user) {
            return response()->json([
                'status' => 'error',
                'message' => 'Akun kasir tidak ditemukan.'
            ], 404);
        }

        if (Transaction::where('user_id', $id)->exists()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Akun kasir ini tidak bisa dihapus karena memiliki riwayat transaksi. Nonaktifkan akun sebagai gantinya.'
            ], 422);
        }

        $user->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Akun kasir berhasil dihapus.'
        ]);
    }
}
