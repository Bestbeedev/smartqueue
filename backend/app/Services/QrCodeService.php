<?php

namespace App\Services;

use App\Models\Service;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;
use SimpleSoftwareIO\QrCode\Facades\QrCode;

class QrCodeService
{
    /**
     * Génère un QR code permanent pour un service.
     * Le QR code encode l'URL: vqs://service/{service_uuid}
     * 
     * @param Service $service
     * @return array{token: string, url: string, generated_at: \Illuminate\Support\Carbon}
     */
    public function generateForService(Service $service): array
    {
        // Générer un nouveau token UUID (invalide l'ancien si existe)
        $token = (string) Str::uuid();
        
        // Construire l'URL du QR code: vqs://service/{uuid}
        $qrContent = "vqs://service/{$token}";
        
        // Générer l'image QR code en PNG haute résolution
        $qrImage = QrCode::format('png')
            ->size(1024) // Haute résolution pour impression
            ->margin(2)
            ->errorCorrection('H') // Haute tolérance aux erreurs
            ->generate($qrContent);
        
        // Stocker l'image
        $filename = "qr-codes/service-{$service->id}-{$token}.png";
        Storage::disk('public')->put($filename, $qrImage);
        
        $url = Storage::disk('public')->url($filename);
        $generatedAt = now();
        
        // Mettre à jour le service
        $service->update([
            'qr_code_token' => $token,
            'qr_code_url' => $url,
            'qr_generated_at' => $generatedAt,
        ]);
        
        return [
            'token' => $token,
            'url' => $url,
            'generated_at' => $generatedAt,
            'content' => $qrContent,
        ];
    }
    
    /**
     * Récupère les informations du QR code d'un service.
     * 
     * @param Service $service
     * @return array|null
     */
    public function getServiceQrInfo(Service $service): ?array
    {
        if (!$service->qr_code_token) {
            return null;
        }
        
        return [
            'token' => $service->qr_code_token,
            'url' => $service->qr_code_url,
            'generated_at' => $service->qr_generated_at,
            'content' => "vqs://service/{$service->qr_code_token}",
            'service_name' => $service->name,
            'establishment_name' => $service->establishment?->name,
        ];
    }
    
    /**
     * Parse une URL de QR code VQS pour extraire le token du service.
     * Format attendu: vqs://service/{uuid}
     * 
     * @param string $qrContent
     * @return string|null UUID du service
     */
    public function parseQrContent(string $qrContent): ?string
    {
        // Parser l'URL vqs://service/{uuid}
        if (preg_match('/^vqs:\/\/service\/([a-f0-9-]{36})$/i', $qrContent, $matches)) {
            return $matches[1];
        }
        
        // Support aussi le format web: https://app.vqs.com/s/{uuid}
        if (preg_match('/^https?:\/\/[^\/]+\/s\/([a-f0-9-]{36})$/i', $qrContent, $matches)) {
            return $matches[1];
        }
        
        return null;
    }
    
    /**
     * Trouve un service par son token QR.
     * 
     * @param string $token
     * @return Service|null
     */
    public function findServiceByToken(string $token): ?Service
    {
        return Service::where('qr_code_token', $token)->first();
    }
    
    /**
     * Génère un PDF prêt à imprimer avec le QR code.
     * 
     * @param Service $service
     * @return string PDF content
     */
    public function generatePrintablePdf(Service $service): string
    {
        if (!$service->qr_code_url) {
            throw new \Exception('QR code non généré pour ce service');
        }
        
        // Pour l'instant, retourner l'image PNG
        // TODO: Implémenter avec une lib PDF (dompdf, tcpdf, etc.)
        $path = str_replace(Storage::disk('public')->url(''), '', $service->qr_code_url);
        return Storage::disk('public')->get($path);
    }
}
