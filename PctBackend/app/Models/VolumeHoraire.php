<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class VolumeHoraire extends Model
{
    protected $table = 'volumes_horaires';
    protected $primaryKey = 'id_volume';
    protected $fillable = [
        'heures_prevues', 'heures_realisees', 'heures_complementaires',
        'id_enseignant', 'id_annee'
    ];
 
    public function enseignant()
    {
        return $this->belongsTo(Enseignant::class, 'id_enseignant', 'id_enseignant');
    }
 
    public function annee()
    {
        return $this->belongsTo(AnneeAcademique::class, 'id_annee', 'id_annee');
    }
 
    public function validation()
    {
        return $this->hasOne(Validation::class, 'id_volume', 'id_volume');
    }

}
