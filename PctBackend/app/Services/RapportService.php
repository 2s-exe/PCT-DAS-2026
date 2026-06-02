<?php

namespace App\Services;

use App\Models\Enseignant;
use App\Models\VolumeHoraire;
use Barryvdh\DomPDF\Facade\Pdf;
use Maatwebsite\Excel\Facades\Excel;

class RapportService
{
    public function genererFicheEnseignant(Enseignant $enseignant, int $idAnnee)
    {
        $volume = VolumeHoraire::with('annee', 'validation')
            ->where('id_enseignant', $enseignant->id_enseignant)
            ->where('id_annee', $idAnnee)
            ->firstOrFail();

        $activites = \App\Models\ActivitePedagogique::with('attribution.cours')
            ->whereHas('attribution', fn($q) => $q->where('id_enseignant', $enseignant->id_enseignant))
            ->where('id_annee', $idAnnee)
            ->get();

        $pdf = Pdf::loadView('rapports.fiche_enseignant', compact('enseignant', 'volume', 'activites'));
        return $pdf->download("fiche_{$enseignant->nom}_{$enseignant->prenom}.pdf");
    }

    public function exporterExcel(int $idAnnee)
    {
        return Excel::download(new \App\Exports\VolumesHorairesExport($idAnnee), 'etat_heures.xlsx');
    }

    public function exporterPdf(int $idAnnee)
    {
        $volumes = VolumeHoraire::with('enseignant.departement', 'annee')
            ->where('id_annee', $idAnnee)
            ->get();
        $pdf = Pdf::loadView('rapports.etat_global', compact('volumes'));
        return $pdf->download('etat_global_heures.pdf');
    }
}
