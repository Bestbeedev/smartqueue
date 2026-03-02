<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Subscription extends Model
{
    protected $fillable = [
        'establishment_id',
        'plan',
        'status',
        'current_period_start',
        'current_period_end',
        'canceled_at',
        'meta',
    ];

    protected $casts = [
        'current_period_start' => 'datetime',
        'current_period_end' => 'datetime',
        'canceled_at' => 'datetime',
        'meta' => 'array',
    ];

    public function establishment()
    {
        return $this->belongsTo(Establishment::class);
    }
}
