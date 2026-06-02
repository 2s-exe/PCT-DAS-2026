<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('ressources_pedagogiques', function (Blueprint $table) {
            $table->id('id_ressource');
            $table->string('titre_ressource', 255);
            $table->enum('type_ressource', ['textuel', 'video', 'document', 'quiz', 'activite', 'evaluation']);
            $table->unsignedTinyInteger('niveau_complexite');
            $table->enum('type_operation', ['conception', 'mise_a_jour']);
            $table->text('description')->nullable();
            $table->foreignId('id_sequence')
                ->constrained('sequences_pedagogiques', 'id_sequence')
                ->onDelete('cascade');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ressources_pedagogiques');
    }
};
