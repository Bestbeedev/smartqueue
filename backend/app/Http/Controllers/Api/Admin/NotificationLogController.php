<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\NotificationLog;
use Illuminate\Http\Request;

class NotificationLogController extends Controller
{
    /**
     * Liste paginée des notifications envoyées (logs).
     *
     * Query params:
     * - channel: push|sms (optionnel)
     * - status: queued|sent|failed (optionnel)
     * - type: string (optionnel)
     */
    public function index(Request $request)
    {
        $scopedId = (int) $request->attributes->get('scoped_establishment_id');

        $perPage = (int) $request->query('per_page', 50);
        $perPage = max(1, min($perPage, 100));

        $items = NotificationLog::query()
            ->with(['ticket.service.establishment'])
            ->when($scopedId > 0, function ($q) use ($scopedId) {
                $q->whereHas('ticket.service', fn ($sq) => $sq->where('establishment_id', $scopedId));
            })
            ->when($request->query('channel'), fn ($q) => $q->where('channel', $request->query('channel')))
            ->when($request->query('status'), fn ($q) => $q->where('status', $request->query('status')))
            ->when($request->query('type'), fn ($q) => $q->where('type', $request->query('type')))
            ->orderByDesc('id')
            ->paginate($perPage);

        return response()->json($items);
    }

    /**
     * Détail d'un log.
     */
    public function show(Request $request, int $id)
    {
        $scopedId = (int) $request->attributes->get('scoped_establishment_id');

        $item = NotificationLog::query()
            ->with(['ticket.service.establishment'])
            ->when($scopedId > 0, function ($q) use ($scopedId) {
                $q->whereHas('ticket.service', fn ($sq) => $sq->where('establishment_id', $scopedId));
            })
            ->findOrFail($id);

        return response()->json($item);
    }

    /**
     * Permet de modifier certaines infos du log (ex: type / payload) si besoin.
     *
     * Note: ceci n'édite pas les notifications déjà livrées côté FCM.
     * C'est surtout utile pour corriger un libellé, ou enrichir le payload pour audit.
     */
    public function update(Request $request, int $id)
    {
        $scopedId = (int) $request->attributes->get('scoped_establishment_id');

        $item = NotificationLog::query()
            ->with(['ticket.service'])
            ->when($scopedId > 0, function ($q) use ($scopedId) {
                $q->whereHas('ticket.service', fn ($sq) => $sq->where('establishment_id', $scopedId));
            })
            ->findOrFail($id);

        $data = $request->validate([
            'type' => ['sometimes', 'string', 'max:32'],
            'payload' => ['sometimes', 'array'],
        ]);

        $item->update($data);
        return response()->json($item->fresh());
    }
}
