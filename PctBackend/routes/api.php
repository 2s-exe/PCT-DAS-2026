<?php

use Illuminate\Support\Facades\Route;

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\UserController;
use App\Http\Controllers\Api\V1\EnseignantController;
use App\Http\Controllers\Api\V1\DepartementController;
use App\Http\Controllers\Api\V1\CoursController;
use App\Http\Controllers\Api\V1\AttributionController;
use App\Http\Controllers\Api\V1\ActiviteController;
use App\Http\Controllers\Api\V1\AnneeAcademiqueController;
use App\Http\Controllers\Api\V1\ParametreCalculController;
use App\Http\Controllers\Api\V1\RapportController;
use App\Http\Controllers\Api\V1\RessourcePedagogiqueController;
use App\Http\Controllers\Api\V1\SequencePedagogiqueController;
use App\Http\Controllers\Api\V1\VolumeHoraireController;
use App\Http\Controllers\Api\V1\DashboardController;

/*
|--------------------------------------------------------------------------
| API Routes — PCT Backend v1
| Principe : séparation lecture (tous authentifiés) / écriture (par rôle)
|--------------------------------------------------------------------------
*/

Route::prefix('v1')->group(function () {

    // ── Auth publique (throttle 5/min → anti brute-force) ────────────────
    Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:5,1');

    // ── Routes protégées (token Sanctum obligatoire) ──────────────────────
    Route::middleware('auth:sanctum')->group(function () {

        // Auth — accessible à TOUS les utilisateurs connectés
        Route::post('/logout',                      [AuthController::class, 'logout']);
        Route::get('/me',                           [AuthController::class, 'me']);
        Route::post('/me/changer-mot-de-passe',     [AuthController::class, 'changerMotDePasse']);

        // ── LECTURE UNIVERSELLE ──────────────────────────────────────────
        // Toutes les données de référence sont lisibles par tout utilisateur
        // authentifié. Le filtrage des données sensibles se fait au niveau
        // des controllers (un enseignant ne voit que ses activités, etc.)
        Route::get('/profils',     fn() => \App\Models\Profil::select('id_profil','libelle_profil')->get());
        Route::get('/annees',      [AnneeAcademiqueController::class, 'index']);
        Route::get('/annees/{annee}', [AnneeAcademiqueController::class, 'show']);
        Route::get('/departements',   [DepartementController::class, 'index']);
        Route::get('/cours',          [CoursController::class, 'index']);
        Route::get('/cours/{cours}',  [CoursController::class, 'show']);
        Route::get('/ressources',     [RessourcePedagogiqueController::class, 'index']);
        Route::get('/ressources/{ressource}', [RessourcePedagogiqueController::class, 'show']);
        Route::get('/attributions',   [AttributionController::class, 'index']);
        Route::get('/sequences',      [SequencePedagogiqueController::class, 'index']);
        Route::get('/activites/simuler', [ActiviteController::class, 'simuler']);
        Route::get('/activites',      [ActiviteController::class, 'index']);
        Route::get('/parametres',     [ParametreCalculController::class, 'index']);

        // Espace personnel enseignant
        Route::get('/mon-espace', [DashboardController::class, 'monEspace']);

        // ── SUPER_ADMIN EXCLUSIF : gestion des comptes + dashboard SI ───
        Route::middleware('role:super_admin')->group(function () {
            Route::get('/dashboard/securite', [DashboardController::class, 'securite']);
            Route::apiResource('users', UserController::class);
            Route::post('/users/{user}/reinitialiser-mdp', [UserController::class, 'reinitialiserMotDePasse']);
            Route::patch('/users/{user}/verrouiller',      [UserController::class, 'verrouiller']);
            Route::patch('/users/{user}/activer',          [UserController::class, 'activer']);
        });

        // ── SUPER_ADMIN + ADMIN_PEDAGOGIQUE + SECRETAIRE ─────────────────
        Route::middleware('role:super_admin|admin_pedagogique|secretaire')->group(function () {
            // Dashboard global
            Route::get('/dashboard', [DashboardController::class, 'global']);

            // Enseignants (CRUD complet)
            Route::post('/enseignants',           [EnseignantController::class, 'store']);
            Route::put('/enseignants/{enseignant}', [EnseignantController::class, 'update']);
            Route::delete('/enseignants/{enseignant}', [EnseignantController::class, 'destroy']);
            Route::get('/enseignants',             [EnseignantController::class, 'index']);
            Route::get('/enseignants/{enseignant}', [EnseignantController::class, 'show']);

            // Attributions
            Route::post('/attributions',          [AttributionController::class, 'store']);
            Route::delete('/attributions/{attribution}', [AttributionController::class, 'destroy']);

            // Activités pédagogiques
            Route::post('/activites',             [ActiviteController::class, 'store']);
            Route::put('/activites/{activite}',   [ActiviteController::class, 'update']);
            Route::delete('/activites/{activite}',[ActiviteController::class, 'destroy']);
            Route::post('/activites/{activite}/valider', [ActiviteController::class, 'valider']);

            // Séquences
            Route::post('/sequences',             [SequencePedagogiqueController::class, 'store']);
            Route::put('/sequences/{sequence}',   [SequencePedagogiqueController::class, 'update']);
            Route::delete('/sequences/{sequence}',[SequencePedagogiqueController::class, 'destroy']);

            // Ressources
            Route::post('/ressources',            [RessourcePedagogiqueController::class, 'store']);
            Route::put('/ressources/{ressource}', [RessourcePedagogiqueController::class, 'update']);
            Route::delete('/ressources/{ressource}', [RessourcePedagogiqueController::class, 'destroy']);

            // Volume horaire
            Route::get('/volume-horaire',         [VolumeHoraireController::class, 'index']);
            Route::get('/volume-horaire/{enseignant}', [VolumeHoraireController::class, 'show']);
            Route::post('/volume-horaire/{volume}/valider', [VolumeHoraireController::class, 'valider']);

            // Rapports
            Route::get('/rapports/global',        [RapportController::class, 'global']);
            Route::get('/rapports/enseignant/{enseignant}', [RapportController::class, 'ficheEnseignant']);
        });

        // ── SUPER_ADMIN + ADMIN_PEDAGOGIQUE : administration pédagogique ─
        Route::middleware('role:super_admin|admin_pedagogique')->group(function () {
            // Cours (écriture)
            Route::post('/cours',          [CoursController::class, 'store']);
            Route::put('/cours/{cours}',   [CoursController::class, 'update']);
            Route::delete('/cours/{cours}',[CoursController::class, 'destroy']);

            // Années académiques (écriture)
            Route::post('/annees',              [AnneeAcademiqueController::class, 'store']);
            Route::put('/annees/{annee}',       [AnneeAcademiqueController::class, 'update']);
            Route::delete('/annees/{annee}',    [AnneeAcademiqueController::class, 'destroy']);

            // Paramètres de calcul (écriture)
            Route::post('/parametres',              [ParametreCalculController::class, 'store']);
            Route::put('/parametres/{parametre}',   [ParametreCalculController::class, 'update']);
            Route::delete('/parametres/{parametre}',[ParametreCalculController::class, 'destroy']);

            // Départements (écriture)
            Route::post('/departements',              [DepartementController::class, 'store']);
            Route::put('/departements/{departement}', [DepartementController::class, 'update']);
            Route::delete('/departements/{departement}', [DepartementController::class, 'destroy']);
        });

        // ── ENSEIGNANT : déclaration d'activités propres ─────────────────
        Route::middleware('role:enseignant')->group(function () {
            Route::post('/activites',          [ActiviteController::class, 'store']);
            Route::put('/activites/{activite}',[ActiviteController::class, 'update']);
            Route::delete('/activites/{activite}', [ActiviteController::class, 'destroy']);
            Route::get('/volume-horaire/{enseignant}', [VolumeHoraireController::class, 'show']);
            Route::get('/rapports/enseignant/{enseignant}', [RapportController::class, 'ficheEnseignant']);
        });

    });
});
