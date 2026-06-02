<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AnneeAcademique extends Model
{
    protected $table = 'annees_academiques';
    protected $primaryKey = 'id_annee';
    protected $fillable = ['libelle_annee', 'date_debut', 'date_fin', 'active'];
    protected $casts = ['active' => 'boolean', 'date_debut' => 'date', 'date_fin' => 'date'];
 
    public function attributions()
    {
        return $this->hasMany(Attribution::class, 'id_annee', 'id_annee');
    }
 
    // Récupérer l'année active facilement : AnneeAcademique::active()->first()
    public function scopeActive($query)
    {
        return $query->where('active', true);
    }
}
