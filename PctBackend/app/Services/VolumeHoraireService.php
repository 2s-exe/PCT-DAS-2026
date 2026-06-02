<?php

namespace App\Services;

use App\Models\ActivitePedagogique;
use App\Models\Attribution;
use App\Models\VolumeHoraire;

class VolumeHoraireService
{
    /**
     * Recalcule et sauvegarde le volume horaire d'un enseignant pour une année.
     * Appelé automatiquement après chaque création/modif/suppression d'activité.
     */
    public function recalculer(int $idEnseignant, int $idAnnee): VolumeHoraire
    {
        // 1. Récupérer toutes les attributions de l'enseignant pour cette année
        $attributionIds = Attribution::where('id_enseignant', $idEnseignant)
                                     ->where('id_annee', $idAnnee)
                                     ->pluck('id_attribution');

        // 2. Somme des volumes horaires réalisés (activités)
        $heuresRealisees = ActivitePedagogique::whereIn('id_attribution', $attributionIds)
                                              ->where('id_annee', $idAnnee)
                                              ->whereIn('statut', ['soumis', 'valide'])
                                              ->sum('volume_horaire');

        // 3. Somme des heures prévues (charge horaire des cours attribués)
        $heuresPrevues = Attribution::where('id_enseignant', $idEnseignant)
                                    ->where('id_annee', $idAnnee)
                                    ->sum('charge_horaire');

        // 4. Heures complémentaires = réalisées - prévues (peut être négatif)
        $heuresComplementaires = max(0, $heuresRealisees - $heuresPrevues);

        // 5. Créer ou mettre à jour le volume
        return VolumeHoraire::updateOrCreate(
            ['id_enseignant' => $idEnseignant, 'id_annee' => $idAnnee],
            [
                'heures_prevues'         => $heuresPrevues,
                'heures_realisees'       => $heuresRealisees,
                'heures_complementaires' => $heuresComplementaires,
            ]
        );
    }
}
