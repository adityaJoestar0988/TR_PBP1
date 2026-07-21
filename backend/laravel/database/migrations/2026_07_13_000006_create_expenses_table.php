<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{

    public function up(): void
    {
        Schema::create('expenses', function (Blueprint $table) {
            $table->id();
            $table->date('date');
            $table->enum('type', [
                'pembelian_bahan_baku', 
                'operasional'
                ]);

            $table->integer('quantity')->nullable();
            $table->decimal('unit_price', 10, 2)->nullable();            
            $table->foreignId('raw_material_id')
                ->nullable()
                ->constrained()
                ->restrictOnDelete();
            $table->decimal('amount', 10, 2);
            $table->text('description')->nullable();
            $table->foreignId('user_id')
                ->constrained()
                ->restrictOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('expenses');
    }
};