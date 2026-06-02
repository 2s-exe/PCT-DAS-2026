<?php
namespace Database\Seeders;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
class ProfilSeeder extends Seeder
{
    public function run(): void
    {
        $profils = [
            ['libelle_profil' => 'admin', 'description' => 'Administrateur'],
            ['libelle_profil' => 'secretaire', 'description' => 'Secretaire'],
            ['libelle_profil' => 'enseignant', 'description' => 'Enseignant'],
        ];

        foreach ($profils as $profil) {
            DB::table('profils')->updateOrInsert(
                ['libelle_profil' => $profil['libelle_profil']],
                [
                    'description' => $profil['description'],
                    'updated_at' => now(),
                    'created_at' => now(),
                ]
            );
        }
    }
}
