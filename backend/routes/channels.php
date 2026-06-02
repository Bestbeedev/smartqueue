<?php

use Illuminate\Support\Facades\Broadcast;
use App\Models\Ticket;

/*
|--------------------------------------------------------------------------
| Broadcast Channels
|--------------------------------------------------------------------------
| Définition des canaux de diffusion en temps réel pour tickets et services.
| Les canaux privés et de présence sont sécurisés via une callback d'autorisation.
*/

// Canal privé pour un ticket donné: réservé au propriétaire du ticket + agents/admins
Broadcast::channel('ticket.{ticketId}', function ($user, int $ticketId) {
    // Autoriser si l'utilisateur est propriétaire du ticket ou si c'est un agent/admin
    $isOwner = Ticket::where('id', $ticketId)->where('user_id', $user->id)->exists();
    return $isOwner || in_array($user->role, ['agent','admin'], true);
});

// Canal privé pour l'utilisateur: réservé à l'utilisateur lui-même
Broadcast::channel('user.{userId}', function ($user, int $userId) {
    return (int) $user->id === (int) $userId;
});

// Canal de présence d'un service: réservé aux agents/admins.
// Les usagers doivent écouter exclusivement user.{userId} / ticket.{ticketId}
// pour éviter de recevoir des événements globaux concernant d'autres tickets.
Broadcast::channel('presence-service.{serviceId}', function ($user, int $serviceId) {
    if (in_array($user->role, ['agent','admin'], true)) {
        return ['id' => $user->id, 'name' => $user->name, 'role' => $user->role];
    }

    return false;
});
