<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Enseignant;
use Illuminate\Http\Request;
use App\Services\RapportService;

/**
 * @OA\Tag(name="Rapports", description="Génération des exports PDF et Excel")
 */
class RapportController extends Controller
{
    public function __construct(private RapportService $rapportService) {}

    /**
     * @OA\Get(path="/api/v1/rapports/global", tags={"Rapports"},
     *     summary="Export global annuel (PDF ou Excel selon ?format=pdf|excel)",
     *     security={{"sanctum":{}}},
     *     @OA\Parameter(name="format", in="query", required=false, @OA\Schema(type="string", enum={"pdf","excel"}, default="pdf")),
     *     @OA\Parameter(name="id_annee", in="query", required=false, @OA\Schema(type="integer")),
     *     @OA\Response(response=200, description="Fichier généré")
     * )
     */
    public function global(Request $request)
    {
        $format  = $request->query('format', 'pdf');
        $idAnnee = $request->query('id_annee');

        if ($format === 'excel') {
            return $this->rapportService->exporterExcel($idAnnee);
        }

        return $this->rapportService->exporterPdf($idAnnee);
    }

    /**
     * @OA\Get(path="/api/v1/rapports/enseignant/{enseignant}", tags={"Rapports"},
     *     summary="Fiche individuelle enseignant (PDF ou Excel)",
     *     security={{"sanctum":{}}},
     *     @OA\Parameter(name="enseignant", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\Parameter(name="id_annee", in="query", required=true, @OA\Schema(type="integer")),
     *     @OA\Parameter(name="format", in="query", required=false, @OA\Schema(type="string", enum={"pdf","excel"}, default="pdf")),
     *     @OA\Response(response=200, description="PDF généré", @OA\MediaType(mediaType="application/pdf"))
     * )
     */
    public function ficheEnseignant(Request $request, Enseignant $enseignant)
    {
        $idAnnee = (int) $request->query('id_annee');
        return $this->rapportService->genererFicheEnseignant($enseignant, $idAnnee);
    }
}
