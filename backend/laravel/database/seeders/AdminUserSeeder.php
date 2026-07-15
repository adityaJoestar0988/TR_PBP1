<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        User::firstOrCreate(
            ['email' => 'aditya@mail.com'],
            [
                'name' => 'Aditya',
                'role' => 'admin',
                'is_active' => true,
                'password' => Hash::make('aditya123'),
            ]
        );
    }
}