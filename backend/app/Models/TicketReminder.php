<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TicketReminder extends Model
{
    protected $fillable = [
        'ticket_id',
        'user_id',
        'stage',
        'channel',
        'context',
        'sent_at',
    ];

    protected $casts = [
        'context' => 'array',
        'sent_at' => 'datetime',
    ];

    public function ticket()
    {
        return $this->belongsTo(Ticket::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
