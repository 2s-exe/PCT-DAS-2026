<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class AnneeAcademiqueSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('annees_academiques')->updateOrInsert(
            ['libelle_annee' => '2025-2026'],
            ['date_debut' => '2025-09-01', 'date_fin' => '2026-08-31', 'active' => true]
        );
    }
}
