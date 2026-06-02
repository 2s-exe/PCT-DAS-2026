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
        Schema::create('enseignants', function (Blueprint $table) {
            $table->id('id_enseignant');
            $table->string('nom');
            $table->string('prenom');
            $table->string('email')->unique();
            $table->string('telephone')->nullable();
            $table->enum('grade', ['Assistant', 'Maitre-Assistant', 'Professeur']);
            $table->enum('statut', ['Permanent', 'Vacataire']);
            $table->decimal('taux_horaire', 10, 2)->default(0);
            $table->foreignId('id_departement')
                ->constrained('departements', 'id_departement')
                ->onDelete('restrict');
            $table->boolean('actif')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('enseignants');
    }
};
