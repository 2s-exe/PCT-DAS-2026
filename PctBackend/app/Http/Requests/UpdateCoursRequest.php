<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateCoursRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        $id = $this->route('cour'); // Laravel met "cour" par défaut
        return [
            'code_cours'     => 'sometimes|string|max:20|unique:cours,code_cours,' . $id . ',id_cours',
            'intitule'       => 'sometimes|string|max:200',
            'credits'        => 'sometimes|integer|min:1',
            'niveau'         => 'sometimes|string|max:50',
            'semestre'       => 'sometimes|in:S1,S2,S3,S4,S5,S6',
            'id_departement' => 'sometimes|exists:departements,id_departement',
        ];
    }
}