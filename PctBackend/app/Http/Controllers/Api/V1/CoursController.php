<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Cours;

/**
 * @OA\Tag(name="Cours", description="Gestion des cours")
 */
class CoursController extends Controller
{
    /**
     * @OA\Get(path="/api/v1/cours", tags={"Cours"}, summary="Liste des cours",
     *     security={{"sanctum":{}}},
     *     @OA\Parameter(name="niveau", in="query", @OA\Schema(type="string")),
     *     @OA\Response(response=200, description="Liste des cours")
     * )
     */
    public function index(Request $request)
    {
        return Cours::when($request->niveau, fn($q) => $q->where('niveau', $request->niveau))
                    ->paginate(15);
    }

    /**
     * @OA\Post(path="/api/v1/cours", tags={"Cours"}, summary="Créer un cours",
     *     security={{"sanctum":{}}},
     *     @OA\RequestBody(required=true,
     *         @OA\JsonContent(
     *             required={"intitule_ecue","niveau","semestre","credit_ecue","charge_horaire_annuel"},
     *             @OA\Property(property="intitule_ecue", type="string", example="Algorithmes avancés"),
     *             @OA\Property(property="niveau", type="string", enum={"L1","L2","L3","M1","M2"}),
     *             @OA\Property(property="semestre", type="string", example="S3"),
     *             @OA\Property(property="credit_ecue", type="integer", example=3),
     *             @OA\Property(property="code_specialite", type="string", example="INFO"),
     *             @OA\Property(property="charge_horaire_annuel", type="number", example=45)
     *         )
     *     ),
     *     @OA\Response(response=201, description="Cours créé")
     * )
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'intitule_ecue'        => 'required|string|max:255',
            'niveau'               => 'required|in:L1,L2,L3,M1,M2',
            'semestre'             => 'required|string',
            'credit_ecue'          => 'required|integer|min:1',
            'code_specialite'      => 'nullable|string',
            'charge_horaire_annuel'=> 'required|numeric|min:0',
        ]);
        return response()->json(Cours::create($validated), 201);
    }

    public function show(Cours $cours)
    {
        return $cours->load('attributions.enseignant');
    }

    public function update(Request $request, Cours $cours)
    {
        $cours->update($request->validate([
            'intitule_ecue'        => 'sometimes|string|max:255',
            'niveau'               => 'sometimes|in:L1,L2,L3,M1,M2',
            'semestre'             => 'sometimes|string',
            'credit_ecue'          => 'sometimes|integer|min:1',
            'charge_horaire_annuel'=> 'sometimes|numeric|min:0',
        ]));
        return $cours;
    }

    public function destroy(Cours $cours)
    {
        $cours->delete();
        return response()->json(['message' => 'Cours supprimé.']);
    }
}
