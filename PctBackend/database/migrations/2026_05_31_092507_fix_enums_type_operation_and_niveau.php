<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Corrige les enums incohérents avec le code :
 *  - type_operation : 'creation' → 'conception' dans param_calculs et activites_pedagogiques
 *  - niveau_complexite : enum string → tinyint dans activites_pedagogiques
 */
return new class extends Migration
{
    public function up(): void
    {
        // param_calculs.type_operation : 'creation' → 'conception'
        DB::statement("ALTER TABLE `param_calculs`
            MODIFY `type_operation` ENUM('conception','mise_a_jour') NOT NULL");

        // activites_pedagogiques.type_operation : 'creation' → 'conception'
        // activites_pedagogiques.niveau_complexite : string enum → tinyint
        DB::statement("ALTER TABLE `activites_pedagogiques`
            MODIFY `type_operation`    ENUM('conception','mise_a_jour') NOT NULL,
            MODIFY `niveau_complexite` TINYINT UNSIGNED                 NOT NULL DEFAULT 1");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE `param_calculs`
            MODIFY `type_operation` ENUM('creation','mise_a_jour') NOT NULL");

        DB::statement("ALTER TABLE `activites_pedagogiques`
            MODIFY `type_operation`    ENUM('creation','mise_a_jour') NOT NULL,
            MODIFY `niveau_complexite` ENUM('simple','intermediaire','complexe') NOT NULL");
    }
};
