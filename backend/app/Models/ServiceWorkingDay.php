<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ServiceWorkingDay extends Model
{
    protected $fillable = [
        'service_id',
        'day_of_week',
        'is_open',
        'opening_time',
        'closing_time',
    ];

    protected $casts = [
        'day_of_week' => 'integer',
        'is_open' => 'boolean',
    ];

    public function service()
    {
        return $this->belongsTo(Service::class);
    }
}
