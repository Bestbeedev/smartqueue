<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $driver = DB::getDriverName();

        if ($driver === 'pgsql') {
            $constraints = DB::select("SELECT conname FROM pg_constraint WHERE conrelid = 'tickets'::regclass AND pg_get_constraintdef(oid) ILIKE '%priority%'");
            foreach ($constraints as $constraint) {
                DB::statement('ALTER TABLE tickets DROP CONSTRAINT IF EXISTS "' . $constraint->conname . '"');
            }
            DB::statement("ALTER TABLE tickets ADD CONSTRAINT tickets_priority_check CHECK (priority IN ('normal','high','vip','urgence'))");
        } elseif ($driver === 'mysql') {
            DB::statement("ALTER TABLE tickets MODIFY COLUMN priority ENUM('normal','high','vip','urgence') NOT NULL DEFAULT 'normal'");
        }
    }

    public function down(): void
    {
        $driver = DB::getDriverName();

        if ($driver === 'pgsql') {
            $constraints = DB::select("SELECT conname FROM pg_constraint WHERE conrelid = 'tickets'::regclass AND pg_get_constraintdef(oid) ILIKE '%priority%'");
            foreach ($constraints as $constraint) {
                DB::statement('ALTER TABLE tickets DROP CONSTRAINT IF EXISTS "' . $constraint->conname . '"');
            }
            DB::statement("ALTER TABLE tickets ADD CONSTRAINT tickets_priority_check CHECK (priority IN ('normal','high','vip'))");
        } elseif ($driver === 'mysql') {
            DB::statement("ALTER TABLE tickets MODIFY COLUMN priority ENUM('normal','high','vip') NOT NULL DEFAULT 'normal'");
        }
    }
};
