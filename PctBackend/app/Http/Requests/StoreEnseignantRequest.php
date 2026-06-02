<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreEnseignantRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'nom'            => 'required|string|max:100',
            'prenom'         => 'required|string|max:100',
            'email'          => ['required', 'email', 'regex:/^[A-Za-z0-9._%+-]+@uvci\.edu\.ci$/i', 'unique:enseignants,email'],
            'telephone'      => 'nullable|string|max:20',
            'grade'          => 'required|in:Assistant,Maitre-Assistant,Professeur',
            'statut'         => 'required|in:Permanent,Vacataire',
            'taux_horaire'   => 'required|numeric|min:0',
            'id_departement' => 'required|exists:departements,id_departement',
            'login'          => ['nullable', 'email', 'regex:/^[A-Za-z0-9._%+-]+@uvci\.edu\.ci$/i', 'max:255', 'unique:users,login'],
            'password'       => 'nullable|string|min:8',
        ];
    }

    public function messages(): array
    {
        return [
            'nom.required'              => 'Le nom est obligatoire.',
            'prenom.required'           => 'Le prénom est obligatoire.',
            'email.required'            => 'L\'email est obligatoire.',
            'email.regex'               => 'L\'email doit respecter le domaine institutionnel @uvci.edu.ci.',
            'email.unique'              => 'Cet email est déjà utilisé.',
            'login.regex'               => 'Le login doit respecter le domaine institutionnel @uvci.edu.ci.',
            'grade.in'                  => 'Grade invalide : Assistant, Maitre-Assistant ou Professeur.',
            'statut.in'                 => 'Statut invalide : Permanent ou Vacataire.',
            'taux_horaire.required'     => 'Le taux horaire est obligatoire.',
            'id_departement.required'   => 'Le département est obligatoire.',
            'id_departement.exists'     => 'Le département sélectionné n\'existe pas.',
        ];
    }
}
