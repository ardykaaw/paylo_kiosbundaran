<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->foreignId('shift_id')->nullable()->after('branch_id')->constrained()->nullOnDelete();
            $table->decimal('cash_amount', 15, 2)->default(0)->after('paid_amount');
            $table->decimal('transfer_amount', 15, 2)->default(0)->after('cash_amount');
            $table->decimal('extra_charge_amount', 15, 2)->default(0)->after('tax_amount');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->dropForeign(['shift_id']);
            $table->dropColumn(['shift_id', 'cash_amount', 'transfer_amount', 'extra_charge_amount']);
        });
    }
};
