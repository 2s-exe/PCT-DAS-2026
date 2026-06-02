<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Profil;
use App\Models\User;
use App\Services\JournalService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

/**
 * @OA\Tag(name="Utilisateurs", description="Gestion des comptes (SUPER_ADMIN exclusivement)")
 */
class UserController extends Controller
{
    public function __construct(private JournalService $journal) {}

    /** @OA\Get(path="/api/v1/users", tags={"Utilisateurs"}, summary="Liste tous les comptes", security={{"sanctum":{}}}, @OA\Response(response=200, description="Liste paginée")) */
    public function index()
    {
        return User::with('profil', 'enseignant.departement', 'createur')
            ->paginate(15);
    }

    /** @OA\Post(path="/api/v1/users", tags={"Utilisateurs"}, summary="Créer un compte (SUPER_ADMIN)", security={{"sanctum":{}}}, @OA\Response(response=201, description="Compte créé"), @OA\Response(response=422, description="Données invalides")) */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'login'         => [
                'required', 'email',
                'regex:/^[A-Za-z0-9._%+-]+@uvci\.edu\.ci$/i',
                'unique:users,login',
            ],
            'password'      => [
                'required',
                Password::min(10)
                    ->mixedCase()
                    ->numbers()
                    ->symbols()
                    ->uncompromised(),
            ],
            'id_profil'     => 'required|exists:profils,id_profil',
            'id_enseignant' => 'nullable|exists:enseignants,id_enseignant',
        ], [
            'login.regex' => 'Le login doit respecter le domaine @uvci.edu.ci.',
        ]);

        $profil = Profil::findOrFail($validated['id_profil']);
        if ($profil->libelle_profil === 'enseignant' && empty($validated['id_enseignant'])) {
            return response()->json([
                'message' => 'id_enseignant est obligatoire pour le profil enseignant.',
            ], 422);
        }

        // Vérifier qu'un enseignant n'a pas déjà un compte
        if (!empty($validated['id_enseignant'])) {
            $existeDeja = User::where('id_enseignant', $validated['id_enseignant'])->exists();
            if ($existeDeja) {
                return response()->json([
                    'message' => 'Cet enseignant possède déjà un compte utilisateur.',
                ], 422);
            }
        }

        $utilisateur = User::create([
            'login'                      => $validated['login'],
            'mot_de_passe_hash'          => Hash::make($validated['password']),
            'id_profil'                  => $validated['id_profil'],
            'id_enseignant'              => $validated['id_enseignant'] ?? null,
            'actif'                      => true,
            'mot_de_passe_change_requis' => true,
            'created_by'                 => $request->user()->id_user,
        ]);

        // Assigner le rôle Spatie correspondant au profil
        $utilisateur->assignRole($profil->libelle_profil);

        $this->journal->ecrire(
            user:        $request->user(),
            action:      'creation_compte',
            module:      'users',
            description: "Création du compte [{$utilisateur->login}] avec profil [{$profil->libelle_profil}]",
            apres:       ['login' => $utilisateur->login, 'profil' => $profil->libelle_profil],
            request:     $request,
        );

        return response()->json($utilisateur->load('profil', 'enseignant'), 201);
    }

    /** @OA\Get(path="/api/v1/users/{id}", tags={"Utilisateurs"}, summary="Détail d'un compte", security={{"sanctum":{}}}, @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")), @OA\Response(response=200, description="Détail")) */
    public function show(User $user)
    {
        return $user->load('profil', 'enseignant.departement', 'createur');
    }

    /** @OA\Put(path="/api/v1/users/{id}", tags={"Utilisateurs"}, summary="Modifier un compte", security={{"sanctum":{}}}, @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")), @OA\Response(response=200, description="Compte modifié")) */
    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'login'     => [
                'sometimes', 'email',
                'regex:/^[A-Za-z0-9._%+-]+@uvci\.edu\.ci$/i',
                Rule::unique('users', 'login')->ignore($user->id_user, 'id_user'),
            ],
            'password'  => [
                'sometimes', 'nullable',
                Password::min(10)->mixedCase()->numbers()->symbols(),
            ],
            'id_profil' => 'sometimes|exists:profils,id_profil',
            'actif'     => 'sometimes|boolean',
        ], [
            'login.regex' => 'Le login doit respecter le domaine @uvci.edu.ci.',
        ]);

        $avant = $user->only(['login', 'id_profil', 'actif']);

        if (!empty($validated['password'])) {
            $validated['mot_de_passe_hash']          = Hash::make($validated['password']);
            $validated['mot_de_passe_change_requis'] = false;
        }
        unset($validated['password']);

        // Mettre à jour le rôle Spatie si le profil change
        if (!empty($validated['id_profil']) && $validated['id_profil'] !== $user->id_profil) {
            $nouveauProfil = Profil::find($validated['id_profil']);
            $user->syncRoles([$nouveauProfil->libelle_profil]);
        }

        $user->update($validated);

        $this->journal->ecrire(
            user:        $request->user(),
            action:      'modification_compte',
            module:      'users',
            description: "Modification du compte [{$user->login}]",
            avant:       $avant,
            apres:       $user->only(['login', 'id_profil', 'actif']),
            request:     $request,
        );

        return response()->json($user->load('profil', 'enseignant'));
    }

    /** @OA\Delete(path="/api/v1/users/{id}", tags={"Utilisateurs"}, summary="Désactiver un compte", security={{"sanctum":{}}}, @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")), @OA\Response(response=200, description="Compte désactivé")) */
    public function destroy(User $user)
    {
        if ($user->id_user === request()->user()->id_user) {
            return response()->json(['message' => 'Vous ne pouvez pas désactiver votre propre compte.'], 403);
        }

        $user->update(['actif' => false]);
        $user->tokens()->delete(); // Révoquer tous les tokens actifs

        $this->journal->ecrire(
            user:        request()->user(),
            action:      'desactivation_compte',
            module:      'users',
            description: "Désactivation du compte [{$user->login}]",
            avant:       ['actif' => true],
            apres:       ['actif' => false],
            request:     request(),
        );

        return response()->json(['message' => 'Compte désactivé et sessions révoquées.']);
    }

    /** @OA\Patch(path="/api/v1/users/{id}/activer", tags={"Utilisateurs"}, summary="Réactiver un compte", security={{"sanctum":{}}}, @OA\Response(response=200, description="Compte réactivé")) */
    public function activer(User $user, Request $request)
    {
        $user->update([
            'actif'                     => true,
            'nb_tentatives_echec'       => 0,
            'compte_verrouille_jusqu_a' => null,
        ]);

        $this->journal->ecrire(
            user:        $request->user(),
            action:      'activation_compte',
            module:      'users',
            description: "Réactivation du compte [{$user->login}]",
            request:     $request,
        );

        return response()->json(['message' => 'Compte réactivé avec succès.']);
    }

    /** @OA\Patch(path="/api/v1/users/{id}/verrouiller", tags={"Utilisateurs"}, summary="Verrouiller manuellement un compte", security={{"sanctum":{}}}, @OA\Response(response=200, description="Compte verrouillé")) */
    public function verrouiller(User $user, Request $request)
    {
        if ($user->id_user === $request->user()->id_user) {
            return response()->json(['message' => 'Impossible de verrouiller votre propre compte.'], 403);
        }

        $user->update([
            'compte_verrouille_jusqu_a' => now()->addHours(24),
        ]);
        $user->tokens()->delete();

        $this->journal->ecrire(
            user:        $request->user(),
            action:      'verrouillage_manuel',
            module:      'users',
            description: "Verrouillage manuel du compte [{$user->login}] pour 24h",
            request:     $request,
        );

        return response()->json(['message' => 'Compte verrouillé pour 24 heures.']);
    }

    /** @OA\Post(path="/api/v1/users/{id}/reinitialiser-mdp", tags={"Utilisateurs"}, summary="Réinitialiser le mot de passe", security={{"sanctum":{}}}, @OA\Response(response=200, description="Mot de passe réinitialisé par email")) */
    public function reinitialiserMotDePasse(User $user, Request $request)
    {
        // Générer un mot de passe temporaire conforme à la politique
        $nouveauMdp = 'Uvci@' . strtoupper(substr(md5(uniqid()), 0, 4)) . rand(10, 99);

        $user->update([
            'mot_de_passe_hash'          => Hash::make($nouveauMdp),
            'mot_de_passe_change_requis' => true,
            'nb_tentatives_echec'        => 0,
            'compte_verrouille_jusqu_a'  => null,
        ]);
        $user->tokens()->delete(); // Forcer reconnexion

        // TODO : envoyer par email → $user->notify(new MotDePasseReinitialise($nouveauMdp));
        // En attendant la configuration SMTP, retourner uniquement à l'admin en session sécurisée
        $this->journal->ecrire(
            user:        $request->user(),
            action:      'reinitialisation_mdp',
            module:      'users',
            description: "Réinitialisation du mot de passe de [{$user->login}]",
            request:     $request,
        );

        return response()->json([
            'message'           => 'Mot de passe réinitialisé. À communiquer à l\'utilisateur par canal sécurisé.',
            'mot_de_passe_temp' => $nouveauMdp,
        ]);
    }
}
