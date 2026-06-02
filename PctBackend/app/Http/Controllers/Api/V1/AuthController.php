<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

/**
 * @OA\Tag(name="Auth", description="Authentification")
 */
class AuthController extends Controller
{
    /**
     * @OA\Post(
     *     path="/api/v1/login",
     *     tags={"Auth"},
     *     summary="Connexion utilisateur",
     *     @OA\RequestBody(required=true,
     *         @OA\JsonContent(required={"login","password"},
     *             @OA\Property(property="login", type="string", example="admin@uvci.edu.ci"),
     *             @OA\Property(property="password", type="string", example="secret123")
     *         )
     *     ),
     *     @OA\Response(response=200, description="Connexion réussie",
     *         @OA\JsonContent(
     *             @OA\Property(property="token", type="string"),
     *             @OA\Property(property="user", type="object")
     *         )
     *     ),
     *     @OA\Response(response=401, description="Identifiants invalides")
     * )
     */
    public function login(Request $request)
    {
        $request->validate([
            'login'    => 'required|string',
            'password' => 'required|string',
        ]);

        $utilisateur = User::where('login', $request->login)
                                  ->where('actif', true)
                                  ->with('profil', 'enseignant')
                                  ->first();

        if (!$utilisateur || !Hash::check($request->password, $utilisateur->mot_de_passe_hash)) {
            return response()->json(['message' => 'Identifiants invalides.'], 401);
        }

        $utilisateur->update(['derniere_connexion' => now()]);
        $token = $utilisateur->createToken('pct-token')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user'  => [
                'id'    => $utilisateur->id_user,
                'login' => $utilisateur->login,
                'role'  => $utilisateur->profil->libelle_profil,
                'enseignant' => $utilisateur->enseignant,
            ],
        ]);
    }

    /**
     * @OA\Post(
     *     path="/api/v1/logout",
     *     tags={"Auth"},
     *     summary="Déconnexion",
     *     security={{"sanctum":{}}},
     *     @OA\Response(response=200, description="Déconnecté avec succès")
     * )
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Déconnecté avec succès.']);
    }

    /**
     * @OA\Get(
     *     path="/api/v1/me",
     *     tags={"Auth"},
     *     summary="Utilisateur connecté",
     *     security={{"sanctum":{}}},
     *     @OA\Response(response=200, description="Données de l'utilisateur connecté")
     * )
     */
    public function me(Request $request)
    {
        return response()->json($request->user()->load('profil', 'enseignant.departement'));
    }
}
