<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    | Autorise les requêtes cross-origin vers l'API Laravel.
    | Le frontend (Vercel) et le mobile (Expo) doivent pouvoir appeler l'API.
    |
    | En production, remplacer '*' par les domaines exacts :
    |   'allowed_origins' => ['https://smartqueue-app.vercel.app'],
    |
    | Pour lire ces valeurs depuis .env :
    |   CORS_ALLOWED_ORIGINS=https://smartqueue-app.vercel.app,https://autre-domaine.com
    */

    'paths' => ['api/*', 'broadcasting/auth', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => array_filter(
        explode(',', env('CORS_ALLOWED_ORIGINS', '*'))
    ),

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    /*
    | supports_credentials doit être true pour que Sanctum (cookies) fonctionne.
    | Si true, allowed_origins NE PEUT PAS être ['*'] — il faut des domaines explicites.
    | Laissé à false ici car on utilise des tokens Bearer (pas de cookies).
    */
    'supports_credentials' => false,

];
