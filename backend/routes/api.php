<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Http\Request;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DeviceController;
use App\Http\Controllers\Api\EstablishmentController;
use App\Http\Controllers\Api\ServiceController;
use App\Http\Controllers\Api\TicketController;
use App\Http\Controllers\Api\AgentTicketController;
use App\Http\Controllers\Api\AgentServiceController;
use App\Http\Controllers\Api\AgentQueueController;
use App\Http\Controllers\Api\AgentTicketActionController;
use App\Http\Controllers\Api\AgentCounterController;
use App\Http\Controllers\Api\Admin\EstablishmentController as AdminEstablishmentController;
use App\Http\Controllers\Api\Admin\ServiceController as AdminServiceController;
use App\Http\Controllers\Api\Admin\AgentController as AdminAgentController;
use App\Http\Controllers\Api\Admin\StatsController as AdminStatsController;
use App\Http\Controllers\Api\Admin\CounterController as AdminCounterController;
use App\Http\Controllers\Api\Admin\ReportExportController as AdminReportExportController;
use App\Http\Controllers\Api\Saas\EstablishmentController as SaasEstablishmentController;
use App\Http\Controllers\Api\Saas\SubscriptionController as SaasSubscriptionController;
use App\Http\Controllers\Api\Saas\MonitoringController as SaasMonitoringController;
use App\Http\Controllers\Api\OnboardingController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\NotificationPreferencesController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
| Ces routes exposent l'API REST consommée par le web (React) et mobile (Flutter).
| Elles sont groupées par domaines fonctionnels et sécurisées via Sanctum et Policies.
*/

// Authentification et gestion des devices
Route::prefix('auth')->group(function () {
    // Inscription d'un utilisateur (user/agent/admin selon workflow adm)
    Route::post('register', [AuthController::class, 'register']);
    // Connexion (retourne un token personnel pour appels API)
    Route::post('login', [AuthController::class, 'login'])->middleware('throttle:api');
    // Déconnexion (révocation du token courant)
    Route::middleware('auth:sanctum')->post('logout', [AuthController::class, 'logout']);
    // Enregistrement / mise à jour du device FCM pour notifications push
    Route::middleware('auth:sanctum')->post('devices/register', [DeviceController::class, 'register']);
});

// Onboarding SaaS (établissement -> abonnement)
Route::prefix('onboarding')->group(function () {
    Route::post('register-establishment', [OnboardingController::class, 'registerEstablishment']);
    Route::middleware('auth:sanctum')->post('subscribe', [OnboardingController::class, 'subscribe']);
});

// Établissements (public: recherche; détails: public)
Route::get('establishments', [EstablishmentController::class, 'index']); // ?lat&lng&radius
Route::get('establishments/nearby', [EstablishmentController::class, 'index']); // alias mobile: ?lat&lng&radius
Route::get('establishments/search', [EstablishmentController::class, 'search']); // ?q
Route::get('establishments/{id}', [EstablishmentController::class, 'show']);
Route::get('establishments/{id}/services', [ServiceController::class, 'byEstablishment']);

// Services (lecture publique)
Route::get('services/{id}', [ServiceController::class, 'show']);
Route::get('services/{id}/affluence', [ServiceController::class, 'affluence']);
Route::get('services/{id}/recommendations', [ServiceController::class, 'recommendations']);

// Espace utilisateur authentifié (tickets)
Route::middleware('auth:sanctum')->group(function () {
    // Profil utilisateur courant (utile front)
    Route::get('me', [OnboardingController::class, 'me']);

    // CRUD tickets utilisateur
    Route::post('tickets', [TicketController::class, 'store']);
    Route::get('tickets/me', [TicketController::class, 'active']); // alias mobile
    Route::get('tickets/active', [TicketController::class, 'active']);
    Route::get('tickets/history', [TicketController::class, 'history']);
    Route::get('tickets/{ticket}', [TicketController::class, 'show']);
    Route::patch('tickets/{ticket}', [TicketController::class, 'update']); // action=cancel

    // Notifications utilisateur
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::post('/notifications/{id}/read', [NotificationController::class, 'read']); // ou PUT si vous préférez
    Route::delete('/notifications/{id}', [NotificationController::class, 'destroy']);

    // Préférences notifications (mobile/web)
    Route::get('/notification-preferences', [NotificationPreferencesController::class, 'show']);
    Route::put('/notification-preferences', [NotificationPreferencesController::class, 'update']);
    

    // Espace agent / admin (gestion des files en temps réel)
    Route::middleware('role:agent,admin')->group(function () {
        // Appeler le prochain ticket (algorithme serveur)
        Route::post('services/{service}/call-next', [AgentTicketController::class, 'callNext']);
        // Marquer un ticket absent
        Route::post('tickets/{ticket}/mark-absent', [AgentTicketController::class, 'markAbsent']);
        // Rappeler un ticket
        Route::post('tickets/{ticket}/recall', [AgentTicketController::class, 'recall']);
        // Clôturer un service (fin de journée, incidents, etc.)
        Route::post('services/{service}/close', [AgentServiceController::class, 'close']);

        // Ouvrir un service à la volée
        Route::post('services/{service}/open', [AgentServiceController::class, 'open']);

        // Vue complète de la file (initialisation dashboard temps réel)
        Route::get('services/{service}/queue', [AgentQueueController::class, 'index']);

        // Actions ticket côté agent
        Route::post('tickets/{ticket}/close', [AgentTicketActionController::class, 'close']);
        Route::post('tickets/{ticket}/cancel', [AgentTicketActionController::class, 'cancel']);
        Route::post('tickets/{ticket}/priority', [AgentTicketActionController::class, 'setPriority']);

        // Ouverture/fermeture guichet (counter)
        Route::post('counters/{counter}/open', [AgentCounterController::class, 'open']);
        Route::post('counters/{counter}/close', [AgentCounterController::class, 'close']);
    });

    // Espace administrateur (gestion référentiel + stats)
    Route::prefix('admin')->middleware(['role:admin','admin.establishment'])->group(function () {
        Route::apiResource('establishments', AdminEstablishmentController::class);
        Route::apiResource('services', AdminServiceController::class);
        Route::apiResource('agents', AdminAgentController::class);
        Route::apiResource('counters', AdminCounterController::class);

        Route::get('stats/overview', [AdminStatsController::class, 'overview']);
        Route::get('stats/services/{serviceId}', [AdminStatsController::class, 'service']);
        Route::get('stats/series', [AdminStatsController::class, 'series']);

        // Exports
        Route::get('establishments/{establishment}/reports/activity.csv', [AdminReportExportController::class, 'activityCsv']);
    });

    // Espace super-admin SaaS (multi-établissements)
    Route::prefix('saas')->middleware('role:super_admin')->group(function () {
        Route::apiResource('establishments', SaasEstablishmentController::class);
        Route::get('subscriptions', [SaasSubscriptionController::class, 'index']);
        Route::put('establishments/{establishment}/subscription', [SaasSubscriptionController::class, 'upsert']);
        Route::get('monitoring/overview', [SaasMonitoringController::class, 'overview']);
    });
});

// Authentification pour canaux de broadcast via Sanctum (Echo auth)
Route::post('broadcasting/auth', function (Request $request) {
    return Broadcast::auth($request);
})->middleware('auth:sanctum');
