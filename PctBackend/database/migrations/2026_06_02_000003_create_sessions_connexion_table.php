<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sessions_connexion', function (Blueprint $table) {
            $table->id('id_session');

            $table->unsignedBigInteger('id_user');
            $table->foreign('id_user')
                ->references('id_user')
                ->on('users')
                ->onDelete('cascade');

            // Lien vers le token Sanctum (pour révocation croisée)
            $table->unsignedBigInteger('token_id')->nullable();

            // Contexte réseau
            $table->string('adresse_ip', 45)->nullable();
            $table->string('user_agent', 255)->nullable();

            // Cycle de vie de la session
            $table->timestamp('date_connexion')->useCurrent();
            $table->timestamp('date_deconnexion')->nullable(); // NULL = session active

            $table->enum('statut', ['active', 'expiree', 'revoquee'])->default('active');

            $table->timestamps();

            // Index pour détection de sessions multiples
            $table->index(['id_user', 'statut']);
            $table->index('date_connexion');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sessions_connexion');
    }
};
