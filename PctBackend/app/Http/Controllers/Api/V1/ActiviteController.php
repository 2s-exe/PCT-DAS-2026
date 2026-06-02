<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\ActivitePedagogique;
use App\Models\ParametreCalcul;
use App\Models\RessourcePedagogique;
use App\Services\VolumeHoraireService;

/**
 * @OA\Tag(name="Activités", description="Activités pédagogiques des enseignants")
 */
class ActiviteController extends Controller
{
    public function __construct(private VolumeHoraireService $volumeService) {}

    /**
     * @OA\Get(path="/api/v1/activites", tags={"Activités"}, summary="Liste des activités",
     *     security={{"sanctum":{}}},
     *     @OA\Parameter(name="id_enseignant", in="query", @OA\Schema(type="integer")),
     *     @OA\Parameter(name="id_annee", in="query", @OA\Schema(type="integer")),
     *     @OA\Response(response=200, description="Liste des activités")
     * )
     */
    public function index(Request $request)
    {
        return ActivitePedagogique::with('attribution.enseignant', 'attribution.cours', 'annee')
            ->when($request->id_annee, fn($q) => $q->where('id_annee', $request->id_annee))
            ->when($request->id_enseignant, fn($q) =>
                $q->whereHas('attribution', fn($q) => $q->where('id_enseignant', $request->id_enseignant))
            )
            ->latest('date_activite')
            ->paginate(15);
    }

    /**
     * @OA\Post(path="/api/v1/activites", tags={"Activités"},
     *     summary="Enregistrer une activité pédagogique",
     *     security={{"sanctum":{}}},
     *     @OA\RequestBody(required=true,
     *         @OA\JsonContent(
     *             required={"id_ressource","nb_seances","date_activite","id_attribution","id_annee"},
     *             @OA\Property(property="id_ressource", type="integer"),
     *             @OA\Property(property="nb_seances", type="integer", enum={1,2,4,6}),
     *             @OA\Property(property="date_activite", type="string", format="date"),
     *             @OA\Property(property="id_attribution", type="integer"),
     *             @OA\Property(property="id_annee", type="integer"),
     *             @OA\Property(property="observations", type="string")
     *         )
     *     ),
     *     @OA\Response(response=201, description="Activité enregistrée avec volume horaire calculé")
     * )
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'id_ressource'     => 'required|exists:ressources_pedagogiques,id_ressource',
            'nb_seances'       => 'required|integer|in:1,2,4,6',
            'date_activite'    => 'required|date',
            'id_attribution'   => 'required|exists:attributions,id_attribution',
            'id_annee'         => 'required|exists:annees_academiques,id_annee',
            'observations'     => 'nullable|string',
        ]);

        $ressource = RessourcePedagogique::findOrFail($validated['id_ressource']);
        $parametre = ParametreCalcul::where('type_operation', $ressource->type_operation)
            ->where('niveau', $ressource->niveau_complexite)
            ->where('id_annee', $validated['id_annee'])
            ->firstOrFail();

        $validated['volume_horaire'] = $parametre->heures_par_seance * $validated['nb_seances'];
        $validated['statut'] = 'brouillon';

        $activite = ActivitePedagogique::create($validated);

        $this->volumeService->recalculer(
            $activite->attribution->id_enseignant,
            $validated['id_annee']
        );

        return response()->json($activite->load('attribution.cours', 'ressource'), 201);
    }

    public function update(Request $request, ActivitePedagogique $activite)
    {
        $validated = $request->validate([
            'id_ressource'     => 'sometimes|exists:ressources_pedagogiques,id_ressource',
            'nb_seances'       => 'sometimes|integer|in:1,2,4,6',
            'date_activite'    => 'sometimes|date',
            'observations'     => 'nullable|string',
            'statut'           => 'sometimes|in:brouillon,soumis,valide,rejete',
        ]);

        if (isset($validated['id_ressource']) || isset($validated['nb_seances'])) {
            $ressource = isset($validated['id_ressource'])
                ? RessourcePedagogique::findOrFail($validated['id_ressource'])
                : $activite->ressource;

            $nbSeances = $validated['nb_seances'] ?? $activite->nb_seances;
            $parametre = ParametreCalcul::where('type_operation', $ressource->type_operation)
                ->where('niveau', $ressource->niveau_complexite)
                ->where('id_annee', $activite->id_annee)
                ->first();

            if ($parametre) {
                $validated['volume_horaire'] = $parametre->heures_par_seance * $nbSeances;
            }
        }

        $activite->update($validated);
        $this->volumeService->recalculer($activite->attribution->id_enseignant, $activite->id_annee);

        return response()->json($activite->load('attribution.cours', 'ressource'));
    }

    public function destroy(ActivitePedagogique $activite)
    {
        $idEnseignant = $activite->attribution->id_enseignant;
        $idAnnee      = $activite->id_annee;
        $activite->delete();
        $this->volumeService->recalculer($idEnseignant, $idAnnee);

        return response()->json(['message' => 'Activité supprimée.']);
    }

    public function valider(Request $request, ActivitePedagogique $activite)
    {
        $validated = $request->validate([
            'decision'    => 'required|in:valide,rejete',
            'commentaire' => 'nullable|string',
        ]);

        if ($activite->statut !== 'soumis') {
            return response()->json(['message' => 'Seules les activités soumises peuvent être validées.'], 422);
        }

        $activite->update([
            'statut'       => $validated['decision'],
            'observations' => $validated['commentaire'] ?? $activite->observations,
        ]);

        if ($validated['decision'] === 'valide') {
            $this->volumeService->recalculer(
                $activite->attribution->id_enseignant,
                $activite->id_annee
            );
        }

        return response()->json($activite->load('attribution.cours', 'ressource'));
    }

    public function simuler(Request $request)
    {
        $validated = $request->validate([
            'id_ressource'  => 'required|exists:ressources_pedagogiques,id_ressource',
            'nb_seances'    => 'required|integer|in:1,2,4,6',
            'id_annee'      => 'required|exists:annees_academiques,id_annee',
        ]);

        $ressource = RessourcePedagogique::findOrFail($validated['id_ressource']);
        $parametre = ParametreCalcul::where('type_operation', $ressource->type_operation)
            ->where('niveau', $ressource->niveau_complexite)
            ->where('id_annee', $validated['id_annee'])
            ->firstOrFail();

        return response()->json([
            'id_ressource'      => $ressource->id_ressource,
            'nb_seances'        => $validated['nb_seances'],
            'heures_par_seance' => $parametre->heures_par_seance,
            'volume_horaire'    => $parametre->heures_par_seance * $validated['nb_seances'],
        ]);
    }
}