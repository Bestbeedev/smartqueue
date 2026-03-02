<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        User::firstOrCreate(
            ['email' => 'admin@example.com'],
            [
                'name' => 'Admin',
                'password' => Hash::make('password'),
                'role' => 'admin',
            ]
        );

        User::firstOrCreate(
            ['email' => 'agent@example.com'],
            [
                'name' => 'Agent',
                'password' => Hash::make('password'),
                'role' => 'agent',
            ]
        );
        $count = User::count();
        if ($count < 10) {
            User::factory(10 - $count)->create();
        }
        $this->call([
            SuperAdminSeeder::class,
            EstablishmentSeeder::class,
            ServiceSeeder::class,
            AgentSeeder::class,
            TicketSeeder::class,
        ]);
    }
}

