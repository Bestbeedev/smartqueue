<?php

namespace App\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use GuzzleHttp\Client;
use Illuminate\Support\Facades\Log;
use App\Models\Device;
use App\Models\NotificationLog;
use Google\Auth\Credentials\ServiceAccountCredentials;

class SendPushNotification implements ShouldQueue
{
    use Queueable;

    public function __construct(public int $userId, public string $title, public string $body, public array $data = []) {}

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $serviceAccountJson = env('FIREBASE_SERVICE_ACCOUNT_JSON');
        if (!$serviceAccountJson) {
            Log::warning('FIREBASE_SERVICE_ACCOUNT_JSON not configured; skipping push');
            return;
        }

        $serviceAccount = json_decode($serviceAccountJson, true);
        if (!is_array($serviceAccount) || empty($serviceAccount['project_id'])) {
            Log::warning('Invalid FIREBASE_SERVICE_ACCOUNT_JSON (missing project_id); skipping push');
            return;
        }
        $projectId = (string) $serviceAccount['project_id'];

        $tokens = Device::query()
            ->where('user_id', $this->userId)
            ->where('push_enabled', true)
            ->pluck('fcm_token')
            ->all();
        if (empty($tokens)) {
            Log::info('No device tokens for user '.$this->userId);
            return;
        }

        $scopes = ['https://www.googleapis.com/auth/firebase.messaging'];
        $credentials = new ServiceAccountCredentials($scopes, $serviceAccount);
        $tokenInfo = $credentials->fetchAuthToken();
        $accessToken = $tokenInfo['access_token'] ?? null;
        if (!$accessToken) {
            Log::warning('Failed to obtain Firebase access token; skipping push');
            return;
        }

        $client = new Client(['base_uri' => 'https://fcm.googleapis.com']);
        $url = '/v1/projects/'.$projectId.'/messages:send';

        $sentAny = false;
        $anyFailed = false;

        foreach (array_values($tokens) as $t) {
            $payload = [
                'message' => [
                    'token' => $t,
                    'notification' => [
                        'title' => $this->title,
                        'body' => $this->body,
                    ],
                    'data' => array_map('strval', $this->data),
                ],
            ];

            try {
                $res = $client->post($url, [
                    'headers' => [
                        'Authorization' => 'Bearer '.$accessToken,
                        'Content-Type' => 'application/json; charset=UTF-8',
                    ],
                    'json' => $payload,
                    'timeout' => 10,
                ]);
                $status = $res->getStatusCode();
                $sentAny = $sentAny || ($status >= 200 && $status < 300);
                $anyFailed = $anyFailed || !($status >= 200 && $status < 300);
            } catch (\Throwable $e) {
                $anyFailed = true;
                Log::error('FCM v1 send error: '.$e->getMessage());
            }
        }

        NotificationLog::create([
            'ticket_id' => $this->data['ticket_id'] ?? null,
            'channel' => 'push',
            'type' => $this->data['type'] ?? 'generic',
            'status' => ($sentAny && !$anyFailed) ? 'sent' : (($sentAny && $anyFailed) ? 'sent' : 'failed'),
            'payload' => [
                'project_id' => $projectId,
                'tokens' => array_values($tokens),
                'title' => $this->title,
                'body' => $this->body,
                'data' => $this->data,
            ],
            'sent_at' => $sentAny ? now() : null,
        ]);
    }
}
