<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RessourcePedagogique extends Model
{
    use HasFactory;

    protected $table = 'ressources_pedagogiques';
    protected $primaryKey = 'id_ressource';
    protected $fillable = [
        'titre_ressource',
        'type_ressource',
        'niveau_complexite',
        'type_operation',
        'description',
        'id_sequence',
    ];

    public function sequence()
    {
        return $this->belongsTo(SequencePedagogique::class, 'id_sequence', 'id_sequence');
    }

    public function activites()
    {
        return $this->hasMany(ActivitePedagogique::class, 'id_ressource', 'id_ressource');
    }
}
