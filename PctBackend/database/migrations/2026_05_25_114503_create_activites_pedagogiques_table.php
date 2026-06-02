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
        Schema::create('activites_pedagogiques', function (Blueprint $table) {
            $table->id('id_activite');
            $table->foreignId('id_ressource')
                ->constrained('ressources_pedagogiques', 'id_ressource')
                ->onDelete('cascade');
            $table->unsignedTinyInteger('nb_seances');
            $table->date('date_activite');
            $table->decimal('volume_horaire', 8, 2)->default(0); // calculé automatiquement via ressource et paramètres
            $table->enum('statut', ['brouillon', 'soumis', 'valide', 'rejete'])->default('brouillon');
            $table->text('observations')->nullable();
            $table->foreignId('id_attribution')
                ->constrained('attribution', 'id_attribution')
                ->onDelete('cascade');
            $table->foreignId('id_annee')
                ->constrained('annees_academiques', 'id_annee')
                ->onDelete('restrict');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('activites_pedagogiques');
    }
};
