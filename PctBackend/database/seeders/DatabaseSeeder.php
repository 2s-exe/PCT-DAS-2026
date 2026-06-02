<?php
namespace Database\Seeders;
use Illuminate\Database\Seeder;
class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            ProfilSeeder::class,
            DepartementSeeder::class,
            AnneeAcademiqueSeeder::class,
            UserSeeder::class,
            ParametreCalculSeeder::class,
        ]);
    }
}
