<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('expenses', function (Blueprint $table) {
            $table->id();
            $table->date('date');
            $table->enum('type', ['pembelian_bahan_baku', 'operasional']);
            $table->foreignId('raw_material_id')->nullable()->constrained('raw_materials')->restrictOnDelete();
            // Amount validation (> 0) will be enforced at the controller/service layer later.
            $table->decimal('amount', 10, 2);
            $table->text('description')->nullable();
            $table->foreignId('user_id')->constrained('users')->restrictOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('expenses');
    }
};