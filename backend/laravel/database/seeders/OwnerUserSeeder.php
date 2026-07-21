<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class OwnerUserSeeder extends Seeder
{
    use WithoutModelEvents;
    public function run(): void
    {
        User::firstOrCreate(
            ['email' => 'Owner2@gmail.com'],
            [
                'name' => 'Owner2',
                'role' => 'owner',
                'is_active' => true,
                'password' => Hash::make('1234'),
            ]
        );
    }
}
