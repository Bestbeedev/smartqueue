<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Service;
use App\Models\Ticket;
use App\Services\QrCodeService;
use App\Services\TicketService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;

class ServiceQrCodeController extends Controller
{
    protected QrCodeService $qrService;
    protected TicketService $ticketService;

    public function __construct(QrCodeService $qrService, TicketService $ticketService)
    {
        $this->qrService = $qrService;
        $this->ticketService = $ticketService;
    }

    /**
     * Génère un QR code permanent pour un service.
     * Admin seulement.
     * 
     * POST /api/admin/services/{service}/qr-code
     */
    public function generate(Request $request, Service $service): JsonResponse
    {
        // Vérifier que l'utilisateur est admin de l'établissement
        $user = $request->user();
        if ($user->role !== 'admin' || $user->establishment_id !== $service->establishment_id) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $result = $this->qrService->generateForService($service);

        return response()->json([
            'message' => 'QR code généré avec succès',
            'qr_code' => [
                'token' => $result['token'],
                'url' => $result['url'],
                'content' => $result['content'],
                'generated_at' => $result['generated_at']->toIso8601String(),
                'service_name' => $service->name,
                'establishment_name' => $service->establishment?->name,
            ],
        ]);
    }

    /**
     * Récupère les infos du QR code d'un service.
     * 
     * GET /api/admin/services/{service}/qr-code
     */
    public function show(Request $request, Service $service): JsonResponse
    {
        $user = $request->user();
        if ($user->role !== 'admin' || $user->establishment_id !== $service->establishment_id) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $info = $this->qrService->getServiceQrInfo($service);

        if (!$info) {
            return response()->json([
                'message' => 'Aucun QR code généré pour ce service',
                'qr_code' => null,
            ]);
        }

        return response()->json([
            'qr_code' => $info,
        ]);
    }

    /**
     * Scanne un QR code et crée un ticket pour l'usager.
     * Endpoint public (authentification requise pour créer le ticket).
     * 
     * POST /api/qr-scan
     * Body: { "qr_content": "vqs://service/{uuid}" }
     */
    public function scan(Request $request): JsonResponse
    {
        $request->validate([
            'qr_content' => 'required|string',
        ]);

        $user = $request->user();
        if (!$user) {
            return response()->json([
                'message' => 'Authentification requise',
                'action' => 'login',
                'qr_content' => $request->qr_content, // Pour reprendre après login
            ], 401);
        }

        // Parser le contenu du QR code
        $token = $this->qrService->parseQrContent($request->qr_content);
        if (!$token) {
            return response()->json([
                'message' => 'QR code invalide',
            ], 400);
        }

        // Trouver le service
        $service = $this->qrService->findServiceByToken($token);
        if (!$service) {
            return response()->json([
                'message' => 'Service non trouvé',
            ], 404);
        }

        // Vérifier si la file est ouverte
        if ($service->status !== 'open') {
            return response()->json([
                'message' => 'La file d\'attente est actuellement fermée',
                'service_name' => $service->name,
                'service_status' => $service->status,
            ], 400);
        }

        // Vérifier si l'usager a déjà un ticket actif pour ce service aujourd'hui
        $today = Carbon::today()->toDateString();
        $existingTicket = Ticket::where('service_id', $service->id)
            ->where('user_id', $user->id)
            ->where('valid_date', $today)
            ->whereIn('status', ['waiting', 'called'])
            ->first();

        if ($existingTicket) {
            // Retourner le ticket existant au lieu d'en créer un nouveau
            return response()->json([
                'message' => 'Vous avez déjà un ticket actif pour ce service',
                'ticket' => [
                    'id' => $existingTicket->id,
                    'number' => $existingTicket->number,
                    'position' => $existingTicket->position,
                    'status' => $existingTicket->status,
                    'service_name' => $service->name,
                    'created_at' => $existingTicket->created_at->toIso8601String(),
                ],
                'action' => 'show_existing',
            ]);
        }

        // Créer un nouveau ticket
        $ticket = $this->ticketService->createForQrScan($service, $user);

        return response()->json([
            'message' => 'Ticket créé avec succès',
            'ticket' => [
                'id' => $ticket->id,
                'number' => $ticket->number,
                'position' => $ticket->position,
                'status' => $ticket->status,
                'service_name' => $service->name,
                'establishment_name' => $service->establishment?->name,
                'estimated_wait_minutes' => $this->ticketService->estimateWaitTime($service, $ticket),
                'valid_date' => $ticket->valid_date,
                'created_at' => $ticket->created_at->toIso8601String(),
            ],
            'action' => 'created',
        ], 201);
    }

