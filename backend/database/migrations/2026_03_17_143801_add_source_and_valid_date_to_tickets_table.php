<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Ajoute les colonnes source et valid_date pour les tickets (VQS).
     */
    public function up(): void
    {
        Schema::table('tickets', function (Blueprint $table) {
            // Source du ticket (comment il a été créé)
            $table->enum('source', ['app', 'qr_scan', 'agent', 'sms', 'kiosk'])->default('app');
            // Date de validité du ticket (ticket invalide après minuit ce jour-là)
            $table->date('valid_date')->nullable();
            
            // Index pour vérifier les tickets actifs par jour
            $table->index(['service_id', 'user_id', 'valid_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tickets', function (Blueprint $table) {
            $table->dropColumn(['source', 'valid_date']);
        });
    }
};
