<?php

namespace App\Http\Controllers;

use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Foundation\Validation\ValidatesRequests;
use Illuminate\Routing\Controller as BaseController;

/**
 * @OA\Info(
 *     title="Gestion Heures UVCI API",
 *     version="1.0.0",
 *     description="Documentation de l'API de gestion des heures"
 * )
 *
 * @OA\Server(
 *     url="http://localhost:8000",
 *     description="Serveur local"
 * )
 */
class Controller extends BaseController
{
    use AuthorizesRequests, ValidatesRequests;
}
