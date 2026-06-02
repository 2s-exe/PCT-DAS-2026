<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens;
 
    protected $primaryKey = 'id_user';
    protected $fillable = ['login', 'mot_de_passe_hash', 'id_enseignant', 'id_profil', 'actif'];
    protected $hidden = ['mot_de_passe_hash', 'remember_token'];
    protected $casts = ['actif' => 'boolean', 'derniere_connexion' => 'datetime'];
 
    // Sanctum attend la colonne "password"
    public function getAuthPassword() { return $this->mot_de_passe_hash; }
 
    public function profil()
    {
        return $this->belongsTo(Profil::class, 'id_profil', 'id_profil');
    }
 
    public function enseignant()
    {
        return $this->belongsTo(Enseignant::class, 'id_enseignant', 'id_enseignant');
    }
 
    // Raccourci pratique : $user->role === 'admin'
    public function getRoleAttribute(): string
    {
        return $this->profil?->libelle_profil ?? '';
    }

}
