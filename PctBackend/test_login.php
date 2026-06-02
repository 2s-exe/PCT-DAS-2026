<?php
require __DIR__ . '/vendor/autoload.php';

$app = require __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\Http;

$response = Http::post('http://localhost:8000/api/v1/login', [
    'login' => 'admin@uvci.edu.ci',
    'password' => 'secret123'
]);

echo $response->body();
?>
