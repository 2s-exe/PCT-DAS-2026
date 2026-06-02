<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Http\Requests\StoreEnseignantRequest;
use App\Http\Requests\UpdateEnseignantRequest;
use App\Http\Resources\EnseignantResource;
use App\Models\Enseignant;
use App\Models\Profil;
use App\Models\User;
use App\Notifications\EnseignantCredentialsNotification;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;

/**
 * @OA\Tag(name="Enseignants", description="Gestion des enseignants")
 */
class EnseignantController extends Controller
{
    /**
     * @OA\Get(
     *     path="/api/v1/enseignants",
     *     tags={"Enseignants"},
     *     summary="Liste des enseignants",
     *     security={{"sanctum":{}}},
     *     @OA\Parameter(name="departement", in="query", description="Filtrer par département", @OA\Schema(type="integer")),
     *     @OA\Parameter(name="statut", in="query", description="Permanent ou Vacataire", @OA\Schema(type="string")),
     *     @OA\Parameter(name="search", in="query", description="Recherche par nom/prénom", @OA\Schema(type="string")),
     *     @OA\Response(response=200, description="Liste paginée des enseignants")
     * )
     */
    public function index(Request $request)
    {
        $enseignants = Enseignant::with('departement')
            ->when($request->departement, fn($q) => $q->where('id_departement', $request->departement))
            ->when($request->statut,      fn($q) => $q->where('statut', $request->statut))
            ->when($request->search,      fn($q) => $q->where(function($q) use ($request) {
                $q->where('nom', 'like', "%{$request->search}%")
                  ->orWhere('prenom', 'like', "%{$request->search}%")
                  ->orWhere('email', 'like', "%{$request->search}%");
            }))
            ->where('actif', true)
            ->paginate(15);

        return EnseignantResource::collection($enseignants);
    }

    /**
     * @OA\Post(
     *     path="/api/v1/enseignants",
     *     tags={"Enseignants"},
     *     summary="Créer un enseignant + son compte utilisateur",
     *     security={{"sanctum":{}}},
     *     @OA\RequestBody(required=true,
     *         @OA\JsonContent(
     *             required={"nom","prenom","email","grade","statut","id_departement","taux_horaire"},
     *             @OA\Property(property="nom", type="string", example="Kouassi"),
     *             @OA\Property(property="prenom", type="string", example="Jean"),
     *             @OA\Property(property="email", type="string", example="j.kouassi@uvci.edu.ci"),
     *             @OA\Property(property="login", type="string", example="j.kouassi@uvci.edu.ci"),
     *             @OA\Property(property="password", type="string", example="Password@123"),
     *             @OA\Property(property="telephone", type="string", example="+225 07 00 00 00"),
     *             @OA\Property(property="grade", type="string", enum={"Assistant","Maitre-Assistant","Professeur"}),
     *             @OA\Property(property="statut", type="string", enum={"Permanent","Vacataire"}),
     *             @OA\Property(property="taux_horaire", type="number", example=5000),
     *             @OA\Property(property="id_departement", type="integer", example=1)
     *         )
     *     ),
     *     @OA\Response(response=201, description="Enseignant créé avec succès"),
     *     @OA\Response(response=422, description="Données invalides")
     * )
     */
    public function store(StoreEnseignantRequest $request)
    {
        $validated = $request->validated();
        $accountData = [
            'login' => $validated['login'] ?? $validated['email'],
            'password' => $validated['password'] ?? null,
        ];

        unset($validated['login'], $validated['password']);

        $enseignant = DB::transaction(function () use ($validated, $accountData) {
            $enseignant = Enseignant::create($validated);
            $profilEnseignant = Profil::where('libelle_profil', 'enseignant')->firstOrFail();
            $password = $accountData['password'] ?? 'Pct@' . $enseignant->id_enseignant;

            User::create([
                'login' => $accountData['login'],
                'mot_de_passe_hash' => Hash::make($password),
                'id_enseignant' => $enseignant->id_enseignant,
                'id_profil' => $profilEnseignant->id_profil,
                'actif' => true,
            ]);

            Notification::route('mail', $enseignant->email)
                ->notify(new EnseignantCredentialsNotification($accountData['login'], $password));

            return $enseignant;
        });

        return new EnseignantResource($enseignant->load('departement', 'utilisateur'));
    }

