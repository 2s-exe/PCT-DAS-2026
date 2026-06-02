<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreActiviteRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'id_attribution'    => 'required|exists:attributions,id_attribution',
            'id_annee'          => 'required|exists:annee_academiques,id_annee',
            'type_activite'     => 'required|in:Cours,TD,TP,Examen,Rattrapage',
            'volume_horaire'    => 'required|numeric|min:0.5',
            'date_activite'     => 'required|date',
            'observations'      => 'nullable|string|max:500',
        ];
    }

    public function messages(): array
    {
        return [
            'id_attribution.required' => 'L\'attribution est obligatoire.',
            'id_attribution.exists'   => 'L\'attribution n\'existe pas.',
            'type_activite.required'  => 'Le type d\'activité est obligatoire.',
            'type_activite.in'        => 'Type invalide : Cours, TD, TP, Examen ou Rattrapage.',
            'volume_horaire.required' => 'Le volume horaire est obligatoire.',
            'volume_horaire.min'      => 'Le volume horaire minimum est 0.5h.',
            'date_activite.required'  => 'La date est obligatoire.',
            'date_activite.date'      => 'La date est invalide.',
        ];
    }
}