<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Departement extends Model
{
    protected $primaryKey = 'id_departement';
    protected $fillable = ['nom_departement', 'responsable'];
 
    public function enseignants()
    {
        return $this->hasMany(Enseignant::class, 'id_departement', 'id_departement');
    }
}
