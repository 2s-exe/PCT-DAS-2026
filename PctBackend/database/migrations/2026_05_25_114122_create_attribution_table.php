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
        Schema::create('attribution', function (Blueprint $table) {
            $table->id('id_attribution');
            $table->foreignId('id_enseignant')
                ->constrained('enseignants', 'id_enseignant')
                ->onDelete('cascade');
            $table->foreignId('id_cours')
                ->constrained('cours', 'id_cours')
                ->onDelete('cascade');
            $table->foreignId('id_annee')
                ->constrained('annees_academiques', 'id_annee')
                ->onDelete('restrict');
            $table->decimal('charge_horaire', 8, 2)->default(0);
            $table->date('date_attribution');
            $table->unique(['id_enseignant', 'id_cours', 'id_annee']); // évite les doublons
            $table->timestamps();

        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('attribution');
    }
};
