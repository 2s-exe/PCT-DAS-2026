<?php
require __DIR__ . '/vendor/autoload.php';

$app = require __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;
use Illuminate\Support\Facades\Hash;

$user = User::create([
    'login' => 'test@example.com',
    'mot_de_passe_hash' => Hash::make('password123'),
    'actif' => true,
    'id_profil' => 1
]);

echo json_encode([
    'success' => true,
    'user_id' => $user->id_user,
    'login' => $user->login
]);
?>
