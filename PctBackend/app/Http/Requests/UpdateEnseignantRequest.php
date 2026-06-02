<?php

namespace App\Http\Requests;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateEnseignantRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        $enseignant = $this->route('enseignant');
        $id = $enseignant?->id_enseignant ?? $enseignant;
        $userId = User::where('id_enseignant', $id)->value('id_user');

        return [
            'nom'            => 'sometimes|string|max:100',
            'prenom'         => 'sometimes|string|max:100',
            'email'          => ['sometimes', 'email', 'regex:/^[A-Za-z0-9._%+-]+@uvci\.edu\.ci$/i', Rule::unique('enseignants', 'email')->ignore($id, 'id_enseignant')],
            'telephone'      => 'nullable|string|max:20',
            'grade'          => 'sometimes|in:Assistant,Maitre-Assistant,Professeur',
            'statut'         => 'sometimes|in:Permanent,Vacataire',
            'taux_horaire'   => 'sometimes|numeric|min:0',
            'id_departement' => 'sometimes|exists:departements,id_departement',
            'login'          => ['sometimes', 'nullable', 'email', 'regex:/^[A-Za-z0-9._%+-]+@uvci\.edu\.ci$/i', 'max:255', Rule::unique('users', 'login')->ignore($userId, 'id_user')],
            'password'       => 'sometimes|nullable|string|min:8',
        ];
    }

    public function messages(): array
    {
        return [
            'email.regex' => 'L\'email doit respecter le domaine institutionnel @uvci.edu.ci.',
            'login.regex' => 'Le login doit respecter le domaine institutionnel @uvci.edu.ci.',
        ];
    }
}
