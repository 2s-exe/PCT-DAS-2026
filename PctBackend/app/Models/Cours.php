<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Cours extends Model
{
    protected $primaryKey = 'id_cours';
    protected $fillable = [
        'intitule_ecue', 'niveau', 'semestre',
        'credit_ecue', 'code_specialite', 'charge_horaire_annuel'
    ];
 
    public function attributions()
    {
        return $this->hasMany(Attribution::class, 'id_cours', 'id_cours');
    }
}
