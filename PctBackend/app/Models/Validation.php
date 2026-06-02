<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Validation extends Model
{
    protected $primaryKey = 'id_validation';
    protected $fillable = ['statut_validation', 'date_validation', 'observations', 'id_volume', 'id_validateur'];
    protected $casts = ['date_validation' => 'datetime'];
 
    public function volume()
    {
        return $this->belongsTo(VolumeHoraire::class, 'id_volume', 'id_volume');
    }
 
    public function validateur()
    {
        return $this->belongsTo(User::class, 'id_validateur', 'id_user');
    }

}
