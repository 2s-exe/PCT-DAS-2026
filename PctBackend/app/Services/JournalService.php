<?php

namespace App\Services;

use App\Models\JournalAction;
use App\Models\SessionConnexion;
use App\Models\User;
use Illuminate\Http\Request;

class JournalService
{
    /**
     * Enregistre une action dans le journal d'audit.
     */
    public function ecrire(
        User|null  $user,
        string     $action,
        string     $module,
        string     $description,
        array|null $avant   = null,
        array|null $apres   = null,
        Request|null $request = null,
        string     $statut  = 'succes',
    ): JournalAction {
        return JournalAction::create([
            'id_user'       => $user?->id_user,
            'action'        => $action,
            'module'        => $module,
            'description'   => $description,
            'donnees_avant' => $avant,
            'donnees_apres' => $apres,
            'adresse_ip'    => $request?->ip(),
            'user_agent'    => $request ? substr($request->userAgent() ?? '', 0, 255) : null,
            'statut'        => $statut,
            'created_at'    => now(),
        ]);
    }

    /**
     * Ouvre une session de connexion et retourne son ID pour fermeture ultérieure.
     */
    public function ouvrirSession(User $user, Request $request, int $tokenId): SessionConnexion
    {
        // Marquer les anciennes sessions comme expirées (nettoyage passif)
        SessionConnexion::where('id_user', $user->id_user)
            ->where('statut', 'active')
            ->where('date_connexion', '<', now()->subHours(8))
            ->update(['statut' => 'expiree', 'date_deconnexion' => now()]);

        return SessionConnexion::create([
            'id_user'        => $user->id_user,
            'token_id'       => $tokenId,
            'adresse_ip'     => $request->ip(),
            'user_agent'     => substr($request->userAgent() ?? '', 0, 255),
            'date_connexion' => now(),
            'statut'         => 'active',
        ]);
    }

    /**
     * Ferme une session à la déconnexion.
     */
    public function fermerSession(User $user, int $tokenId): void
    {
        SessionConnexion::where('id_user', $user->id_user)
            ->where('token_id', $tokenId)
            ->where('statut', 'active')
            ->update([
                'statut'             => 'revoquee',
                'date_deconnexion'   => now(),
            ]);
    }

    /**
     * Enregistre une tentative de connexion échouée.
     */
    public function tentativeEchouee(string $login, Request $request): void
    {
        $this->ecrire(
            user:        null,
            action:      'login_echec',
            module:      'auth',
            description: "Tentative de connexion échouée pour le login [{$login}]",
            request:     $request,
            statut:      'echec',
        );
    }
}
