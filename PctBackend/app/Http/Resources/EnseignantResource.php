<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EnseignantResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id_enseignant' => $this->id_enseignant,
            'nom' => $this->nom,
            'prenom' => $this->prenom,
            'email' => $this->email,
            'telephone' => $this->telephone,
            'grade' => $this->grade,
            'statut' => $this->statut,
            'taux_horaire' => $this->taux_horaire,
            'id_departement' => $this->id_departement,
            'actif' => $this->actif,
            'departement' => $this->whenLoaded('departement'),
            'utilisateur' => $this->whenLoaded('utilisateur'),
            'attributions' => $this->whenLoaded('attributions'),
            'volumes_horaires' => $this->whenLoaded('volumesHoraires'),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
