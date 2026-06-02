<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\JournalService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

/**
 * @OA\Tag(name="Auth", description="Authentification sécurisée — throttle 5/min")
 */
class AuthController extends Controller
{
    // Nombre de tentatives avant verrouillage
    private const MAX_TENTATIVES = 5;
    // Durée du verrouillage automatique (minutes)
    private const DUREE_VERROUILLAGE_MIN = 15;

    public function __construct(private JournalService $journal) {}

    /**
     * @OA\Post(
     *     path="/api/v1/login",
     *     tags={"Auth"},
     *     summary="Connexion utilisateur (5 tentatives max/min)",
     *     @OA\RequestBody(required=true,
     *         @OA\JsonContent(required={"login","password"},
     *             @OA\Property(property="login",    type="string", example="superadmin@uvci.edu.ci"),
     *             @OA\Property(property="password", type="string", example="Secret@2026")
     *         )
     *     ),
     *     @OA\Response(response=200, description="Connexion réussie"),
     *     @OA\Response(response=401, description="Identifiants invalides"),
     *     @OA\Response(response=423, description="Compte verrouillé"),
     *     @OA\Response(response=429, description="Trop de tentatives — rate limit atteint")
     * )
     */
    public function login(Request $request)
    {
        $request->validate([
            'login'    => 'required|string',
            'password' => 'required|string',
        ]);

        $utilisateur = User::where('login', $request->login)
            ->with('profil', 'enseignant')
            ->first();

        // Compte introuvable
        if (!$utilisateur) {
            $this->journal->tentativeEchouee($request->login, $request);
            return response()->json(['message' => 'Identifiants invalides.'], 401);
        }

        // Compte désactivé par un admin
        if (!$utilisateur->actif) {
            $this->journal->ecrire(
                user:        null,
                action:      'login_compte_inactif',
                module:      'auth',
                description: "Tentative de connexion sur compte inactif [{$request->login}]",
                request:     $request,
                statut:      'refus',
            );
            return response()->json(['message' => 'Compte désactivé. Contactez l\'administrateur.'], 403);
        }

        // Compte verrouillé (temporairement après trop de tentatives)
        if ($utilisateur->estVerrouille()) {
            $minutes = now()->diffInMinutes($utilisateur->compte_verrouille_jusqu_a, false);
            $this->journal->tentativeEchouee($request->login, $request);
            return response()->json([
                'message' => "Compte verrouillé. Réessayez dans {$minutes} minute(s) ou contactez un administrateur.",
            ], 423);
        }

        // Mauvais mot de passe
        if (!Hash::check($request->password, $utilisateur->mot_de_passe_hash)) {
            $this->traiterEchecAuthentification($utilisateur, $request);
            return response()->json(['message' => 'Identifiants invalides.'], 401);
        }

        // Connexion réussie — réinitialiser le compteur d'échecs
        $utilisateur->update([
            'nb_tentatives_echec'       => 0,
            'compte_verrouille_jusqu_a' => null,
            'derniere_connexion'        => now(),
        ]);

        $tokenResult = $utilisateur->createToken('pct-token');
        $token       = $tokenResult->plainTextToken;
        $tokenId     = $tokenResult->accessToken->id;

        // Ouvrir une session traçable
        $this->journal->ouvrirSession($utilisateur, $request, $tokenId);

        // Journaliser la connexion réussie
        $this->journal->ecrire(
            user:        $utilisateur,
            action:      'login_succes',
            module:      'auth',
            description: "Connexion réussie pour [{$utilisateur->login}] — profil [{$utilisateur->role}]",
            request:     $request,
        );

        return response()->json([
            'token' => $token,
            'user'  => [
                'id'                         => $utilisateur->id_user,
                'login'                      => $utilisateur->login,
                'role'                       => $utilisateur->profil->libelle_profil,
                'mot_de_passe_change_requis' => $utilisateur->mot_de_passe_change_requis,
                'enseignant'                 => $utilisateur->enseignant,
            ],
        ]);
    }

