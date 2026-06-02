<?php
namespace Database\Seeders;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
class UserSeeder extends Seeder
{
    public function run(): void
    {
        $adminProfilId = DB::table('profils')
            ->where('libelle_profil', 'admin')
            ->value('id_profil');

        DB::table('users')
            ->where('login', 'admin@uvci.ci')
            ->update(['login' => 'admin@uvci.edu.ci']);

        DB::table('users')->updateOrInsert(
            ['login' => 'admin@uvci.edu.ci'],
            [
                'mot_de_passe_hash' => Hash::make('secret123'),
                'id_profil'         => $adminProfilId,
                'id_enseignant'     => null,
                'actif'             => true,
                'created_at'        => now(),
                'updated_at'        => now(),
            ]
        );
    }
}
