<?php
namespace Database\Seeders;
use Illuminate\Database\Seeder;
class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            ProfilSeeder::class,           // 1. Profils (super_admin, admin_pedagogique, secretaire, enseignant)
            DepartementSeeder::class,      // 2. Départements UVCI
            AnneeAcademiqueSeeder::class,  // 3. Années académiques
            UserSeeder::class,             // 4. Comptes de démo
            ParametreCalculSeeder::class,  // 5. Barème Annexe 1
            RolePermissionSeeder::class,   // 6. Rôles Spatie + permissions atomiques
        ]);
    }
}
