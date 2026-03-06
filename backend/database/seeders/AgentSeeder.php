<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Service;
use App\Models\Establishment;
use Illuminate\Support\Facades\Hash;

class AgentSeeder extends Seeder
{
    public function run(): void
    {
        $establishmentId = Establishment::query()->value('id');

        $agents = [
            ['name' => 'Alice Agent', 'email' => 'alice.agent@example.com', 'password' => 'password', 'role' => 'agent'],
            ['name' => 'Bob Agent', 'email' => 'bob.agent@example.com', 'password' => 'password', 'role' => 'agent'],
            ['name' => 'Chloe Agent', 'email' => 'chloe.agent@example.com', 'password' => 'password', 'role' => 'agent'],
        ];
        foreach ($agents as $a) {
            User::updateOrCreate(
                ['email' => $a['email']],
                [
                    'name' => $a['name'],
                    'password' => Hash::make($a['password']),
                    'role' => 'agent',
                    'establishment_id' => $establishmentId,
                ]
            );
        }

        $agentIds = User::where('role', 'agent')->pluck('id')->all();
        $serviceIds = Service::pluck('id')->all();
        if (!$serviceIds) return;

        foreach ($agentIds as $uid) {
            $count = min(max(1, random_int(1, 3)), count($serviceIds));
            $indexes = array_unique((array) array_rand($serviceIds, $count));
            $attach = [];
            foreach ($indexes as $i) { $attach[] = $serviceIds[$i]; }
            $agent = User::find($uid);
            if ($agent) { $agent->services()->syncWithoutDetaching($attach); }
        }
    }
}
