<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateAnneeAcademiqueRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        $id = $this->route('annee');
        return [
            'libelle_annee' => 'sometimes|string|max:20|unique:annee_academiques,libelle_annee,' . $id . ',id_annee',
            'date_debut'    => 'sometimes|date',
            'date_fin'      => 'sometimes|date|after:date_debut',
            'active'        => 'boolean',
        ];
    }
}