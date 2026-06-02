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
        Schema::create('validations', function (Blueprint $table) {
            $table->id('id_validation');
            $table->enum('statut_validation', ['en_attente', 'valide', 'rejete'])->default('en_attente');
            $table->timestamp('date_validation')->nullable();
            $table->text('observations')->nullable();
            $table->foreignId('id_volume')
                ->constrained('volumes_horaires', 'id_volume')
                ->onDelete('cascade');
            $table->foreignId('id_validateur')
                ->constrained('users', 'id_user')
                ->onDelete('restrict');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('validations');
    }
};
