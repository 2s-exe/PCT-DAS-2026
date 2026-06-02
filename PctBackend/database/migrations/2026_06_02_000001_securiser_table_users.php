<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Corriger le cascade dangereux : supprimer un enseignant ne doit pas supprimer son compte
            $table->dropForeign(['id_enseignant']);
            $table->foreign('id_enseignant')
                ->references('id_enseignant')
                ->on('enseignants')
                ->onDelete('set null'); // L'user reste, id_enseignant devient null → traçabilité préservée

            // Unicité : un enseignant ne peut avoir qu'un seul compte actif
            $table->unique('id_enseignant', 'users_id_enseignant_unique');

            // Champs de sécurité
            $table->boolean('mot_de_passe_change_requis')->default(true)->after('actif');
            $table->unsignedTinyInteger('nb_tentatives_echec')->default(0)->after('mot_de_passe_change_requis');
            $table->timestamp('compte_verrouille_jusqu_a')->nullable()->after('nb_tentatives_echec');
            $table->unsignedBigInteger('created_by')->nullable()->after('compte_verrouille_jusqu_a');

            $table->foreign('created_by')
                ->references('id_user')
                ->on('users')
                ->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['created_by']);
            $table->dropForeign(['id_enseignant']);
            $table->dropUnique('users_id_enseignant_unique');
            $table->dropColumn(['mot_de_passe_change_requis', 'nb_tentatives_echec', 'compte_verrouille_jusqu_a', 'created_by']);

            $table->foreign('id_enseignant')
                ->references('id_enseignant')
                ->on('enseignants')
                ->onDelete('cascade');
        });
    }
};
