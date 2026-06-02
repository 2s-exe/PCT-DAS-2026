<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Aligne le schéma réel de la DB avec ce qu'attend le code :
 *  - param_calculs : renomme niveau_complexite→niveau, coefficient_vhn→heures_par_seance,
 *                    ajoute libelle_niveau et id_annee
 *  - activites_pedagogiques : ajoute id_ressource, nb_seances, statut
 */
return new class extends Migration
{
    public function up(): void
    {
        // ── param_calculs — MariaDB 10.4 ne supporte pas RENAME COLUMN,
        //   on utilise CHANGE COLUMN via SQL brut ──────────────────────────────
        DB::statement('ALTER TABLE `param_calculs`
            CHANGE `niveau_complexite` `niveau`           TINYINT UNSIGNED NOT NULL,
            CHANGE `coefficient_vhn`   `heures_par_seance` DECIMAL(5,2)    NOT NULL'
        );
        Schema::table('param_calculs', function (Blueprint $table) {
            $table->string('libelle_niveau', 150)->default('')->after('niveau');
            $table->unsignedBigInteger('id_annee')->nullable()->after('libelle_niveau');
            $table->foreign('id_annee')
                  ->references('id_annee')
                  ->on('annees_academiques')
                  ->onDelete('cascade');
        });

        // ── activites_pedagogiques ────────────────────────────────────────────
        Schema::table('activites_pedagogiques', function (Blueprint $table) {
            $table->unsignedBigInteger('id_ressource')->nullable()->after('id_activite');
            $table->foreign('id_ressource')
                  ->references('id_ressource')
                  ->on('ressources_pedagogiques')
                  ->onDelete('set null');
            $table->unsignedTinyInteger('nb_seances')->default(2)->after('id_ressource');
            $table->enum('statut', ['brouillon', 'soumis', 'valide', 'rejete'])
                  ->default('brouillon')
                  ->after('volume_horaire');
        });
    }

    public function down(): void
    {
        Schema::table('activites_pedagogiques', function (Blueprint $table) {
            $table->dropForeign(['id_ressource']);
            $table->dropColumn(['id_ressource', 'nb_seances', 'statut']);
        });

        Schema::table('param_calculs', function (Blueprint $table) {
            $table->dropForeign(['id_annee']);
            $table->dropColumn(['id_annee', 'libelle_niveau']);
        });
        DB::statement('ALTER TABLE `param_calculs`
            CHANGE `niveau`           `niveau_complexite` TINYINT UNSIGNED NOT NULL,
            CHANGE `heures_par_seance` `coefficient_vhn`  DECIMAL(5,2)     NOT NULL'
        );
    }
};
