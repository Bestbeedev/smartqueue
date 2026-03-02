<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Pas de changement de schéma: role est déjà un string.
        // Cette migration sert de jalon pour le déploiement du rôle super_admin.
    }

    public function down(): void
    {
        // No-op
    }
};
