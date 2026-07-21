<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{

    public function up(): void
    {
        Schema::create('store_settings', function (Blueprint $table) {
            $table->id();
            $table->string('store_name');
            $table->text('address')->nullable();
            $table->string('phone')->nullable();
            $table->text('receipt_footer')->nullable();
            $table->boolean('allow_kasir_discount')
                ->default(false)
                ->nullable();
            $table->string('allowed_discount_type')->nullable();
            $table->json('payment_methods') ->nullable();
            $table->timestamps();
        });
    }


    public function down(): void
    {
        Schema::dropIfExists('store_settings');
    }
};