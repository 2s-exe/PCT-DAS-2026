<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Enseignant extends Model
{
    protected $primaryKey = 'id_enseignant';
    protected $fillable = [
        'nom', 'prenom', 'email', 'telephone',
        'grade', 'statut', 'taux_horaire', 'id_departement', 'actif'
    ];
    protected $casts = ['actif' => 'boolean', 'taux_horaire' => 'decimal:2'];
 
    public function departement()
    {
        return $this->belongsTo(Departement::class, 'id_departement', 'id_departement');
    }
 
    public function utilisateur()
    {
        return $this->hasOne(User::class, 'id_enseignant', 'id_enseignant');
    }
 
    public function attributions()
    {
        return $this->hasMany(Attribution::class, 'id_enseignant', 'id_enseignant');
    }
 
    public function volumesHoraires()
    {
        return $this->hasMany(VolumeHoraire::class, 'id_enseignant', 'id_enseignant');
    }
}
