<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tickets', function (Blueprint $table) {
            $table->string('customer_name')->nullable()->after('user_id');
            $table->string('customer_phone', 20)->nullable()->after('customer_name');
            $table->boolean('is_senior')->default(false)->after('customer_phone');
            $table->boolean('is_handicap')->default(false)->after('is_senior');
            $table->boolean('is_pregnant')->default(false)->after('is_handicap');
        });
    }

    public function down(): void
    {
        Schema::table('tickets', function (Blueprint $table) {
            $table->dropColumn(['customer_name', 'customer_phone', 'is_senior', 'is_handicap', 'is_pregnant']);
        });
    }
};
