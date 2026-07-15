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
        Schema::table('expenses', function (Blueprint $table) {
            $table->decimal('unit_price', 10, 2)->nullable()->after('type');
            $table->integer('quantity')->nullable()->after('unit_price');
        });

        Schema::table('cash_flows', function (Blueprint $table) {
            $table->decimal('unit_price', 10, 2)->nullable()->after('amount');
            $table->integer('quantity')->nullable()->after('unit_price');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('expenses', function (Blueprint $table) {
            $table->dropColumn(['unit_price', 'quantity']);
        });

        Schema::table('cash_flows', function (Blueprint $table) {
            $table->dropColumn(['unit_price', 'quantity']);
        });
    }
};
