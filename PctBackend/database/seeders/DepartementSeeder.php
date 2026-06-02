<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DepartementSeeder extends Seeder
{
    public function run(): void
    {
        $departements = [
            [
                'nom_departement' => 'Informatique',
                'responsable' => 'Dr. Koffi',
            ],
            [
                'nom_departement' => 'Mathematiques',
                'responsable' => 'Dr. Traore',
            ],
            [
                'nom_departement' => 'Sciences et Technologies',
                'responsable' => 'Dr. Kouame',
            ],
            [
                'nom_departement' => 'Lettres et Sciences Humaines',
                'responsable' => 'Dr. Diarra',
            ],
        ];

        foreach ($departements as $departement) {
            DB::table('departements')->updateOrInsert(
                ['nom_departement' => $departement['nom_departement']],
                [
                    'responsable' => $departement['responsable'],
                    'updated_at' => now(),
                    'created_at' => now(),
                ]
            );
        }
    }
}
