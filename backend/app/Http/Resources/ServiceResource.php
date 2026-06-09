<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ServiceResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'status' => $this->status,
            'opening_time' => $this->opening_time,
            'closing_time' => $this->closing_time,
            'avg_service_time_minutes' => (int) $this->avg_service_time_minutes,
            // Nombre de personnes en attente si chargé via withCount
            'people_waiting' => isset($this->people_waiting) ? (int) $this->people_waiting : null,
            // Nombre d'agents assignés si chargé via withCount
            'agents_count' => isset($this->agents_count) ? (int) $this->agents_count : null,
            // Jours ouvrables avec horaires (fallback sur opening_time/closing_time du service)
            'working_days' => $this->whenLoaded('workingDays', function () {
                return $this->workingDays->map(fn($wd) => [
                    'day_of_week' => $wd->day_of_week,
                    'is_open'     => $wd->is_open,
                    'opening_time' => $wd->opening_time,
                    'closing_time' => $wd->closing_time,
                ])->values();
            }),
            // Etablissement parent (résumé)
            'establishment' => $this->whenLoaded('establishment', function () {
                return [
                    'id' => $this->establishment->id,
                    'name' => $this->establishment->name,
                ];
            }),
        ];
    }
}
