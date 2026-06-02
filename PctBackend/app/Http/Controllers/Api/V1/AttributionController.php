<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Attribution;

/**
 * @OA\Tag(name="Attributions", description="Attribution des cours aux enseignants")
 */
class AttributionController extends Controller
{
    /**
     * @OA\Get(path="/api/v1/attributions", tags={"Attributions"},
     *     summary="Liste des attributions",
     *     security={{"sanctum":{}}},
     *     @OA\Parameter(name="id_enseignant", in="query", @OA\Schema(type="integer")),
     *     @OA\Parameter(name="id_annee", in="query", @OA\Schema(type="integer")),
     *     @OA\Response(response=200, description="Liste des attributions")
     * )
     */
    public function index(Request $request)
    {
        return Attribution::with('enseignant', 'cours', 'annee')
            ->when($request->id_enseignant, fn($q) => $q->where('id_enseignant', $request->id_enseignant))
            ->when($request->id_annee,      fn($q) => $q->where('id_annee', $request->id_annee))
            ->paginate(15);
    }

    /**
     * @OA\Post(path="/api/v1/attributions", tags={"Attributions"},
     *     summary="Attribuer un cours à un enseignant",
     *     security={{"sanctum":{}}},
     *     @OA\RequestBody(required=true,
     *         @OA\JsonContent(
     *             required={"id_enseignant","id_cours","id_annee","charge_horaire","date_attribution"},
     *             @OA\Property(property="id_enseignant", type="integer"),
     *             @OA\Property(property="id_cours", type="integer"),
     *             @OA\Property(property="id_annee", type="integer"),
     *             @OA\Property(property="charge_horaire", type="number", example=45),
     *             @OA\Property(property="date_attribution", type="string", format="date", example="2024-09-01")
     *         )
     *     ),
     *     @OA\Response(response=201, description="Attribution créée"),
     *     @OA\Response(response=422, description="Attribution déjà existante")
     * )
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'id_enseignant'   => 'required|exists:enseignants,id_enseignant',
            'id_cours'        => 'required|exists:cours,id_cours',
            'id_annee'        => 'required|exists:annees_academiques,id_annee',
            'charge_horaire'  => 'required|numeric|min:0',
            'date_attribution'=> 'required|date',
        ]);

        // Vérifier doublon
        $exist = Attribution::where([
            'id_enseignant' => $validated['id_enseignant'],
            'id_cours'      => $validated['id_cours'],
            'id_annee'      => $validated['id_annee'],
        ])->exists();

        if ($exist) {
            return response()->json(['message' => 'Cette attribution existe déjà.'], 422);
        }

        return response()->json(
            Attribution::create($validated)->load('enseignant', 'cours', 'annee'), 201
        );
    }

    public function destroy(Attribution $attribution)
    {
        $attribution->delete();
        return response()->json(['message' => 'Attribution supprimée.']);
    }
}