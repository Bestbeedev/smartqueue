<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Establishment;
use App\Models\Ticket;
use App\Models\User;

class Service extends Model
{
    // Colonnes autorisées en écriture
    protected $fillable = [
        'establishment_id',
        'name',
        'avg_service_time_minutes',
        'status',
        'priority_support',
        'capacity',
    ];

    // Relations
    public function establishment()
    {
        // Ce service appartient à un établissement
        return $this->belongsTo(Establishment::class);
    }

    public function tickets()
    {
        // Un service possède plusieurs tickets
        return $this->hasMany(Ticket::class);
    }

    public function agents()
    {
        return $this->belongsToMany(User::class, 'agent_service')->withTimestamps();
    }

    // Scopes pratiques
    public function scopeOpen($q)
    {
        return $q->where('status', 'open');
    }
}
