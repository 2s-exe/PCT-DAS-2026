<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ProfilSeeder extends Seeder
{
    public function run(): void
    {
        $profils = [
            [
                'libelle_profil' => 'super_admin',
                'description'    => 'Super Administrateur — contrôle total du SI : comptes, rôles, permissions, supervision',
            ],
            [
                'libelle_profil' => 'admin_pedagogique',
                'description'    => 'Administrateur Pédagogique — gestion académique : enseignants, attributions, validations, rapports',
            ],
            [
                'libelle_profil' => 'secretaire',
                'description'    => 'Secrétaire — saisie administrative, consultations, génération de documents',
            ],
            [
                'libelle_profil' => 'enseignant',
                'description'    => 'Enseignant — espace personnel, déclaration des activités, consultation des volumes horaires',
            ],
        ];

        foreach ($profils as $profil) {
            DB::table('profils')->updateOrInsert(
                ['libelle_profil' => $profil['libelle_profil']],
                [
                    'description' => $profil['description'],
                    'created_at'  => now(),
                    'updated_at'  => now(),
                ]
            );
        }

        // Supprimer l'ancien profil 'admin' s'il existe (remplacé par super_admin)
        // On supprime uniquement s'il n'y a pas de users liés, sinon on migre d'abord
        $oldAdminId = DB::table('profils')->where('libelle_profil', 'admin')->value('id_profil');
        if ($oldAdminId) {
            $superAdminId = DB::table('profils')->where('libelle_profil', 'super_admin')->value('id_profil');
            if ($superAdminId) {
                DB::table('users')->where('id_profil', $oldAdminId)->update(['id_profil' => $superAdminId]);
                DB::table('profils')->where('id_profil', $oldAdminId)->delete();
            }
        }
    }
}
