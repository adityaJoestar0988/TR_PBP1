<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

class AuthModuleTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_login_and_receive_token_and_user_payload(): void
    {
        User::create([
            'name' => 'Aditya',
            'email' => 'aditya@mail.com',
            'role' => 'admin',
            'is_active' => true,
            'password' => Hash::make('aditya123'),
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'aditya@mail.com',
            'password' => 'aditya123',
        ]);

        $response->assertOk();
        $response->assertJsonStructure([
            'token',
            'user' => [
                'id',
                'name',
                'email',
                'role',
            ],
        ]);
        $response->assertJson([
            'user' => [
                'name' => 'Aditya',
                'email' => 'aditya@mail.com',
                'role' => 'admin',
            ],
        ]);
    }

    public function test_login_with_wrong_password_returns_generic_error(): void
    {
        User::create([
            'name' => 'Aditya',
            'email' => 'aditya@mail.com',
            'role' => 'admin',
            'is_active' => true,
            'password' => Hash::make('aditya123'),
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'aditya@mail.com',
            'password' => 'wrong-password',
        ]);

        $response->assertStatus(401);
        $response->assertJson([
            'message' => 'Email atau password salah',
        ]);
    }

    public function test_kasir_is_blocked_from_owner_only_route(): void
    {
        Route::middleware(['auth:api', 'role:owner'])->get('/api/__test_owner_only', function () {
            return response()->json(['ok' => true]);
        });

        User::create([
            'name' => 'Kasir Test',
            'email' => 'kasir@mail.com',
            'role' => 'kasir',
            'is_active' => true,
            'password' => Hash::make('kasir123'),
        ]);

        $login = $this->postJson('/api/auth/login', [
            'email' => 'kasir@mail.com',
            'password' => 'kasir123',
        ]);

        $token = $login->json('token');

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/__test_owner_only');

        $response->assertStatus(403);
        $response->assertJson([
            'message' => 'Anda tidak memiliki akses ke resource ini.',
        ]);
    }

    public function test_logout_invalidates_token(): void
    {
        User::create([
            'name' => 'Aditya',
            'email' => 'aditya@mail.com',
            'role' => 'admin',
            'is_active' => true,
            'password' => Hash::make('aditya123'),
        ]);

        $login = $this->postJson('/api/auth/login', [
            'email' => 'aditya@mail.com',
            'password' => 'aditya123',
        ]);

        $token = $login->json('token');

        $logout = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/auth/logout');

        $logout->assertOk();

        $me = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/auth/me');

        $me->assertStatus(401);
    }
}