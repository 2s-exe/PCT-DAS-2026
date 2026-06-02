<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ActivitePedagogique extends Model
{
    protected $table = 'activites_pedagogiques';
    protected $primaryKey = 'id_activite';
    protected $fillable = [
        'id_ressource', 'nb_seances', 'date_activite',
        'volume_horaire', 'statut', 'observations', 'id_attribution', 'id_annee'
    ];
    protected $casts = [
        'date_activite' => 'date',
        'volume_horaire' => 'decimal:2',
        'nb_seances' => 'integer',
    ];

    protected $appends = ['vhtc'];

    public function getVhtcAttribute(): float
    {
        return (float) $this->volume_horaire;
    }
 
    public function attribution()
    {
        return $this->belongsTo(Attribution::class, 'id_attribution', 'id_attribution');
    }
 
    public function annee()
    {
        return $this->belongsTo(AnneeAcademique::class, 'id_annee', 'id_annee');
    }

    public function ressource()
    {
        return $this->belongsTo(RessourcePedagogique::class, 'id_ressource', 'id_ressource');
    }
}
