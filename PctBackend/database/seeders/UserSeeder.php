<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $profils = DB::table('profils')->pluck('id_profil', 'libelle_profil');

        $comptes = [
            [
                'login'      => 'superadmin@uvci.edu.ci',
                'id_profil'  => $profils['super_admin'] ?? null,
                'password'   => 'Secret@2026',
                'id_enseignant' => null,
            ],
            [
                'login'      => 'admin.pedago@uvci.edu.ci',
                'id_profil'  => $profils['admin_pedagogique'] ?? null,
                'password'   => 'Secret@2026',
                'id_enseignant' => null,
            ],
            [
                'login'      => 'secretaire@uvci.edu.ci',
                'id_profil'  => $profils['secretaire'] ?? null,
                'password'   => 'Secret@2026',
                'id_enseignant' => null,
            ],
        ];

        foreach ($comptes as $compte) {
            if (!$compte['id_profil']) continue;

            DB::table('users')->updateOrInsert(
                ['login' => $compte['login']],
                [
                    'mot_de_passe_hash'          => Hash::make($compte['password']),
                    'id_profil'                   => $compte['id_profil'],
                    'id_enseignant'               => $compte['id_enseignant'],
                    'actif'                        => true,
                    'mot_de_passe_change_requis'   => false,
                    'nb_tentatives_echec'          => 0,
                    'created_at'                   => now(),
                    'updated_at'                   => now(),
                ]
            );
        }

        // Migrer l'ancien compte admin@uvci.edu.ci → superadmin (seulement si pas déjà migré)
        $superAdminProfilId  = $profils['super_admin'] ?? null;
        $superAdminExiste    = DB::table('users')->where('login', 'superadmin@uvci.edu.ci')->exists();
        $ancienAdminExiste   = DB::table('users')->where('login', 'admin@uvci.edu.ci')->exists();

        if ($superAdminProfilId && $ancienAdminExiste && !$superAdminExiste) {
            DB::table('users')
                ->where('login', 'admin@uvci.edu.ci')
                ->update([
                    'login'     => 'superadmin@uvci.edu.ci',
                    'id_profil' => $superAdminProfilId,
                ]);
        } elseif ($superAdminProfilId && $ancienAdminExiste && $superAdminExiste) {
            // Les deux existent : supprimer l'ancien
            DB::table('users')->where('login', 'admin@uvci.edu.ci')->delete();
        }
    }
}
