<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\AnneeAcademique;

/**
 * @OA\Tag(name="Années Académiques", description="Gestion des années académiques (admin uniquement)")
 */
class AnneeAcademiqueController extends Controller
{
    /**
     * @OA\Get(
     *     path="/api/v1/annees",
     *     tags={"Années Académiques"},
     *     summary="Liste des années académiques",
     *     security={{"sanctum":{}}},
     *     @OA\Response(response=200, description="Liste des années")
     * )
     */
    public function index()
    {
        return AnneeAcademique::orderByDesc('date_debut')->get();
    }

    /**
     * @OA\Post(
     *     path="/api/v1/annees",
     *     tags={"Années Académiques"},
     *     summary="Créer une année académique",
     *     security={{"sanctum":{}}},
     *     @OA\RequestBody(required=true,
     *         @OA\JsonContent(
     *             required={"libelle_annee","date_debut","date_fin"},
     *             @OA\Property(property="libelle_annee", type="string",  example="2024-2025"),
     *             @OA\Property(property="date_debut",    type="string",  format="date", example="2024-09-01"),
     *             @OA\Property(property="date_fin",      type="string",  format="date", example="2025-07-31"),
     *             @OA\Property(property="active",        type="boolean", example=false)
     *         )
     *     ),
     *     @OA\Response(response=201, description="Année créée"),
     *     @OA\Response(response=422, description="Données invalides")
     * )
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'libelle_annee' => 'required|string|unique:annees_academiques,libelle_annee',
            'date_debut'    => 'required|date',
            'date_fin'      => 'required|date|after:date_debut',
            'active'        => 'boolean',
        ]);

        // Si cette année est activée, désactiver les autres
        if (!empty($validated['active']) && $validated['active']) {
            AnneeAcademique::where('active', true)->update(['active' => false]);
        }

        return response()->json(AnneeAcademique::create($validated), 201);
    }

    /**
     * @OA\Get(
     *     path="/api/v1/annees/{id}",
     *     tags={"Années Académiques"},
     *     summary="Détail d'une année académique",
     *     security={{"sanctum":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\Response(response=200, description="Détail année"),
     *     @OA\Response(response=404, description="Non trouvé")
     * )
     */
    public function show(AnneeAcademique $annee)
    {
        return $annee->loadCount('attributions');
    }

    /**
     * @OA\Put(
     *     path="/api/v1/annees/{id}",
     *     tags={"Années Académiques"},
     *     summary="Modifier une année académique",
     *     security={{"sanctum":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\RequestBody(required=true,
     *         @OA\JsonContent(
     *             @OA\Property(property="libelle_annee", type="string"),
     *             @OA\Property(property="date_debut",    type="string", format="date"),
     *             @OA\Property(property="date_fin",      type="string", format="date"),
     *             @OA\Property(property="active",        type="boolean")
     *         )
     *     ),
     *     @OA\Response(response=200, description="Année modifiée")
     * )
     */
    public function update(Request $request, AnneeAcademique $annee)
    {
        $validated = $request->validate([
            'libelle_annee' => 'sometimes|string|unique:annees_academiques,libelle_annee,' . $annee->id_annee . ',id_annee',
            'date_debut'    => 'sometimes|date',
            'date_fin'      => 'sometimes|date|after:date_debut',
            'active'        => 'sometimes|boolean',
        ]);

        // Une seule année active à la fois
        if (!empty($validated['active']) && $validated['active']) {
            AnneeAcademique::where('active', true)
                           ->where('id_annee', '!=', $annee->id_annee)
                           ->update(['active' => false]);
        }

        $annee->update($validated);
        return response()->json($annee);
    }

    /**
     * @OA\Delete(
     *     path="/api/v1/annees/{id}",
     *     tags={"Années Académiques"},
     *     summary="Supprimer une année académique",
     *     security={{"sanctum":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\Response(response=200, description="Année supprimée"),
     *     @OA\Response(response=422, description="Impossible : des données sont liées à cette année")
     * )
     */
    public function destroy(AnneeAcademique $annee)
    {
        if ($annee->attributions()->exists()) {
            return response()->json([
                'message' => 'Impossible de supprimer cette année : des attributions y sont liées.'
            ], 422);
        }

        if ($annee->active) {
            return response()->json([
                'message' => 'Impossible de supprimer l\'année académique active.'
            ], 422);
        }

        $annee->delete();
        return response()->json(['message' => 'Année académique supprimée avec succès.']);
    }

    /**
     * @OA\Get(
     *     path="/api/v1/annees/active",
     *     tags={"Années Académiques"},
     *     summary="Récupérer l'année académique active",
     *     security={{"sanctum":{}}},
     *     @OA\Response(response=200, description="Année active"),
     *     @OA\Response(response=404, description="Aucune année active")
     * )
     */
    public function active()
    {
        $annee = AnneeAcademique::active()->first();

        if (!$annee) {
            return response()->json(['message' => 'Aucune année académique active.'], 404);
        }

        return response()->json($annee);
    }
}