    /**
     * @OA\Post(path="/api/v1/logout", tags={"Auth"}, summary="Déconnexion", security={{"sanctum":{}}},
     *     @OA\Response(response=200, description="Déconnecté"))
     */
    public function logout(Request $request)
    {
        $user    = $request->user();
        $tokenId = $user->currentAccessToken()->id;

        // Fermer la session traçable
        $this->journal->fermerSession($user, $tokenId);

        // Journaliser la déconnexion
        $this->journal->ecrire(
            user:        $user,
            action:      'logout',
            module:      'auth',
            description: "Déconnexion de [{$user->login}]",
            request:     $request,
        );

        $user->currentAccessToken()->delete();
        return response()->json(['message' => 'Déconnecté avec succès.']);
    }

    /**
     * @OA\Get(path="/api/v1/me", tags={"Auth"}, summary="Utilisateur connecté", security={{"sanctum":{}}},
     *     @OA\Response(response=200, description="Données de l'utilisateur connecté"))
     */
    public function me(Request $request)
    {
        return response()->json($request->user()->load('profil', 'enseignant.departement'));
    }

    /**
     * @OA\Post(
     *     path="/api/v1/me/changer-mot-de-passe",
     *     tags={"Auth"},
     *     summary="Changer son propre mot de passe (tous profils)",
     *     security={{"sanctum":{}}},
     *     @OA\RequestBody(required=true,
     *         @OA\JsonContent(
     *             required={"mot_de_passe_actuel","nouveau_mot_de_passe","confirmation"},
     *             @OA\Property(property="mot_de_passe_actuel",  type="string"),
     *             @OA\Property(property="nouveau_mot_de_passe", type="string"),
     *             @OA\Property(property="confirmation",         type="string")
     *         )
     *     ),
     *     @OA\Response(response=200, description="Mot de passe changé avec succès"),
     *     @OA\Response(response=422, description="Mot de passe actuel incorrect ou politique non respectée")
     * )
     */
    public function changerMotDePasse(Request $request)
    {
        $request->validate([
            'mot_de_passe_actuel'  => 'required|string',
            'nouveau_mot_de_passe' => [
                'required', 'string',
                \Illuminate\Validation\Rules\Password::min(10)
                    ->mixedCase()
                    ->numbers()
                    ->symbols(),
            ],
            'confirmation' => 'required|same:nouveau_mot_de_passe',
        ], [
            'confirmation.same' => 'La confirmation ne correspond pas au nouveau mot de passe.',
        ]);

        $user = $request->user();

        if (!Hash::check($request->mot_de_passe_actuel, $user->mot_de_passe_hash)) {
            $this->journal->ecrire(
                user:        $user,
                action:      'changement_mdp_echec',
                module:      'auth',
                description: "Échec changement de mot de passe pour [{$user->login}] — mot de passe actuel incorrect",
                request:     $request,
                statut:      'echec',
            );
            return response()->json(['message' => 'Le mot de passe actuel est incorrect.'], 422);
        }

        // Empêcher la réutilisation du même mot de passe
        if (Hash::check($request->nouveau_mot_de_passe, $user->mot_de_passe_hash)) {
            return response()->json(['message' => 'Le nouveau mot de passe doit être différent de l\'ancien.'], 422);
        }

        $user->update([
            'mot_de_passe_hash'          => Hash::make($request->nouveau_mot_de_passe),
            'mot_de_passe_change_requis' => false,
        ]);

        $this->journal->ecrire(
            user:        $user,
            action:      'changement_mdp_succes',
            module:      'auth',
            description: "Changement de mot de passe réussi pour [{$user->login}]",
            request:     $request,
        );

        return response()->json(['message' => 'Mot de passe modifié avec succès.']);
    }

    // ── Gestion des échecs d'authentification ────────────────────────────────

    private function traiterEchecAuthentification(User $utilisateur, Request $request): void
    {
        $nbEchecs = $utilisateur->nb_tentatives_echec + 1;
        $updates  = ['nb_tentatives_echec' => $nbEchecs];

        if ($nbEchecs >= self::MAX_TENTATIVES) {
            $updates['compte_verrouille_jusqu_a'] = now()->addMinutes(self::DUREE_VERROUILLAGE_MIN);

            $this->journal->ecrire(
                user:        null,
                action:      'verrouillage_auto',
                module:      'auth',
                description: "Compte [{$utilisateur->login}] verrouillé automatiquement après {$nbEchecs} tentatives échouées",
                request:     $request,
                statut:      'echec',
            );
        } else {
            $this->journal->tentativeEchouee($utilisateur->login, $request);
        }

        $utilisateur->update($updates);
    }
}
