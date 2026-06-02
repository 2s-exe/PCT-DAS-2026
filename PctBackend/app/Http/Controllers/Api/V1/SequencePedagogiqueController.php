<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\SequencePedagogique;

class SequencePedagogiqueController extends Controller
{
    public function index()
    {
        return SequencePedagogique::with('cours', 'ressources')
            ->orderBy('ordre_sequence')
            ->paginate(15);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'titre_sequence' => 'required|string|max:255',
            'ordre_sequence' => 'required|integer|min:1',
            'description'    => 'nullable|string',
            'id_cours'       => 'required|exists:cours,id_cours',
        ]);

        return response()->json(SequencePedagogique::create($validated), 201);
    }

    public function show(SequencePedagogique $sequence)
    {
        return response()->json($sequence->load('cours', 'ressources'));
    }

    public function update(Request $request, SequencePedagogique $sequence)
    {
        $validated = $request->validate([
            'titre_sequence' => 'sometimes|string|max:255',
            'ordre_sequence' => 'sometimes|integer|min:1',
            'description'    => 'nullable|string',
            'id_cours'       => 'sometimes|exists:cours,id_cours',
        ]);

        $sequence->update($validated);
        return response()->json($sequence);
    }

    public function destroy(SequencePedagogique $sequence)
    {
        $sequence->delete();
        return response()->json(['message' => 'Séquence supprimée.']);
    }
}
