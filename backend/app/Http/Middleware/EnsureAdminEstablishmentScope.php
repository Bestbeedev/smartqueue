<?php

namespace App\Http\Middleware;

use App\Models\Establishment;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureAdminEstablishmentScope
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        if (!$user) {
            abort(401, 'Unauthenticated');
        }

        if ($user->role !== 'admin') {
            return $next($request);
        }

        $estId = $user->establishment_id;
        if (empty($estId)) {
            // Onboarding: allow scoped admin to create its establishment once
            $path = '/'.ltrim((string) $request->path(), '/');
            if ($request->isMethod('POST') && $path === '/api/admin/establishments') {
                return $next($request);
            }
            abort(403, 'Admin has no establishment scope');
        }

        $routeEst = $request->route('establishment');
        if ($routeEst instanceof Establishment) {
            if ((int) $routeEst->id !== (int) $estId) {
                abort(403, 'Forbidden establishment scope');
            }
        }

        $request->attributes->set('scoped_establishment_id', (int) $estId);

        return $next($request);
    }
}
