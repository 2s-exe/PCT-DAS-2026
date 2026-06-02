<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ParametreCalcul extends Model
{
    use HasFactory;

    protected $table = 'param_calculs';
    protected $primaryKey = 'id_parametre';
    protected $fillable = [
        'type_operation',
        'niveau',
        'libelle_niveau',
        'heures_par_seance',
        'id_annee',
        'description',
    ];

    protected $casts = [
        'heures_par_seance' => 'decimal:2',
        'niveau' => 'integer',
    ];

    public function annee()
    {
        return $this->belongsTo(AnneeAcademique::class, 'id_annee', 'id_annee');
    }
}
