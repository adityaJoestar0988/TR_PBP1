<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class CatalogModuleTest extends TestCase
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

    public function test_owner_can_create_and_list_categories(): void
    {
        $token = $this->loginOwner();

        $this->withHeader('Authorization', "Bearer {$token}")->postJson('/api/categories', [
            'name' => 'Minuman',
        ])->assertCreated();

        $this->withHeader('Authorization', "Bearer {$token}")->getJson('/api/categories')
            ->assertOk()
            ->assertJsonFragment(['name' => 'Minuman']);
    }

    public function test_category_delete_is_blocked_when_used_by_product(): void
    {
        $token = $this->loginOwner();

        $category = Category::create(['name' => 'Makanan']);

        Product::create([
            'category_id' => $category->id,
            'name' => 'Nasi Goreng',
            'price' => 25000,
            'stock' => 10,
            'is_active' => true,
        ]);

        $this->withHeader('Authorization', "Bearer {$token}")
            ->deleteJson('/api/categories/' . $category->id)
            ->assertStatus(422)
            ->assertJson([
                'message' => 'Kategori tidak bisa dihapus karena masih digunakan oleh produk.',
            ]);
    }

    public function test_owner_can_adjust_stock_and_get_low_stock_products(): void
    {
        $token = $this->loginOwner();
        $category = Category::create(['name' => 'Snack']);

        $product = Product::create([
            'category_id' => $category->id,
            'name' => 'Keripik',
            'price' => 12000,
            'stock' => 2,
            'is_active' => true,
        ]);

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/products/' . $product->id . '/adjust-stock', [
                'quantity' => 3,
                'note' => 'restock supplier',
            ])
            ->assertOk()
            ->assertJsonFragment(['stock' => 5]);

        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/products/low-stock')
            ->assertOk()
            ->assertJsonFragment(['name' => 'Keripik']);
    }

    public function test_stock_adjustment_rejects_negative_resulting_stock(): void
    {
        $token = $this->loginOwner();
        $category = Category::create(['name' => 'Minuman']);

        $product = Product::create([
            'category_id' => $category->id,
            'name' => 'Teh Botol',
            'price' => 7000,
            'stock' => 1,
            'is_active' => true,
        ]);

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/products/' . $product->id . '/adjust-stock', [
                'quantity' => -2,
                'note' => 'correction',
            ])
            ->assertStatus(422)
            ->assertJson([
                'message' => 'Stok tidak boleh kurang dari 0.',
            ]);
    }
}