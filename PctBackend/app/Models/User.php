<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    use HasApiTokens, HasRoles;

    protected $primaryKey = 'id_user';
    protected $fillable = [
        'login', 'mot_de_passe_hash', 'id_enseignant', 'id_profil', 'actif',
        'mot_de_passe_change_requis', 'nb_tentatives_echec',
        'compte_verrouille_jusqu_a', 'created_by',
    ];
    protected $hidden = ['mot_de_passe_hash', 'remember_token'];
    protected $casts = [
        'actif'                      => 'boolean',
        'mot_de_passe_change_requis' => 'boolean',
        'derniere_connexion'         => 'datetime',
        'compte_verrouille_jusqu_a'  => 'datetime',
        'nb_tentatives_echec'        => 'integer',
    ];

    // Sanctum attend la colonne "password"
    public function getAuthPassword(): string
    {
        return $this->mot_de_passe_hash;
    }

    public function profil()
    {
        return $this->belongsTo(Profil::class, 'id_profil', 'id_profil');
    }

    public function enseignant()
    {
        return $this->belongsTo(Enseignant::class, 'id_enseignant', 'id_enseignant');
    }

    public function createur()
    {
        return $this->belongsTo(User::class, 'created_by', 'id_user');
    }

    public function journalActions()
    {
        return $this->hasMany(JournalAction::class, 'id_user', 'id_user');
    }

    public function sessions()
    {
        return $this->hasMany(SessionConnexion::class, 'id_user', 'id_user');
    }

    // Raccourci : $user->role retourne le libellé du profil
    public function getRoleAttribute(): string
    {
        return $this->profil?->libelle_profil ?? '';
    }

    public function estVerrouille(): bool
    {
        return $this->compte_verrouille_jusqu_a !== null
            && $this->compte_verrouille_jusqu_a->isFuture();
    }
}
