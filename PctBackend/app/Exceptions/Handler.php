<?php

namespace App\Exceptions;

use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Throwable;

class Handler extends ExceptionHandler
{
    /**
     * A list of exception types with their corresponding custom log levels.
     *
     * @var array<class-string<\Throwable>, \Psr\Log\LogLevel::*>
     */
    protected $levels = [
        //
    ];

    /**
     * A list of the exception types that are not reported.
     *
     * @var array<int, class-string<\Throwable>>
     */
    protected $dontReport = [
        //
    ];

    /**
     * A list of the inputs that are never flashed to the session on validation exceptions.
     *
     * @var array<int, string>
     */
    protected $dontFlash = [
        'current_password',
        'password',
        'password_confirmation',
    ];

    /**
     * Register the exception handling callbacks for the application.
     */
    public function register(): void
    {
        $this->reportable(function (Throwable $e) {
            //
        });
    }

    public function render($request, Throwable $e)
    {
        if ($request->is('api/*')) {
            if ($e instanceof ValidationException) {
                return response()->json([
                    'message' => $e->getMessage(),
                    'errors' => $e->errors(),
                ], Response::HTTP_UNPROCESSABLE_ENTITY);
            }

            if ($e instanceof ModelNotFoundException) {
                return response()->json([
                    'message' => 'Ressource introuvable.',
                ], Response::HTTP_NOT_FOUND);
            }

            $status = $this->statusCodeFor($e);
            $message = $e->getMessage() ?: Response::$statusTexts[$status] ?? 'Erreur';

            if ($status === Response::HTTP_INTERNAL_SERVER_ERROR && ! config('app.debug')) {
                $message = 'Erreur serveur.';
            }

            return response()->json([
                'message' => $message,
            ], $status);
        }

        return parent::render($request, $e);
    }

    private function statusCodeFor(Throwable $e): int
    {
        if ($e instanceof AuthenticationException) {
            return Response::HTTP_UNAUTHORIZED;
        }

        if ($e instanceof HttpExceptionInterface) {
            return $e->getStatusCode();
        }

        return Response::HTTP_INTERNAL_SERVER_ERROR;
    }
}
