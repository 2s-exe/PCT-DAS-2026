<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreCoursRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'code_cours'     => 'required|string|max:20|unique:cours,code_cours',
            'intitule'       => 'required|string|max:200',
            'credits'        => 'required|integer|min:1',
            'niveau'         => 'required|string|max:50',
            'semestre'       => 'required|in:S1,S2,S3,S4,S5,S6',
            'id_departement' => 'required|exists:departements,id_departement',
        ];
    }

    public function messages(): array
    {
        return [
            'code_cours.unique'       => 'Ce code cours existe déjà.',
            'semestre.in'             => 'Semestre invalide : S1 à S6.',
            'id_departement.exists'   => 'Le département n\'existe pas.',
        ];
    }
}