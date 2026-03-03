<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\Service;

class StatsController extends Controller
{
    /**
     * Statistiques globales (période optionnelle from/to).
     */
    public function overview(Request $request)
    {
        $from = $request->query('from') ? now()->parse($request->query('from')) : now()->subDays(7);
        $to = $request->query('to') ? now()->parse($request->query('to')) : now();

        // Nombre total de tickets créés / clos / absents sur la période
        $totals = DB::table('tickets')
            ->selectRaw("COUNT(*) as created,
                SUM(CASE WHEN status='closed' THEN 1 ELSE 0 END) as closed,
                SUM(CASE WHEN status='absent' THEN 1 ELSE 0 END) as absent")
            ->whereBetween('created_at', [$from, $to])
            ->first();

        // Temps d'attente moyen (diff called_at - created_at) en minutes
        $rows = DB::table('tickets')
            ->whereNotNull('called_at')
            ->whereBetween('created_at', [$from, $to])
            ->select(['created_at','called_at'])
            ->limit(2000)
            ->get();
        $sum = 0; $n = 0;
        foreach ($rows as $r) {
            $created = \Illuminate\Support\Carbon::parse($r->created_at);
            $called = \Illuminate\Support\Carbon::parse($r->called_at);
            if ($called->greaterThan($created)) { $sum += $called->diffInMinutes($created); $n++; }
        }
        $waitAvg = $n > 0 ? (int) round($sum / $n) : null;

        return response()->json([
            'from' => $from->toDateTimeString(),
            'to' => $to->toDateTimeString(),
            'tickets' => [
                'created' => (int) ($totals->created ?? 0),
                'closed' => (int) ($totals->closed ?? 0),
                'absent' => (int) ($totals->absent ?? 0),
                'wait_avg_minutes' => $waitAvg,
            ],
        ]);
    }

    /**
     * Statistiques pour un service spécifique.
     */
    public function service(int $serviceId, Request $request)
    {
        $service = Service::findOrFail($serviceId);
        $from = $request->query('from') ? now()->parse($request->query('from')) : now()->subDays(7);
        $to = $request->query('to') ? now()->parse($request->query('to')) : now();

        $totals = DB::table('tickets')
            ->selectRaw("COUNT(*) as created,
                SUM(CASE WHEN status='closed' THEN 1 ELSE 0 END) as closed,
                SUM(CASE WHEN status='absent' THEN 1 ELSE 0 END) as absent")
            ->where('service_id', $serviceId)
            ->whereBetween('created_at', [$from, $to])
            ->first();

        // Durées de service (closed_at - called_at)
        $rows = DB::table('tickets')
            ->where('service_id', $serviceId)
            ->whereNotNull('closed_at')
            ->whereNotNull('called_at')
            ->where('closed_at', '>=', $from)
            ->select(['called_at','closed_at'])
            ->limit(2000)
            ->get();
        $sum = 0; $n = 0;
        foreach ($rows as $r) {
            $called = \Illuminate\Support\Carbon::parse($r->called_at);
            $closed = \Illuminate\Support\Carbon::parse($r->closed_at);
            if ($closed->greaterThan($called)) { $sum += $closed->diffInMinutes($called); $n++; }
        }
        $serviceAvg = $n > 0 ? (int) round($sum / $n) : (int) $service->avg_service_time_minutes;

        return response()->json([
            'service_id' => $serviceId,
            'from' => $from->toDateTimeString(),
            'to' => $to->toDateTimeString(),
            'tickets' => [
                'created' => (int) ($totals->created ?? 0),
                'closed' => (int) ($totals->closed ?? 0),
                'absent' => (int) ($totals->absent ?? 0),
                'service_time_avg_minutes' => $serviceAvg,
            ],
        ]);
    }

    /**
     * Séries temporelles (jour ou heure).
     * Query params:
     * - from/to (ISO ou Y-m-d)
     * - bucket = day|hour (default day)
     * - service_id (optionnel)
     */
    public function series(Request $request)
    {
        $from = $request->query('from') ? now()->parse($request->query('from')) : now()->subDays(14);
        $to = $request->query('to') ? now()->parse($request->query('to')) : now();
        $bucket = $request->query('bucket', 'day');
        $serviceId = $request->query('service_id') ? (int) $request->query('service_id') : null;

        if (!in_array($bucket, ['day', 'hour'], true)) {
            abort(422, 'Invalid bucket');
        }

        $expr = $bucket === 'hour'
            ? "DATE_FORMAT(created_at, '%Y-%m-%d %H:00:00')"
            : "DATE(created_at)";

        $query = DB::table('tickets')
            ->selectRaw($expr." as bucket,")
            ->selectRaw("COUNT(*) as created,")
            ->selectRaw("SUM(CASE WHEN status='closed' THEN 1 ELSE 0 END) as closed,")
            ->selectRaw("SUM(CASE WHEN status='absent' THEN 1 ELSE 0 END) as absent")
            ->whereBetween('created_at', [$from, $to]);

        if (!is_null($serviceId)) {
            $query->where('service_id', $serviceId);
        }

        $rows = $query
            ->groupBy('bucket')
            ->orderBy('bucket')
            ->get();

        $series = [];
        foreach ($rows as $r) {
            $series[] = [
                'bucket' => (string) $r->bucket,
                'created' => (int) ($r->created ?? 0),
                'closed' => (int) ($r->closed ?? 0),
                'absent' => (int) ($r->absent ?? 0),
            ];
        }

        return response()->json([
            'from' => $from->toDateTimeString(),
            'to' => $to->toDateTimeString(),
            'bucket' => $bucket,
            'service_id' => $serviceId,
            'series' => $series,
        ]);
    }
}
