<?php

namespace App\Http\Controllers\Api\Saas;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MonitoringController extends Controller
{
    public function overview(Request $request)
    {
        $establishments = DB::table('establishments')->count();
        $servicesOpen = DB::table('services')->where('status', 'open')->count();
        $servicesClosed = DB::table('services')->where('status', 'closed')->count();

        $countersOpen = DB::table('counters')->where('status', 'open')->count();
        $countersClosed = DB::table('counters')->where('status', 'closed')->count();

        $ticketsWaiting = DB::table('tickets')->where('status', 'waiting')->count();
        $ticketsCalled = DB::table('tickets')->where('status', 'called')->count();
        $ticketsAbsent = DB::table('tickets')->where('status', 'absent')->count();

        $subscriptionsByStatus = DB::table('subscriptions')
            ->selectRaw('status, COUNT(*) as n')
            ->groupBy('status')
            ->pluck('n', 'status');

        return response()->json([
            'establishments' => (int) $establishments,
            'services' => [
                'open' => (int) $servicesOpen,
                'closed' => (int) $servicesClosed,
            ],
            'counters' => [
                'open' => (int) $countersOpen,
                'closed' => (int) $countersClosed,
            ],
            'tickets' => [
                'waiting' => (int) $ticketsWaiting,
                'called' => (int) $ticketsCalled,
                'absent' => (int) $ticketsAbsent,
            ],
            'subscriptions_by_status' => $subscriptionsByStatus,
        ]);
    }
}
