<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ParamCalcul extends Model
{
    protected $primaryKey = 'id_parametre';
    protected $fillable = ['type_operation', 'niveau_complexite', 'coefficient_vhn', 'description'];
}