    /**
     * Télécharge le QR code en PNG.
     * 
     * GET /api/admin/services/{service}/qr-code/download
     */
    public function download(Request $request, Service $service)
    {
        $user = $request->user();
        if ($user->role !== 'admin' || $user->establishment_id !== $service->establishment_id) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        if (!$service->qr_code_url) {
            return response()->json(['message' => 'QR code non généré'], 404);
        }

        // Le QR code est stocké en base64 data URI
        $dataUrl = $service->qr_code_url;
        
        // Extraire le base64 du data URI
        if (!preg_match('/^data:image\/svg\+xml;base64,(.+)$/', $dataUrl, $matches)) {
            return response()->json(['message' => 'Format QR code invalide'], 400);
        }
        
        $base64 = $matches[1];
        $svgContent = base64_decode($base64);
        
        // Générer un PDF imprimable
        // DomPDF a des problèmes avec les images SVG en base64, on utilise le SVG inline
        $html = '<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>QR Code - ' . htmlspecialchars($service->name) . '</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; padding: 20mm; text-align: center; }
        .header { margin-bottom: 15mm; }
        .header h1 { font-size: 28pt; color: #333; margin-bottom: 5mm; }
        .header h2 { font-size: 18pt; color: #666; font-weight: normal; }
        .qr-container { margin: 20mm auto; padding: 10mm; border: 2px solid #333; border-radius: 10px; display: inline-block; }
        .qr-code { width: 150mm; height: 150mm; }
        .info-box { margin-top: 15mm; padding: 10mm; background-color: #f5f5f5; border-radius: 5px; text-align: left; }
        .info-box p { font-size: 12pt; color: #333; margin-bottom: 3mm; }
        .info-box .label { font-weight: bold; color: #666; }
        .footer { margin-top: 20mm; padding-top: 10mm; border-top: 1px solid #ccc; }
        .footer p { font-size: 10pt; color: #999; }
        .instructions { margin-top: 15mm; padding: 10mm; background-color: #e8f4e8; border-radius: 5px; text-align: left; }
        .instructions h3 { font-size: 14pt; color: #2d5a2d; margin-bottom: 5mm; }
        .instructions ul { margin-left: 10mm; }
        .instructions li { font-size: 11pt; color: #333; margin-bottom: 3mm; }
    </style>
</head>
<body>
    <div class="header">
        <h1>' . htmlspecialchars($service->name) . '</h1>
        <h2>' . htmlspecialchars($service->establishment?->name ?? '') . '</h2>
    </div>
    
    <div class="qr-container">
        ' . $svgContent . '
    </div>
    
    <div class="info-box">
        <p><span class="label">Service:</span> ' . htmlspecialchars($service->name) . '</p>
        <p><span class="label">Établissement:</span> ' . htmlspecialchars($service->establishment?->name ?? '') . '</p>
        <p><span class="label">Code:</span> vqs://service/' . $service->qr_code_token . '</p>
        <p><span class="label">Généré le:</span> ' . ($service->qr_generated_at?->format('d/m/Y H:i') ?? '') . '</p>
    </div>
    
    <div class="instructions">
        <h3>Instructions pour les usagers:</h3>
        <ul>
            <li>Scannez ce QR code avec l\'application SmartQueue</li>
            <li>Un ticket sera automatiquement créé pour ce service</li>
            <li>Consultez votre position dans la file d\'attente en temps réel</li>
            <li>Vous serez notifié lorsque votre tour approche</li>
        </ul>
    </div>
    
    <div class="footer">
        <p>SmartQueue - Système de gestion de files d\'attente</p>
        <p>Ce QR code est permanent et peut être utilisé chaque jour</p>
    </div>
</body>
</html>';
        
        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadHTML($html);
        $pdf->setPaper('A4', 'portrait');
        
        return $pdf->download("qr-{$service->name}-{$service->qr_code_token}.pdf");
    }
}