    /**
     * @OA\Get(
     *     path="/api/v1/enseignants/{enseignant}",
     *     tags={"Enseignants"},
     *     summary="Détail d'un enseignant",
     *     security={{"sanctum":{}}},
     *     @OA\Parameter(name="enseignant", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\Response(response=200, description="Détail enseignant"),
     *     @OA\Response(response=404, description="Non trouvé")
     * )
     */
    public function show(Enseignant $enseignant)
    {
        return new EnseignantResource(
            $enseignant->load('departement', 'attributions.cours', 'volumesHoraires')
        );
    }

    /**
     * @OA\Put(
     *     path="/api/v1/enseignants/{enseignant}",
     *     tags={"Enseignants"},
     *     summary="Modifier un enseignant",
     *     security={{"sanctum":{}}},
     *     @OA\Parameter(name="enseignant", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\RequestBody(required=true,
     *         @OA\JsonContent(
     *             @OA\Property(property="nom", type="string", example="Kouassi"),
     *             @OA\Property(property="prenom", type="string", example="Jean"),
     *             @OA\Property(property="email", type="string", example="j.kouassi@uvci.edu.ci"),
     *             @OA\Property(property="login", type="string", example="j.kouassi@uvci.edu.ci"),
     *             @OA\Property(property="password", type="string", example="NewPassword@123"),
     *             @OA\Property(property="telephone", type="string", example="+225 07 00 00 00"),
     *             @OA\Property(property="grade", type="string", enum={"Assistant","Maitre-Assistant","Professeur"}),
     *             @OA\Property(property="statut", type="string", enum={"Permanent","Vacataire"}),
     *             @OA\Property(property="taux_horaire", type="number", example=5000),
     *             @OA\Property(property="id_departement", type="integer", example=1)
     *         )
     *     ),
     *     @OA\Response(response=200, description="Enseignant modifié"),
     *     @OA\Response(response=404, description="Non trouvé")
     * )
     */
    public function update(UpdateEnseignantRequest $request, Enseignant $enseignant)
    {
        $validated = $request->validated();
        $accountData = [
            'login' => $validated['login'] ?? null,
            'password' => $validated['password'] ?? null,
        ];

        unset($validated['login'], $validated['password']);

        DB::transaction(function () use ($enseignant, $validated, $accountData) {
            $enseignant->update($validated);

            $userUpdates = [];
            if (!empty($accountData['login'])) {
                $userUpdates['login'] = $accountData['login'];
            }
            if (!empty($accountData['password'])) {
                $userUpdates['mot_de_passe_hash'] = Hash::make($accountData['password']);
            }

            if ($userUpdates !== []) {
                if ($enseignant->utilisateur) {
                    $enseignant->utilisateur->update($userUpdates);
                    return;
                }

                $profilEnseignant = Profil::where('libelle_profil', 'enseignant')->firstOrFail();
                $enseignant->utilisateur()->create($userUpdates + [
                    'login' => $accountData['login'] ?: $enseignant->email,
                    'mot_de_passe_hash' => Hash::make($accountData['password'] ?: 'Pct@' . $enseignant->id_enseignant),
                    'id_profil' => $profilEnseignant->id_profil,
                    'actif' => true,
                ]);
            }
        });

        return new EnseignantResource($enseignant->load('departement', 'utilisateur'));
    }

    /**
     * @OA\Delete(
     *     path="/api/v1/enseignants/{enseignant}",
     *     tags={"Enseignants"},
     *     summary="Désactiver un enseignant (soft delete)",
     *     security={{"sanctum":{}}},
     *     @OA\Parameter(name="enseignant", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\Response(response=200, description="Enseignant désactivé"),
     *     @OA\Response(response=404, description="Non trouvé")
     * )
     */
    public function destroy(Enseignant $enseignant)
    {
        // Soft delete : on désactive plutôt que de supprimer
        $enseignant->update(['actif' => false]);
        $enseignant->utilisateur?->update(['actif' => false]);
        return response()->json(['message' => 'Enseignant désactivé avec succès.']);
    }
}
