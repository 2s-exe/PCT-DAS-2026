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
        Schema::create('users', function (Blueprint $table) {

            $table->id('id_user');

            $table->string('login')->unique();

            $table->string('mot_de_passe_hash');

            $table->foreignId('id_enseignant')
                ->nullable()
                ->constrained('enseignants', 'id_enseignant')
                ->onDelete('cascade');

            $table->foreignId('id_profil')
                ->constrained('profils', 'id_profil')
                ->onDelete('restrict');

            $table->boolean('actif')->default(true);

            $table->timestamp('derniere_connexion')->nullable();

            $table->rememberToken();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};