<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Enseignant;
use App\Models\Profil;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

/**
 * @OA\Tag(name="Utilisateurs", description="Gestion des comptes utilisateurs (admin uniquement)")
 */
class UserController extends Controller
{
    /**
     * @OA\Get(
     *     path="/api/v1/users",
     *     tags={"Utilisateurs"},
     *     summary="Liste de tous les comptes",
     *     security={{"sanctum":{}}},
     *     @OA\Response(response=200, description="Liste des utilisateurs")
     * )
     */
    public function index()
    {
        return User::with('profil', 'enseignant.departement')
            ->paginate(15);
    }

    /**
     * @OA\Post(
     *     path="/api/v1/users",
     *     tags={"Utilisateurs"},
     *     summary="Créer un compte utilisateur (admin ou secrétaire)",
     *     security={{"sanctum":{}}},
     *     @OA\RequestBody(required=true,
     *         @OA\JsonContent(
     *             required={"login","password","id_profil"},
     *             @OA\Property(property="login",        type="string",  example="secretaire2@uvci.edu.ci"),
     *             @OA\Property(property="password",     type="string",  example="MonMotDePasse@2024"),
     *             @OA\Property(property="id_profil",    type="integer", example=2),
     *             @OA\Property(property="id_enseignant",type="integer", example=null,
     *                 description="Obligatoire si le profil est 'enseignant', null sinon")
     *         )
     *     ),
     *     @OA\Response(response=201, description="Compte créé"),
     *     @OA\Response(response=422, description="Données invalides")
     * )
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'login'         => ['required', 'email', 'regex:/^[A-Za-z0-9._%+-]+@uvci\.edu\.ci$/i', 'unique:users,login'],
            'password'      => 'required|string|min:8',
            'id_profil'     => 'required|exists:profils,id_profil',
            'id_enseignant' => 'nullable|exists:enseignants,id_enseignant',
        ], [
            'login.regex' => 'Le login doit respecter le domaine institutionnel @uvci.edu.ci.',
        ]);

        // Si le profil est "enseignant", id_enseignant est obligatoire
        $profil = Profil::findOrFail($validated['id_profil']);
        if ($profil->libelle_profil === 'enseignant' && empty($validated['id_enseignant'])) {
            return response()->json([
                'message' => 'Le champ id_enseignant est obligatoire pour un profil enseignant.'
            ], 422);
        }

        $utilisateur = User::create([
            'login'             => $validated['login'],
            'mot_de_passe_hash' => Hash::make($validated['password']),
            'id_profil'         => $validated['id_profil'],
            'id_enseignant'     => $validated['id_enseignant'] ?? null,
            'actif'             => true,
        ]);

        return response()->json(
            $utilisateur->load('profil', 'enseignant'), 201
        );
    }

    /**
     * @OA\Get(
     *     path="/api/v1/users/{id}",
     *     tags={"Utilisateurs"},
     *     summary="Détail d'un compte",
     *     security={{"sanctum":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\Response(response=200, description="Détail utilisateur"),
     *     @OA\Response(response=404, description="Non trouvé")
     * )
     */
    public function show(User $user)
    {
        return $user->load('profil', 'enseignant.departement');
    }

    /**
     * @OA\Put(
     *     path="/api/v1/users/{id}",
     *     tags={"Utilisateurs"},
     *     summary="Modifier un compte (login, mot de passe, profil)",
     *     security={{"sanctum":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\RequestBody(required=true,
     *         @OA\JsonContent(
     *             @OA\Property(property="login",     type="string", example="secretaire2@uvci.edu.ci"),
     *             @OA\Property(property="password",  type="string", description="Laisser vide pour ne pas changer"),
     *             @OA\Property(property="id_profil", type="integer"),
     *             @OA\Property(property="actif",     type="boolean")
     *         )
     *     ),
     *     @OA\Response(response=200, description="Compte modifié")
     * )
     */
    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'login'     => ['sometimes', 'email', 'regex:/^[A-Za-z0-9._%+-]+@uvci\.edu\.ci$/i', Rule::unique('users', 'login')->ignore($user->id_user, 'id_user')],
            'password'  => 'sometimes|nullable|string|min:8',
            'id_profil' => 'sometimes|exists:profils,id_profil',
            'actif'     => 'sometimes|boolean',
        ], [
            'login.regex' => 'Le login doit respecter le domaine institutionnel @uvci.edu.ci.',
        ]);

        // Ne hasher le mot de passe que s'il est fourni
        if (!empty($validated['password'])) {
            $validated['mot_de_passe_hash'] = Hash::make($validated['password']);
        }
        unset($validated['password']);

        $user->update($validated);

        return response()->json($user->load('profil', 'enseignant'));
    }

    /**
     * @OA\Delete(
     *     path="/api/v1/users/{id}",
     *     tags={"Utilisateurs"},
     *     summary="Désactiver un compte",
     *     security={{"sanctum":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\Response(response=200, description="Compte désactivé")
     * )
     */
    public function destroy(User $user)
    {
        // Empêcher l'admin de se supprimer lui-même
        if ($user->id_user === request()->user()->id_user) {
            return response()->json(['message' => 'Vous ne pouvez pas désactiver votre propre compte.'], 403);
        }

        $user->update(['actif' => false]);
        return response()->json(['message' => 'Compte désactivé avec succès.']);
    }

    /**
     * @OA\Post(
     *     path="/api/v1/users/{id}/reinitialiser-mdp",
     *     tags={"Utilisateurs"},
     *     summary="Réinitialiser le mot de passe d'un utilisateur",
     *     security={{"sanctum":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\Response(response=200, description="Mot de passe réinitialisé, nouveau mdp retourné")
     * )
     */
    public function reinitialiserMotDePasse(User $user)
    {
        // Génère un mot de passe temporaire
        $nouveauMdp = 'Pct@' . rand(1000, 9999);

        $user->update([
            'mot_de_passe_hash' => Hash::make($nouveauMdp)
        ]);

        return response()->json([
            'message'           => 'Mot de passe réinitialisé avec succès.',
            'mot_de_passe_temp' => $nouveauMdp, // À afficher une seule fois à l'admin
        ]);
    }
}
