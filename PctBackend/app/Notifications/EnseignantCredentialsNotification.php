<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class EnseignantCredentialsNotification extends Notification
{
    use Queueable;

    public function __construct(
        private readonly string $login,
        private readonly string $password
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Vos identifiants PCT')
            ->greeting('Bonjour,')
            ->line('Votre compte enseignant PCT a ete cree.')
            ->line('Login : ' . $this->login)
            ->line('Mot de passe temporaire : ' . $this->password)
            ->line('Veuillez modifier votre mot de passe apres votre premiere connexion.');
    }
}
