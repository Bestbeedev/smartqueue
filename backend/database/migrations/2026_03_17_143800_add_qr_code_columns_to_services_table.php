<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Ajoute les colonnes pour le QR code permanent du service (VQS).
     */
    public function up(): void
    {
        Schema::table('services', function (Blueprint $table) {
            // Identifiant unique encodé dans le QR code (permanent)
            $table->uuid('qr_code_token')->nullable()->unique();
            // URL de l'image PNG stockée (optionnel, pour affichage)
            $table->string('qr_code_url')->nullable();
            // Date de la dernière génération du QR code
            $table->timestamp('qr_generated_at')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('services', function (Blueprint $table) {
            $table->dropColumn(['qr_code_token', 'qr_code_url', 'qr_generated_at']);
        });
    }
};
