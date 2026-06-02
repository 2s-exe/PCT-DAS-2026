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
        Schema::create('param_calculs', function (Blueprint $table) {
            $table->id('id_parametre');
            $table->enum('type_operation', ['conception', 'mise_a_jour']);
            $table->unsignedTinyInteger('niveau');
            $table->string('libelle_niveau', 150);
            $table->decimal('heures_par_seance', 5, 2);
            $table->foreignId('id_annee')
                ->constrained('annees_academiques', 'id_annee')
                ->onDelete('cascade');
            $table->unique(['type_operation', 'niveau', 'id_annee']);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('param_calculs');
    }
};
