<?php

namespace Tests\Feature;

use App\Models\CashFlow;
use App\Models\Category;
use App\Models\Expense;
use App\Models\Product;
use App\Models\RawMaterial;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class ExpenseModuleTest extends TestCase
{
    use RefreshDatabase;

    private function loginOwner(): string
    {
        User::create([
            'name' => 'Aditya',
            'email' => 'aditya@mail.com',
            'role' => 'admin',
            'is_active' => true,
            'password' => Hash::make('aditya123'),
        ]);

        return $this->postJson('/api/auth/login', [
            'email' => 'aditya@mail.com',
            'password' => 'aditya123',
        ])->json('token');
    }

    public function test_bahan_baku_expense_creates_matching_cashflow(): void
    {
        $token = $this->loginOwner();
        $rawMaterial = RawMaterial::create([
            'name' => 'Beras',
            'unit' => 'kg',
        ]);

        $response = $this->withHeader('Authorization', "Bearer {$token}")->postJson('/api/expenses', [
            'date' => '2026-07-14',
            'type' => 'pembelian_bahan_baku',
            'raw_material_id' => $rawMaterial->id,
            'amount' => 50000,
            'description' => 'Restock awal',
        ]);

        $response->assertCreated();

        $expenseId = $response->json('id');

        $this->assertDatabaseHas('cash_flows', [
            'type' => 'out',
            'source_type' => 'expense',
            'source_id' => $expenseId,
            'amount' => 50000,
        ]);
    }

    public function test_operasional_expense_requires_no_raw_material_and_creates_cashflow(): void
    {
        $token = $this->loginOwner();

        $response = $this->withHeader('Authorization', "Bearer {$token}")->postJson('/api/expenses', [
            'date' => '2026-07-14',
            'type' => 'operasional',
            'raw_material_id' => 1,
            'amount' => 25000,
            'description' => 'Listrik',
        ]);

        $response->assertStatus(422);

        $created = $this->withHeader('Authorization', "Bearer {$token}")->postJson('/api/expenses', [
            'date' => '2026-07-14',
            'type' => 'operasional',
            'amount' => 25000,
            'description' => 'Listrik',
        ]);

        $created->assertCreated();

        $this->assertDatabaseHas('cash_flows', [
            'type' => 'out',
            'source_type' => 'expense',
            'source_id' => $created->json('id'),
            'amount' => 25000,
        ]);
    }

    public function test_editing_expense_amount_updates_cashflow(): void
    {
        $token = $this->loginOwner();
        $rawMaterial = RawMaterial::create([
            'name' => 'Gula',
            'unit' => 'kg',
        ]);

        $expense = Expense::create([
            'date' => '2026-07-14',
            'type' => 'pembelian_bahan_baku',
            'raw_material_id' => $rawMaterial->id,
            'amount' => 40000,
            'description' => 'Awal',
            'user_id' => User::first()->id,
        ]);

        $this->withHeader('Authorization', "Bearer {$token}")->putJson('/api/expenses/' . $expense->id, [
            'date' => '2026-07-14',
            'type' => 'pembelian_bahan_baku',
            'raw_material_id' => $rawMaterial->id,
            'amount' => 70000,
            'description' => 'Awal',
        ])->assertOk();

        $this->assertDatabaseHas('cash_flows', [
            'source_type' => 'expense',
            'source_id' => $expense->id,
            'amount' => 70000,
        ]);
    }

    public function test_deleting_expense_deletes_related_cashflow(): void
    {
        $token = $this->loginOwner();
        $rawMaterial = RawMaterial::create([
            'name' => 'Tepung',
            'unit' => 'kg',
        ]);

        $expense = Expense::create([
            'date' => '2026-07-14',
            'type' => 'pembelian_bahan_baku',
            'raw_material_id' => $rawMaterial->id,
            'amount' => 20000,
            'description' => 'Awal',
            'user_id' => User::first()->id,
        ]);

        $this->withHeader('Authorization', "Bearer {$token}")->deleteJson('/api/expenses/' . $expense->id)->assertOk();

        $this->assertDatabaseMissing('cash_flows', [
            'source_type' => 'expense',
            'source_id' => $expense->id,
        ]);
    }

    public function test_raw_material_delete_is_blocked_when_used_by_expense(): void
    {
        $token = $this->loginOwner();
        $rawMaterial = RawMaterial::create([
            'name' => 'Bawang',
            'unit' => 'kg',
        ]);

        Expense::create([
            'date' => '2026-07-14',
            'type' => 'pembelian_bahan_baku',
            'raw_material_id' => $rawMaterial->id,
            'amount' => 10000,
            'description' => 'Awal',
            'user_id' => User::first()->id,
        ]);

        $this->withHeader('Authorization', "Bearer {$token}")->deleteJson('/api/raw-materials/' . $rawMaterial->id)
            ->assertStatus(422)
            ->assertJson([
                'message' => 'Bahan baku tidak bisa dihapus karena sudah pernah digunakan di pengeluaran.',
            ]);
    }

    public function test_future_date_expense_is_rejected(): void
    {
        $token = $this->loginOwner();

        $response = $this->withHeader('Authorization', "Bearer {$token}")->postJson('/api/expenses', [
            'date' => '2999-01-01',
            'type' => 'operasional',
            'amount' => 5000,
            'description' => 'Tidak valid',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('date');
    }
}