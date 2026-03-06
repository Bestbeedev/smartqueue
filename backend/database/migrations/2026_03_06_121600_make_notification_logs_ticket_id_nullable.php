<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Permet de logger des notifications non liées à un ticket (ex: broadcast admin).
     *
     * Important: la migration initiale créait ticket_id NOT NULL.
     * Sur un environnement déjà migré (Railway), modifier l'ancienne migration ne suffit pas.
     * On doit donc faire un ALTER TABLE via une nouvelle migration.
     */
    public function up(): void
    {
        Schema::table('notification_logs', function (Blueprint $table) {
            $table->foreignId('ticket_id')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('notification_logs', function (Blueprint $table) {
            $table->foreignId('ticket_id')->nullable(false)->change();
        });
    }
};
