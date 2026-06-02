<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SessionConnexion extends Model
{
    protected $table      = 'sessions_connexion';
    protected $primaryKey = 'id_session';

    protected $fillable = [
        'id_user', 'token_id', 'adresse_ip', 'user_agent',
        'date_connexion', 'date_deconnexion', 'statut',
    ];

    protected $casts = [
        'date_connexion'    => 'datetime',
        'date_deconnexion'  => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'id_user', 'id_user');
    }
}
