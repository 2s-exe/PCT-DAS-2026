<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\ActivitePedagogique;
use App\Models\AnneeAcademique;
use App\Models\Attribution;
use App\Models\Departement;
use App\Models\Enseignant;
use App\Models\VolumeHoraire;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    /**
     * Tableau de bord global (admin / secrétaire).
     * Retourne les statistiques agrégées pour l'année académique active.
     */
    public function global(Request $request)
    {
        $annee = AnneeAcademique::active()->first();

        if (!$annee) {
            return response()->json([
                'total_enseignants'       => 0,
                'permanents'              => 0,
                'vacataires'              => 0,
                'heures_prevues'          => 0,
                'heures_realisees'        => 0,
                'heures_complementaires'  => 0,
                'activites_en_attente'    => 0,
                'annee_active'            => null,
                'par_departement'         => [],
            ]);
        }

        $totalEnseignants = Enseignant::where('actif', true)->count();
        $permanents       = Enseignant::where('actif', true)->where('statut', 'Permanent')->count();
        $vacataires       = Enseignant::where('actif', true)->where('statut', 'Vacataire')->count();

        $volumes = VolumeHoraire::where('id_annee', $annee->id_annee)->get();

        $heuresPrevues         = $volumes->sum('heures_prevues');
        $heuresRealisees       = $volumes->sum('heures_realisees');
        $heuresComplementaires = $volumes->sum('heures_complementaires');

        $activitesEnAttente = ActivitePedagogique::where('id_annee', $annee->id_annee)
            ->where('statut', 'soumis')
            ->count();

        // Agrégats par département
        $parDepartement = Departement::with(['enseignants' => fn($q) => $q->where('actif', true)])
            ->get()
            ->map(function ($dept) use ($annee) {
                $idEnseignants = $dept->enseignants->pluck('id_enseignant');

                $vols = VolumeHoraire::where('id_annee', $annee->id_annee)
                    ->whereIn('id_enseignant', $idEnseignants)
                    ->get();

                return [
                    'departement'            => $dept->nom_departement,
                    'nb_enseignants'         => $idEnseignants->count(),
                    'heures_prevues'         => $vols->sum('heures_prevues'),
                    'heures_realisees'       => $vols->sum('heures_realisees'),
                    'heures_complementaires' => $vols->sum('heures_complementaires'),
                ];
            })
            ->filter(fn($d) => $d['nb_enseignants'] > 0)
            ->values();

        return response()->json([
            'total_enseignants'       => $totalEnseignants,
            'permanents'              => $permanents,
            'vacataires'              => $vacataires,
            'heures_prevues'          => $heuresPrevues,
            'heures_realisees'        => $heuresRealisees,
            'heures_complementaires'  => $heuresComplementaires,
            'activites_en_attente'    => $activitesEnAttente,
            'annee_active'            => $annee->libelle_annee,
            'par_departement'         => $parDepartement,
        ]);
    }

    /**
     * Espace personnel de l'enseignant connecté.
     */
    public function monEspace(Request $request)
    {
        $user       = $request->user()->load('enseignant.departement');
        $enseignant = $user->enseignant;

        if (!$enseignant) {
            return response()->json(['message' => 'Aucun profil enseignant associé à ce compte.'], 403);
        }

        $annee = AnneeAcademique::active()->first();

        // Attributions de l'enseignant pour l'année active avec volumes
        $attributions = Attribution::with(['cours'])
            ->where('id_enseignant', $enseignant->id_enseignant)
            ->when($annee, fn($q) => $q->where('id_annee', $annee->id_annee))
            ->get()
            ->map(function ($attr) {
                $vol = VolumeHoraire::where('id_enseignant', $attr->id_enseignant)
                    ->where('id_annee', $attr->id_annee)
                    ->first();

                return [
                    'id_attribution'  => $attr->id_attribution,
                    'cours'           => $attr->cours,
                    'charge_horaire'  => $attr->charge_horaire,
                    'volumeHoraire'   => $vol ? [
                        'heures_prevues'         => $vol->heures_prevues,
                        'heures_realisees'       => $vol->heures_realisees,
                        'heures_complementaires' => $vol->heures_complementaires,
                    ] : null,
                ];
            });

        $volumeGlobal = VolumeHoraire::where('id_enseignant', $enseignant->id_enseignant)
            ->when($annee, fn($q) => $q->where('id_annee', $annee->id_annee))
            ->first();

        return response()->json([
            'enseignant'               => $enseignant->load('departement'),
            'annee_active'             => $annee?->libelle_annee,
            'total_heures_prevues'     => $volumeGlobal?->heures_prevues     ?? 0,
            'total_heures_realisees'   => $volumeGlobal?->heures_realisees   ?? 0,
            'heures_complementaires'   => $volumeGlobal?->heures_complementaires ?? 0,
            'attributions'             => $attributions,
        ]);
    }
}
