<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\RessourcePedagogique;

class RessourcePedagogiqueController extends Controller
{
    public function index()
    {
        return RessourcePedagogique::with('sequence')
            ->orderBy('titre_ressource')
            ->paginate(15);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'titre_ressource'   => 'required|string|max:255',
            'type_ressource'    => 'required|in:textuel,video,document,quiz,activite,evaluation',
            'niveau_complexite' => 'required|integer|between:1,3',
            'type_operation'    => 'required|in:conception,mise_a_jour',
            'description'       => 'nullable|string',
            'id_sequence'       => 'required|exists:sequences_pedagogiques,id_sequence',
        ]);

        return response()->json(RessourcePedagogique::create($validated), 201);
    }

    public function show(RessourcePedagogique $ressource)
    {
        return response()->json($ressource->load('sequence'));
    }

    public function update(Request $request, RessourcePedagogique $ressource)
    {
        $validated = $request->validate([
            'titre_ressource'   => 'sometimes|string|max:255',
            'type_ressource'    => 'sometimes|in:textuel,video,document,quiz,activite,evaluation',
            'niveau_complexite' => 'sometimes|integer|between:1,3',
            'type_operation'    => 'sometimes|in:conception,mise_a_jour',
            'description'       => 'nullable|string',
            'id_sequence'       => 'sometimes|exists:sequences_pedagogiques,id_sequence',
        ]);

        $ressource->update($validated);
        return response()->json($ressource);
    }

    public function destroy(RessourcePedagogique $ressource)
    {
        $ressource->delete();
        return response()->json(['message' => 'Ressource supprimée.']);
    }
}
