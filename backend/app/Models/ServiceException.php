<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ServiceException extends Model
{
    protected $fillable = [
        'service_id',
        'date',
        'type',
        'label',
        'is_closed',
        'starts_at',
        'ends_at',
        'recurring_yearly',
    ];

    protected $casts = [
        'date' => 'date',
        'is_closed' => 'boolean',
        'recurring_yearly' => 'boolean',
    ];

    public function service()
    {
        return $this->belongsTo(Service::class);
    }
}
