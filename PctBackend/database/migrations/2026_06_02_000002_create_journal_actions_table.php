<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('journal_actions', function (Blueprint $table) {
            $table->id('id_journal');

            // Acteur — SET NULL : si l'user est supprimé, l'historique reste
            $table->unsignedBigInteger('id_user')->nullable();
            $table->foreign('id_user')
                ->references('id_user')
                ->on('users')
                ->onDelete('set null');

            // Identification de l'action
            $table->string('action', 100);      // 'creation_compte', 'login_succes', 'validation_activite'...
            $table->string('module', 50);        // 'users', 'auth', 'activites', 'attributions'...
            $table->text('description');         // Texte lisible humain

            // Snapshots avant/après pour audit complet
            $table->json('donnees_avant')->nullable();
            $table->json('donnees_apres')->nullable();

            // Contexte réseau
            $table->string('adresse_ip', 45)->nullable();   // IPv4 ou IPv6
            $table->string('user_agent', 255)->nullable();

            // Résultat
            $table->enum('statut', ['succes', 'echec', 'refus'])->default('succes');

            $table->timestamp('created_at')->useCurrent();

            // Index pour requêtes fréquentes (supervision, rapports d'audit)
            $table->index('id_user');
            $table->index('module');
            $table->index('action');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('journal_actions');
    }
};
