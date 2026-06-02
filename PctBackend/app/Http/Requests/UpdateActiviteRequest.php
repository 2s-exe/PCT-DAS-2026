<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateActiviteRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'type_activite'  => 'sometimes|in:Cours,TD,TP,Examen,Rattrapage',
            'volume_horaire' => 'sometimes|numeric|min:0.5',
            'date_activite'  => 'sometimes|date',
            'observations'   => 'nullable|string|max:500',
        ];
    }
}
