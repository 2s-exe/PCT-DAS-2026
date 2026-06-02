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
        Schema::create('volumes_horaires', function (Blueprint $table) {
            $table->id('id_volume');
            $table->decimal('heures_prevues', 8, 2)->default(0);
            $table->decimal('heures_realisees', 8, 2)->default(0);
            $table->decimal('heures_complementaires', 8, 2)->default(0); // calculé : réalisées - prévues
            $table->foreignId('id_enseignant')
                ->constrained('enseignants', 'id_enseignant')
                ->onDelete('cascade');
            $table->foreignId('id_annee')
                ->constrained('annees_academiques', 'id_annee')
                ->onDelete('restrict');
            $table->unique(['id_enseignant', 'id_annee']); // 1 volume par enseignant par année
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('volumes_horaires');
    }
};
