<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Establishment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportExportController extends Controller
{
    /**
     * Export d'activité (tickets) au format CSV pour un établissement.
     * Query: from, to, service_id?, counter_id?
     */
    public function activityCsv(Establishment $establishment, Request $request)
    {
        $scopedId = $request->attributes->get('scoped_establishment_id');
        if ($scopedId && (int) $establishment->id !== (int) $scopedId) {
            abort(403, 'Forbidden establishment scope');
        }

        $from = $request->query('from') ? now()->parse($request->query('from')) : now()->subDays(7);
        $to = $request->query('to') ? now()->parse($request->query('to')) : now();

        $serviceId = $request->query('service_id');
        $counterId = $request->query('counter_id');

        $serviceIds = DB::table('services')
            ->where('establishment_id', $establishment->id)
            ->pluck('id')
            ->all();

        $query = DB::table('tickets')
            ->whereIn('service_id', $serviceIds)
            ->whereBetween('created_at', [$from, $to])
            ->orderBy('created_at');

        if (is_numeric($serviceId)) {
            $query->where('service_id', (int) $serviceId);
        }
        if (is_numeric($counterId)) {
            $query->where('counter_id', (int) $counterId);
        }

        $filename = 'activity_establishment_'.$establishment->id.'_'.$from->format('Ymd').'-'.$to->format('Ymd').'.csv';

        return response()->streamDownload(function () use ($query) {
            $out = fopen('php://output', 'w');

            fputcsv($out, [
                'ticket_id',
                'number',
                'service_id',
                'counter_id',
                'user_id',
                'status',
                'priority',
                'position',
                'created_at',
                'called_at',
                'absent_at',
                'closed_at',
            ]);

            $query->select([
                'id',
                'number',
                'service_id',
                'counter_id',
                'user_id',
                'status',
                'priority',
                'position',
                'created_at',
                'called_at',
                'absent_at',
                'closed_at',
            ])->chunk(1000, function ($rows) use ($out) {
                foreach ($rows as $r) {
                    fputcsv($out, [
                        $r->id,
                        $r->number,
                        $r->service_id,
                        $r->counter_id,
                        $r->user_id,
                        $r->status,
                        $r->priority,
                        $r->position,
                        $r->created_at,
                        $r->called_at,
                        $r->absent_at,
                        $r->closed_at,
                    ]);
                }
            });

            fclose($out);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }
}
