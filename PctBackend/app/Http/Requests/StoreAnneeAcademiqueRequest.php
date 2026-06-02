<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreAnneeAcademiqueRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'libelle_annee' => 'required|string|max:20|unique:annee_academiques,libelle_annee',
            'date_debut'    => 'required|date',
            'date_fin'      => 'required|date|after:date_debut',
            'active'        => 'boolean',
        ];
    }

    public function messages(): array
    {
        return [
            'libelle_annee.unique' => 'Cette année académique existe déjà.',
            'date_fin.after'       => 'La date de fin doit être après la date de début.',
        ];
    }
}