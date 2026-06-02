<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ParametreCalculSeeder extends Seeder
{
    public function run(): void
    {
        $anneeId = DB::table('annees_academiques')->where('libelle_annee', '2025-2026')->value('id_annee');

        if (! $anneeId) {
            return;
        }

        // Barème Annexe 1 officiel
        $params = [
            ['type_operation' => 'conception',  'niveau' => 1, 'libelle_niveau' => 'Simple',        'heures_par_seance' => 8.0],
            ['type_operation' => 'conception',  'niveau' => 2, 'libelle_niveau' => 'Interactif',    'heures_par_seance' => 15.0],
            ['type_operation' => 'conception',  'niveau' => 3, 'libelle_niveau' => 'Serious Games', 'heures_par_seance' => 30.0],
            ['type_operation' => 'mise_a_jour', 'niveau' => 1, 'libelle_niveau' => 'Simple',        'heures_par_seance' => 4.0],
            ['type_operation' => 'mise_a_jour', 'niveau' => 2, 'libelle_niveau' => 'Interactif',    'heures_par_seance' => 7.5],
            ['type_operation' => 'mise_a_jour', 'niveau' => 3, 'libelle_niveau' => 'Serious Games', 'heures_par_seance' => 15.0],
        ];

        foreach ($params as $param) {
            DB::table('param_calculs')->updateOrInsert(
                [
                    'type_operation' => $param['type_operation'],
                    'niveau'         => $param['niveau'],
                    'id_annee'       => $anneeId,
                ],
                [
                    'libelle_niveau'    => $param['libelle_niveau'],
                    'heures_par_seance' => $param['heures_par_seance'],
                    'created_at'        => now(),
                    'updated_at'        => now(),
                ]
            );
        }
    }
}
