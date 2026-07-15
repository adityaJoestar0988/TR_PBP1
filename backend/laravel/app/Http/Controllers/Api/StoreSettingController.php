<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\StoreSetting;
use Illuminate\Http\Request;

class StoreSettingController extends Controller
{
    /**
     * Get store settings.
     */
    public function show()
    {
        $settings = StoreSetting::first();

        if (!$settings) {
            $settings = StoreSetting::create([
                'store_name' => 'SMART POS',
                'address' => 'Alamat Toko',
                'phone' => '08123456789',
                'receipt_footer' => 'Terima Kasih Atas Kunjungan Anda!',
                'allow_kasir_discount' => false,
                'payment_methods' => ['Cash'],
            ]);
        }

        return response()->json([
            'status' => 'success',
            'data' => $settings
        ]);
    }

    /**
     * Update store settings.
     */
    public function update(Request $request)
    {
        $validated = $request->validate([
            'store_name' => 'required|string|max:255',
            'address' => 'nullable|string',
            'phone' => 'nullable|string|max:20',
            'receipt_footer' => 'nullable|string',
            'allow_kasir_discount' => 'required|boolean',
            'payment_methods' => 'required|array|min:1',
            'payment_methods.*' => 'required|string|min:1',
        ]);

        $settings = StoreSetting::first();

        if (!$settings) {
            $settings = StoreSetting::create($validated);
        } else {
            $settings->update($validated);
        }

        return response()->json([
            'status' => 'success',
            'data' => $settings->fresh()
        ]);
    }
}
