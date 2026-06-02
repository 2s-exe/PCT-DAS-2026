<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Enseignant;
use App\Models\VolumeHoraire;
use App\Models\Validation;
use Illuminate\Http\Request;

/**
 * @OA\Tag(name="Volumes Horaires", description="Volumes horaires et validation")
 */
class VolumeHoraireController extends Controller
{
    /**
     * @OA\Get(path="/api/v1/volume-horaire", tags={"Volumes Horaires"},
     *     summary="Liste des volumes horaires",
     *     security={{"sanctum":{}}},
     *     @OA\Parameter(name="id_annee", in="query", @OA\Schema(type="integer")),
     *     @OA\Parameter(name="id_enseignant", in="query", @OA\Schema(type="integer")),
     *     @OA\Response(response=200, description="Liste des volumes")
     * )
     */
    public function index(Request $request)
    {
        return VolumeHoraire::with('enseignant.departement', 'annee', 'validation')
            ->when($request->id_annee,      fn($q) => $q->where('id_annee', $request->id_annee))
            ->when($request->id_enseignant, fn($q) => $q->where('id_enseignant', $request->id_enseignant))
            ->paginate(15);
    }

    /**
     * @OA\Get(path="/api/v1/volume-horaire/{enseignant}", tags={"Volumes Horaires"},
     *     summary="Volumes horaires d'un enseignant",
     *     security={{"sanctum":{}}},
     *     @OA\Parameter(name="enseignant", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\Parameter(name="id_annee", in="query", @OA\Schema(type="integer")),
     *     @OA\Response(response=200, description="Volumes de l'enseignant"),
     *     @OA\Response(response=404, description="Non trouvé")
     * )
     */
    public function show(Request $request, Enseignant $enseignant)
    {
        $volumes = VolumeHoraire::with('annee', 'validation')
            ->where('id_enseignant', $enseignant->id_enseignant)
            ->when($request->id_annee, fn($q) => $q->where('id_annee', $request->id_annee))
            ->get();

        return response()->json([
            'enseignant' => $enseignant->load('departement'),
            'volumes'    => $volumes,
        ]);
    }

    /**
     * @OA\Post(path="/api/v1/volume-horaire/{volume}/valider", tags={"Volumes Horaires"},
     *     summary="Valider ou rejeter un volume horaire",
     *     security={{"sanctum":{}}},
     *     @OA\Parameter(name="volume", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\RequestBody(required=true,
     *         @OA\JsonContent(
     *             required={"statut_validation"},
     *             @OA\Property(property="statut_validation", type="string", enum={"valide","rejete"}),
     *             @OA\Property(property="observations", type="string")
     *         )
     *     ),
     *     @OA\Response(response=200, description="Volume validé/rejeté")
     * )
     */
    public function valider(Request $request, VolumeHoraire $volume)
    {
        $validated = $request->validate([
            'statut_validation' => 'required|in:valide,rejete',
            'observations'      => 'nullable|string',
        ]);

        $validation = Validation::updateOrCreate(
            ['id_volume' => $volume->id_volume],
            [
                'statut_validation' => $validated['statut_validation'],
                'date_validation'   => now(),
                'observations'      => $validated['observations'] ?? null,
                'id_validateur'     => $request->user()->id_user,
            ]
        );

        return response()->json($validation->load('volume.enseignant'));
    }
}
