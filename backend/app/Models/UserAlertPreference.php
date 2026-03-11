<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserAlertPreference extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'channels',
        'margin_minutes',
        'margin_option',
        'enable_safety_alert',
        'phone_number',
        'preferred_transport_mode',
    ];

    protected $casts = [
        'channels' => 'array',
        'enable_safety_alert' => 'boolean',
    ];

    /**
     * Get the user that owns these preferences.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get default preferences for a new user.
     */
    public static function getDefaults(): array
    {
        return [
            'channels' => ['push'],
            'margin_minutes' => 10,
            'margin_option' => '10',
            'enable_safety_alert' => false,
            'phone_number' => null,
            'preferred_transport_mode' => 'motorcycle',
        ];
    }

    /**
     * Get or create preferences for a user.
     */
    public static function getForUser(int $userId): self
    {
        return self::firstOrCreate(
            ['user_id' => $userId],
            self::getDefaults()
        );
    }

    /**
     * Check if SMS channel is enabled.
     */
    public function hasSmsChannel(): bool
    {
        return in_array('sms', $this->channels ?? []);
    }

    /**
     * Check if push channel is enabled.
     */
    public function hasPushChannel(): bool
    {
        return in_array('push', $this->channels ?? []);
    }
}
