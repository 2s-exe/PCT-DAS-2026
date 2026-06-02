<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Attribution extends Model
{
    protected $table = 'attribution';
    protected $primaryKey = 'id_attribution';
    protected $fillable = ['id_enseignant', 'id_cours', 'id_annee', 'charge_horaire', 'date_attribution'];
    protected $casts = ['date_attribution' => 'date'];
 
    public function enseignant()
    {
        return $this->belongsTo(Enseignant::class, 'id_enseignant', 'id_enseignant');
    }
 
    public function cours()
    {
        return $this->belongsTo(Cours::class, 'id_cours', 'id_cours');
    }
 
    public function annee()
    {
        return $this->belongsTo(AnneeAcademique::class, 'id_annee', 'id_annee');
    }
 
    public function activites()
    {
        return $this->hasMany(ActivitePedagogique::class, 'id_attribution', 'id_attribution');
    }
}
