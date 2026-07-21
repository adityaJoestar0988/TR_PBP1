<?php

namespace App\Services;

use App\Models\Product;
use App\Models\StoreSetting;
use App\Models\Transaction;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class TransactionService
{
    public function createTransaction(array $data, int $userId): Transaction
    {
        //menjalankan DB Transaction untuk memastikan semua operasi berhasil atau rollback jika ada error
        return DB::transaction(function () use ($data, $userId) {
            $settings = StoreSetting::first();
            
            $subtotal = 0;
            $itemsToInsert = [];
            
            // Memproses Produk dan Mengecek Stok
            foreach ($data['items'] as $itemData) {
                // Lock the product for update
                $product = Product::where('id', $itemData['product_id'])->lockForUpdate()->first();
                
                if (!$product || !$product->is_active) {
                    throw ValidationException::withMessages([
                        'items' => "Produk tidak valid atau tidak aktif (ID: {$itemData['product_id']})."
                    ]);
                }
                
                if ($product->stock < $itemData['quantity']) {
                    throw ValidationException::withMessages([
                        'items' => "Stok tidak cukup untuk: {$product->name} (tersisa {$product->stock})"
                    ]);
                }
                
                $itemSubtotal = $product->price * $itemData['quantity'];
                $subtotal += $itemSubtotal;
                
                $itemsToInsert[] = [
                    'product' => $product,
                    'quantity' => $itemData['quantity'],
                    'price' => $product->price,
                    'subtotal' => $itemSubtotal,
                ];
            }
            
            // validasi diskon
            $discountValue = $data['discount_value'] ?? 0;
            $discountType = $data['discount_type'] ?? null;
            $discountAmount = 0;
            
            if ($discountValue > 0 && $discountType) {
                if (!$settings || !$settings->allow_kasir_discount) {
                    throw ValidationException::withMessages([
                        'discount' => "Anda tidak memiliki izin memberikan diskon."
                    ]);
                }

                if ($settings->allowed_discount_type !== $discountType) {
                    throw ValidationException::withMessages([
                        'discount' => "Jenis diskon yang digunakan tidak sesuai dengan kebijakan yang berlaku."
                    ]);
                }
                
                if ($discountType === 'percentage') {
                    if ($discountValue < 0 || $discountValue > 100) {
                        throw ValidationException::withMessages([
                            'discount' => "Diskon persentase harus antara 0 dan 100."
                        ]);
                    }
                    $discountAmount = $subtotal * ($discountValue / 100);
                } elseif ($discountType === 'nominal') {
                    if ($discountValue < 0 || $discountValue > $subtotal) {
                        throw ValidationException::withMessages([
                            'discount' => "Diskon nominal tidak boleh melebihi subtotal."
                        ]);
                    }
                    $discountAmount = $discountValue;
                }
            }
            
            $total = $subtotal - $discountAmount;
            
            // validasi pembayaran
            $paymentMethod = $data['payment_method'];
            if (!$settings || !in_array($paymentMethod, $settings->payment_methods ?? [])) {
                throw ValidationException::withMessages([
                    'payment_method' => "Metode pembayaran tidak valid."
                ]);
            }
            
            $paidAmount = $data['paid_amount'];
            if ($paidAmount < $total) {
                throw ValidationException::withMessages([
                    'paid_amount' => "Jumlah bayar kurang dari total."
                ]);
            }
            
            $changeAmount = $paidAmount - $total;
            
            //membuat nomer transaksi
            $today = now()->format('Ymd');
            $countToday = Transaction::whereDate('created_at', now()->toDateString())->count();
            $sequence = str_pad($countToday + 1, 4, '0', STR_PAD_LEFT);
            $transactionNumber = "TRX-{$today}-{$sequence}";
            
            // menyimpan data Transaksi
            $transaction = Transaction::create([
                'transaction_number' => $transactionNumber,
                'user_id' => $userId,
                'subtotal' => $subtotal,
                'discount_type' => $discountType,
                'discount_value' => $discountValue,
                'total' => $total,
                'payment_method' => $paymentMethod,
                'paid_amount' => $paidAmount,
                'change_amount' => $changeAmount,
                'status' => 'completed',
            ]);
            
            foreach ($itemsToInsert as $item) {
                $product = $item['product'];
                
                // mengurangi Stok Produk
                $product->decrement('stock', $item['quantity']);
                
                // Menyimpan Detail Transaksi
                $transaction->transactionItems()->create([
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'price' => $item['price'],
                    'quantity' => $item['quantity'],
                    'subtotal' => $item['subtotal'],
                ]);
            }
            
            return $transaction->load('transactionItems');
        });
    }
}
