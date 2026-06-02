<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use App\Models\User;

class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        // Vider le cache Spatie avant de réensemencer
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // ── Définition des permissions atomiques ─────────────────────────
        $permissions = [
            // Gestion des comptes (SUPER_ADMIN only)
            'users.lister', 'users.voir', 'users.creer', 'users.modifier',
            'users.desactiver', 'users.activer', 'users.verrouiller', 'users.reinitialiser_mdp',

            // Gestion pédagogique (ADMIN_PEDAGOGIQUE + SECRETAIRE)
            'enseignants.lister', 'enseignants.voir', 'enseignants.creer',
            'enseignants.modifier', 'enseignants.supprimer',

            'cours.lister', 'cours.voir', 'cours.creer', 'cours.modifier', 'cours.supprimer',

            'attributions.lister', 'attributions.voir', 'attributions.creer',
            'attributions.supprimer',

            'activites.lister', 'activites.voir', 'activites.creer',
            'activites.modifier', 'activites.supprimer', 'activites.valider',

            'volumes.lister', 'volumes.voir', 'volumes.valider',

            'sequences.lister', 'sequences.voir', 'sequences.creer',
            'sequences.modifier', 'sequences.supprimer',

            'ressources.lister', 'ressources.voir', 'ressources.creer',
            'ressources.modifier', 'ressources.supprimer',

            // Administration
            'departements.lister', 'departements.voir', 'departements.creer',
            'departements.modifier', 'departements.supprimer',

            'annees.lister', 'annees.voir', 'annees.creer',
            'annees.modifier', 'annees.supprimer',

            'parametres.lister', 'parametres.voir', 'parametres.creer',
            'parametres.modifier', 'parametres.supprimer',

            // Rapports
            'rapports.global', 'rapports.enseignant',

            // Dashboard
            'dashboard.global', 'dashboard.espace_personnel',

            // Journal d'audit
            'journal.lister', 'journal.voir', 'journal.exporter',
        ];

        foreach ($permissions as $perm) {
            Permission::firstOrCreate(['name' => $perm, 'guard_name' => 'web']);
        }

        // ── Création des rôles et affectation des permissions ─────────────

        // SUPER_ADMIN : toutes les permissions
        $superAdmin = Role::firstOrCreate(['name' => 'super_admin', 'guard_name' => 'web']);
        $superAdmin->syncPermissions(Permission::all());

        // ADMIN_PEDAGOGIQUE : tout sauf gestion des comptes et journal complet
        $adminPedago = Role::firstOrCreate(['name' => 'admin_pedagogique', 'guard_name' => 'web']);
        $adminPedago->syncPermissions([
            'enseignants.lister', 'enseignants.voir', 'enseignants.creer',
            'enseignants.modifier', 'enseignants.supprimer',
            'cours.lister', 'cours.voir', 'cours.creer', 'cours.modifier', 'cours.supprimer',
            'attributions.lister', 'attributions.voir', 'attributions.creer', 'attributions.supprimer',
            'activites.lister', 'activites.voir', 'activites.creer',
            'activites.modifier', 'activites.supprimer', 'activites.valider',
            'volumes.lister', 'volumes.voir', 'volumes.valider',
            'sequences.lister', 'sequences.voir', 'sequences.creer',
            'sequences.modifier', 'sequences.supprimer',
            'ressources.lister', 'ressources.voir', 'ressources.creer',
            'ressources.modifier', 'ressources.supprimer',
            'departements.lister', 'departements.voir', 'departements.creer',
            'departements.modifier', 'departements.supprimer',
            'annees.lister', 'annees.voir', 'annees.creer', 'annees.modifier', 'annees.supprimer',
            'parametres.lister', 'parametres.voir', 'parametres.creer',
            'parametres.modifier', 'parametres.supprimer',
            'rapports.global', 'rapports.enseignant',
            'dashboard.global',
        ]);

        // SECRETAIRE : saisie + consultation, pas de suppression ni de validation
        $secretaire = Role::firstOrCreate(['name' => 'secretaire', 'guard_name' => 'web']);
        $secretaire->syncPermissions([
            'enseignants.lister', 'enseignants.voir',
            'cours.lister', 'cours.voir',
            'attributions.lister', 'attributions.voir', 'attributions.creer',
            'activites.lister', 'activites.voir', 'activites.creer',
            'activites.modifier', 'activites.valider',
            'volumes.lister', 'volumes.voir',
            'sequences.lister', 'sequences.voir',
            'ressources.lister', 'ressources.voir',
            'departements.lister', 'departements.voir',
            'annees.lister', 'annees.voir',
            'rapports.global', 'rapports.enseignant',
            'dashboard.global',
        ]);

        // ENSEIGNANT : lecture seule sur ses propres données + déclaration activités
        $enseignant = Role::firstOrCreate(['name' => 'enseignant', 'guard_name' => 'web']);
        $enseignant->syncPermissions([
            'activites.lister', 'activites.voir', 'activites.creer',
            'activites.modifier', 'activites.supprimer',
            'attributions.lister', 'attributions.voir',
            'ressources.lister', 'ressources.voir',
            'annees.lister', 'annees.voir',
            'volumes.voir',
            'rapports.enseignant',
            'dashboard.espace_personnel',
        ]);

        // ── Assigner les rôles Spatie aux users existants ─────────────────
        $usersAMigrer = User::with('profil')->get();
        foreach ($usersAMigrer as $user) {
            if ($user->profil) {
                $user->syncRoles([$user->profil->libelle_profil]);
            }
        }
    }
}
