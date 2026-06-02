<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class JournalAction extends Model
{
    protected $table      = 'journal_actions';
    protected $primaryKey = 'id_journal';
    public    $timestamps = false; // on gère created_at manuellement

    protected $fillable = [
        'id_user', 'action', 'module', 'description',
        'donnees_avant', 'donnees_apres',
        'adresse_ip', 'user_agent', 'statut',
    ];

    protected $casts = [
        'donnees_avant' => 'array',
        'donnees_apres' => 'array',
        'created_at'    => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'id_user', 'id_user')
                    ->withDefault(['login' => 'Système']);
    }
}
