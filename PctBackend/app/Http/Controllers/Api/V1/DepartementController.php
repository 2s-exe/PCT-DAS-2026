<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Departement;

/**
 * @OA\Tag(name="Départements", description="Gestion des départements (admin uniquement)")
 */
class DepartementController extends Controller
{
    /**
     * @OA\Get(
     *     path="/api/v1/departements",
     *     tags={"Départements"},
     *     summary="Liste de tous les départements",
     *     security={{"sanctum":{}}},
     *     @OA\Response(response=200, description="Liste des départements")
     * )
     */
    public function index()
    {
        return Departement::withCount('enseignants')->get();
    }

    /**
     * @OA\Post(
     *     path="/api/v1/departements",
     *     tags={"Départements"},
     *     summary="Créer un département",
     *     security={{"sanctum":{}}},
     *     @OA\RequestBody(required=true,
     *         @OA\JsonContent(
     *             required={"nom_departement"},
     *             @OA\Property(property="nom_departement", type="string", example="Informatique"),
     *             @OA\Property(property="responsable",     type="string", example="Dr. Koffi")
     *         )
     *     ),
     *     @OA\Response(response=201, description="Département créé"),
     *     @OA\Response(response=422, description="Données invalides")
     * )
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nom_departement' => 'required|string|max:150|unique:departements,nom_departement',
            'responsable'     => 'nullable|string|max:150',
        ]);

        return response()->json(Departement::create($validated), 201);
    }

    /**
     * @OA\Get(
     *     path="/api/v1/departements/{id}",
     *     tags={"Départements"},
     *     summary="Détail d'un département avec ses enseignants",
     *     security={{"sanctum":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\Response(response=200, description="Détail département"),
     *     @OA\Response(response=404, description="Non trouvé")
     * )
     */
    public function show(Departement $departement)
    {
        return $departement->load('enseignants');
    }

    /**
     * @OA\Put(
     *     path="/api/v1/departements/{id}",
     *     tags={"Départements"},
     *     summary="Modifier un département",
     *     security={{"sanctum":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\RequestBody(required=true,
     *         @OA\JsonContent(
     *             @OA\Property(property="nom_departement", type="string"),
     *             @OA\Property(property="responsable",     type="string")
     *         )
     *     ),
     *     @OA\Response(response=200, description="Département modifié"),
     *     @OA\Response(response=404, description="Non trouvé")
     * )
     */
    public function update(Request $request, Departement $departement)
    {
        $validated = $request->validate([
            'nom_departement' => 'sometimes|string|max:150|unique:departements,nom_departement,' . $departement->id_departement . ',id_departement',
            'responsable'     => 'nullable|string|max:150',
        ]);

        $departement->update($validated);
        return response()->json($departement);
    }

    /**
     * @OA\Delete(
     *     path="/api/v1/departements/{id}",
     *     tags={"Départements"},
     *     summary="Supprimer un département",
     *     security={{"sanctum":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\Response(response=200, description="Département supprimé"),
     *     @OA\Response(response=422, description="Impossible : des enseignants sont rattachés à ce département")
     * )
     */
    public function destroy(Departement $departement)
    {
        if ($departement->enseignants()->where('actif', true)->exists()) {
            return response()->json([
                'message' => 'Impossible de supprimer ce département : des enseignants actifs y sont rattachés.'
            ], 422);
        }

        $departement->delete();
        return response()->json(['message' => 'Département supprimé avec succès.']);
    }
}
