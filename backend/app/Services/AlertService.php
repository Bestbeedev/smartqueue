<?php

namespace App\Services;

use App\Models\Ticket;
use App\Models\User;
use App\Models\UserAlertPreference;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;

class AlertService
{
    // Default speeds in km/h (configurable via settings later)
    const SPEEDS = [
        'walking' => 5,
        'motorcycle' => 30,
        'car' => 25,
    ];

    /**
     * Check if alert should be triggered for a ticket.
     * Condition: wait_time <= travel_time + margin
     */
    public function shouldTriggerAlert(Ticket $ticket, float $userLat, float $userLng): bool
    {
        $user = $ticket->user;
        $preferences = UserAlertPreference::getForUser($user->id);
        
        // Get remaining wait time from ticket ETA
        $waitTimeMinutes = $ticket->eta_minutes ?? 0;
        
        // Get travel time based on user's preferred transport mode
        $travelTimeMinutes = $this->calculateTravelTime(
            $userLat,
            $userLng,
            $ticket->service->establishment->lat,
            $ticket->service->establishment->lng,
            $preferences->preferred_transport_mode
        );
        
        // Get configured margin
        $marginMinutes = $preferences->margin_minutes;
        
        // Alert condition: wait_time <= travel_time + margin
        $shouldAlert = $waitTimeMinutes <= ($travelTimeMinutes + $marginMinutes);
        
        Log::info('Alert check', [
            'ticket_id' => $ticket->id,
            'wait_time' => $waitTimeMinutes,
            'travel_time' => $travelTimeMinutes,
            'margin' => $marginMinutes,
            'should_alert' => $shouldAlert,
        ]);
        
        return $shouldAlert;
    }

    /**
     * Calculate travel time between coordinates.
     */
    public function calculateTravelTime(
        float $fromLat,
        float $fromLng,
        float $toLat,
        float $toLng,
        string $transportMode = 'motorcycle'
    ): int {
        $distance = $this->haversineDistance($fromLat, $fromLng, $toLat, $toLng);
        $speed = self::SPEEDS[$transportMode] ?? self::SPEEDS['motorcycle'];
        
        // Time = Distance / Speed, convert hours to minutes
        return (int) round(($distance / $speed) * 60);
    }

    /**
     * Calculate distance using Haversine formula.
     * @return float Distance in kilometers
     */
    public function haversineDistance(
        float $fromLat,
        float $fromLng,
        float $toLat,
        float $toLng
    ): float {
        $earthRadius = 6371; // km
        
        $dLat = deg2rad($toLat - $fromLat);
        $dLng = deg2rad($toLng - $fromLng);
        
        $a = sin($dLat / 2) * sin($dLat / 2) +
             cos(deg2rad($fromLat)) * cos(deg2rad($toLat)) *
             sin($dLng / 2) * sin($dLng / 2);
        
        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));
        
        return $earthRadius * $c;
    }

    /**
     * Send alert to user based on their preferences.
     */
    public function sendAlert(Ticket $ticket, float $userLat, float $userLng): void
    {
        $user = $ticket->user;
        $preferences = UserAlertPreference::getForUser($user->id);
        
        // Calculate travel time for the message
        $travelTime = $this->calculateTravelTime(
            $userLat,
            $userLng,
            $ticket->service->establishment->lat,
            $ticket->service->establishment->lng,
            $preferences->preferred_transport_mode
        );
        
        $message = "Votre tour approche ! Position: {$ticket->position}, temps de trajet estimé: {$travelTime} min.";
        
        // Send via push notification if enabled
        if ($preferences->hasPushChannel()) {
            $this->sendPushNotification($user, $message, $ticket->id);
        }
        
        // Send via SMS if enabled
        if ($preferences->hasSmsChannel() && $preferences->phone_number) {
            $this->sendSms($preferences->phone_number, $message);
        }
    }

    /**
     * Send push notification.
     */
    protected function sendPushNotification(User $user, string $message, int $ticketId): void
    {
        // Get user's FCM tokens from devices
        $tokens = $user->devices()->whereNotNull('fcm_token')->pluck('fcm_token');
        
        if ($tokens->isEmpty()) {
            Log::warning('No FCM tokens for user', ['user_id' => $user->id]);
            return;
        }
        
        // Send via FCM (implementation depends on your FCM setup)
        // This would typically use Laravel Notification or direct FCM API
        Log::info('Push notification sent', [
            'user_id' => $user->id,
            'ticket_id' => $ticketId,
            'tokens_count' => $tokens->count(),
        ]);
    }

    /**
     * Send SMS.
     */
    protected function sendSms(string $phoneNumber, string $message): void
    {
        // SMS implementation (Twilio, Africa's Talking, etc.)
        Log::info('SMS sent', [
            'phone' => $phoneNumber,
            'message' => $message,
        ]);
    }

    /**
     * Check and send alerts for all active tickets.
     * Called by scheduler or queue worker.
     */
    public function processAlerts(): int
    {
        $alertCount = 0;
        
        // Get all active tickets with their users and establishments
        $activeTickets = Ticket::with(['user', 'service.establishment'])
            ->where('status', 'waiting')
            ->whereNotNull('eta_minutes')
            ->get();
        
        foreach ($activeTickets as $ticket) {
            // Get user's last known location from ticket or device
            $lastLat = $ticket->last_lat ?? $ticket->user->last_lat ?? null;
            $lastLng = $ticket->last_lng ?? $ticket->user->last_lng ?? null;
            
            if (!$lastLat || !$lastLng) {
                continue;
            }
            
            if ($this->shouldTriggerAlert($ticket, $lastLat, $lastLng)) {
                $this->sendAlert($ticket, $lastLat, $lastLng);
                $alertCount++;
            }
        }
        
        return $alertCount;
    }
}
