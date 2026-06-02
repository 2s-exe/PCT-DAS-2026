<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreAttributionRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'id_enseignant'  => 'required|exists:enseignants,id_enseignant',
            'id_cours'       => 'required|exists:cours,id_cours',
            'id_annee'       => 'required|exists:annee_academiques,id_annee',
            'charge_horaire' => 'required|numeric|min:1',
        ];
    }

    public function messages(): array
    {
        return [
            'id_enseignant.required'  => 'L\'enseignant est obligatoire.',
            'id_enseignant.exists'    => 'L\'enseignant sélectionné n\'existe pas.',
            'id_cours.required'       => 'Le cours est obligatoire.',
            'id_cours.exists'         => 'Le cours sélectionné n\'existe pas.',
            'id_annee.required'       => 'L\'année académique est obligatoire.',
            'id_annee.exists'         => 'L\'année académique n\'existe pas.',
            'charge_horaire.required' => 'La charge horaire est obligatoire.',
            'charge_horaire.min'      => 'La charge horaire doit être au moins 1h.',
        ];
    }
}