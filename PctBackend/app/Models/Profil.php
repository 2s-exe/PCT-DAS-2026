<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Profil extends Model
{
    protected $primaryKey = 'id_profil';
    protected $fillable = ['libelle_profil', 'description', 'permissions'];
    protected $casts = ['permissions' => 'array'];
 
    public function utilisateurs()
    {
        return $this->hasMany(User::class, 'id_profil', 'id_profil');
    }
}
