<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            SuperAdminSeeder::class,
            AdminSeeder::class,
            EstablishmentSeeder::class,
            ServiceSeeder::class,
            AgentSeeder::class,
            UserSeeder::class,
            TicketSeeder::class,
        ]);
    }
}

