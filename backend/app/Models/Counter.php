<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Counter extends Model
{
    protected $fillable = [
        'establishment_id',
        'name',
        'status',
        'current_agent_id',
        'opened_at',
        'closed_at',
    ];

    protected $casts = [
        'opened_at' => 'datetime',
        'closed_at' => 'datetime',
    ];

    public function establishment()
    {
        return $this->belongsTo(Establishment::class);
    }

    public function currentAgent()
    {
        return $this->belongsTo(User::class, 'current_agent_id');
    }

    public function tickets()
    {
        return $this->hasMany(Ticket::class);
    }
}
