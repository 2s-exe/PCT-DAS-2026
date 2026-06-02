<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\ParametreCalcul;

/**
 * @OA\Tag(name="Paramètres de calcul", description="Coefficients VHN par type d'opération et complexité (admin uniquement)")
 */
class ParametreCalculController extends Controller
{
    /**
     * @OA\Get(
     *     path="/api/v1/parametres",
     *     tags={"Paramètres de calcul"},
     *     summary="Liste de tous les paramètres de calcul",
     *     security={{"sanctum":{}}},
     *     @OA\Response(response=200, description="Liste des paramètres")
     * )
     */
    public function index(Request $request)
    {
        return ParametreCalcul::when($request->id_annee, fn($q) => $q->where('id_annee', $request->id_annee))
            ->orderBy('type_operation')
            ->orderBy('niveau')
            ->get();
    }

    /**
     * @OA\Post(
     *     path="/api/v1/parametres",
     *     tags={"Paramètres de calcul"},
     *     summary="Créer un paramètre de calcul",
     *     security={{"sanctum":{}}},
     *     @OA\RequestBody(required=true,
     *         @OA\JsonContent(
     *             required={"type_operation","niveau","libelle_niveau","heures_par_seance","id_annee"},
     *             @OA\Property(property="type_operation",    type="string", enum={"conception","mise_a_jour"}),
     *             @OA\Property(property="niveau", type="integer", example=1),
     *             @OA\Property(property="libelle_niveau", type="string", example="Simple"),
     *             @OA\Property(property="heures_par_seance",   type="number", example=1.5),
     *             @OA\Property(property="id_annee", type="integer"),
     *             @OA\Property(property="description",       type="string", example="Taux pour conception simple")
     *         )
     *     ),
     *     @OA\Response(response=201, description="Paramètre créé"),
     *     @OA\Response(response=422, description="Ce paramètre existe déjà")
     * )
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'type_operation'    => 'required|in:conception,mise_a_jour',
            'niveau'            => 'required|integer|between:1,3',
            'libelle_niveau'    => 'required|string|max:150',
            'heures_par_seance' => 'required|numeric|min:0',
            'id_annee'          => 'required|exists:annees_academiques,id_annee',
            'description'       => 'nullable|string',
        ]);

        $existe = ParametreCalcul::where('type_operation', $validated['type_operation'])
                                 ->where('niveau', $validated['niveau'])
                                 ->where('id_annee', $validated['id_annee'])
                                 ->exists();

        if ($existe) {
            return response()->json([
                'message' => 'Un paramètre pour cette opération, ce niveau et cette année existe déjà.'
            ], 422);
        }

        return response()->json(ParametreCalcul::create($validated), 201);
    }

    /**
     * @OA\Get(
     *     path="/api/v1/parametres/{id}",
     *     tags={"Paramètres de calcul"},
     *     summary="Détail d'un paramètre",
     *     security={{"sanctum":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\Response(response=200, description="Détail paramètre"),
     *     @OA\Response(response=404, description="Non trouvé")
     * )
     */
    public function show(ParametreCalcul $parametre)
    {
        return response()->json($parametre);
    }

    /**
     * @OA\Put(
     *     path="/api/v1/parametres/{id}",
     *     tags={"Paramètres de calcul"},
     *     summary="Modifier le coefficient d'un paramètre",
     *     security={{"sanctum":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\RequestBody(required=true,
     *         @OA\JsonContent(
     *             @OA\Property(property="coefficient_vhn", type="number", example=5.0),
     *             @OA\Property(property="description",     type="string")
     *         )
     *     ),
     *     @OA\Response(response=200, description="Paramètre modifié")
     * )
     */
    public function update(Request $request, ParametreCalcul $parametre)
    {
        $validated = $request->validate([
            'heures_par_seance' => 'sometimes|numeric|min:0',
            'libelle_niveau'    => 'sometimes|string|max:150',
            'description'       => 'nullable|string',
        ]);

        $parametre->update($validated);
        return response()->json($parametre);
    }

    /**
     * @OA\Delete(
     *     path="/api/v1/parametres/{id}",
     *     tags={"Paramètres de calcul"},
     *     summary="Supprimer un paramètre de calcul",
     *     security={{"sanctum":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\Response(response=200, description="Paramètre supprimé")
     * )
     */
    public function destroy(ParametreCalcul $parametre)
    {
        $parametre->delete();
        return response()->json(['message' => 'Paramètre supprimé avec succès.']);
    }
}