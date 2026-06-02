<?php

use Illuminate\Http\Request;
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
| API Routes - PCT Backend v1
|--------------------------------------------------------------------------
*/

// Auth (public)
Route::prefix('v1')->group(function () {

    Route::post('/login',    [AuthController::class, 'login']);
    Route::post('/register', [AuthController::class, 'register']);

    // Routes protégées
    Route::middleware('auth:sanctum')->group(function () {

        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me',      [AuthController::class, 'me']);

        // Dashboard
        Route::get('/dashboard',   [DashboardController::class, 'global']);
        Route::get('/mon-espace',  [DashboardController::class, 'monEspace']);

        // Profils (lecture seule)
        Route::get('/profils', fn() => \App\Models\Profil::select('id_profil','libelle_profil')->get());

        // Users
        Route::apiResource('users', UserController::class);
        Route::post('/users/{user}/reinitialiser-mdp', [UserController::class, 'reinitialiserMotDePasse']);

        // Enseignants
        Route::apiResource('enseignants', EnseignantController::class);

        // Départements
        Route::apiResource('departements', DepartementController::class);

        // Cours
        Route::apiResource('cours', CoursController::class);

        // Attributions
        Route::apiResource('attributions', AttributionController::class);

        // Séquences pédagogiques
        Route::apiResource('sequences', SequencePedagogiqueController::class);

        // Ressources pédagogiques
        Route::apiResource('ressources', RessourcePedagogiqueController::class);

        // Activités — simuler AVANT apiResource pour éviter le conflit de route {activite}
        Route::get('/activites/simuler', [ActiviteController::class, 'simuler']);
        Route::post('/activites/{activite}/valider', [ActiviteController::class, 'valider']);
        Route::apiResource('activites', ActiviteController::class);

        // Années académiques
        Route::apiResource('annees', AnneeAcademiqueController::class);

        // Paramètres de calcul
        Route::apiResource('parametres', ParametreCalculController::class);

        // Volume horaire
        Route::get('/volume-horaire',              [VolumeHoraireController::class, 'index']);
        Route::get('/volume-horaire/{enseignant}', [VolumeHoraireController::class, 'show']);
        Route::post('/volume-horaire/{volume}/valider', [VolumeHoraireController::class, 'valider']);

        // Rapports
        Route::get('/rapports/global',                    [RapportController::class, 'global']);
        Route::get('/rapports/enseignant/{enseignant}',   [RapportController::class, 'ficheEnseignant']);

    });
});
