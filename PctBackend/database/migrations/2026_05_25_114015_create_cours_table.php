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
        Schema::create('cours', function (Blueprint $table) {
            $table->id('id_cours');
            $table->string('intitule_ecue');
            $table->enum('niveau', ['L1', 'L2', 'L3', 'M1', 'M2']);
            $table->enum('semestre', ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8', 'S9', 'S10']);
            $table->integer('credit_ecue')->default(0);
            $table->string('code_specialite')->nullable();
            $table->decimal('charge_horaire_annuel', 8, 2)->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cours');
    }
};
