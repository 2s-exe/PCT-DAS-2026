<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SequencePedagogique extends Model
{
    use HasFactory;

    protected $table = 'sequences_pedagogiques';
    protected $primaryKey = 'id_sequence';
    protected $fillable = [
        'titre_sequence',
        'ordre_sequence',
        'description',
        'id_cours',
    ];

    public function cours()
    {
        return $this->belongsTo(Cours::class, 'id_cours', 'id_cours');
    }

    public function ressources()
    {
        return $this->hasMany(RessourcePedagogique::class, 'id_sequence', 'id_sequence');
    }
}
