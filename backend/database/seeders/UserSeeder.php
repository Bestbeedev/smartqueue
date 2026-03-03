<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $users = [
            [
                'name' => 'Usager',
                'email' => env('USER_EMAIL', 'user@example.com'),
                'password' => env('USER_PASSWORD', 'password'),
                'phone' => env('USER_PHONE') ?: null,
                'role' => 'user',
            ],
        ];

        foreach ($users as $u) {
            User::updateOrCreate(
                ['email' => $u['email']],
                [
                    'name' => $u['name'],
                    'password' => Hash::make($u['password']),
                    'role' => $u['role'],
                    'phone' => $u['phone'],
                    'establishment_id' => null,
                ]
            );
        }

        $count = User::count();
        if ($count < 10) {
            User::factory(10 - $count)->create([
                'role' => 'user',
            ]);
        }
    }
}
