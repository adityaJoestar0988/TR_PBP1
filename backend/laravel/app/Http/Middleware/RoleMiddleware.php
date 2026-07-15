<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user('api');

        if (! $user || ! $user->is_active) {
            return response()->json([
                'message' => 'Anda tidak memiliki akses ke resource ini.',
            ], 403);
        }

        foreach ($roles as $role) {
            if ($role === 'owner' && in_array($user->role, ['owner', 'admin'], true)) {
                return $next($request);
            }

            if ($role === $user->role) {
                return $next($request);
            }
        }

        return response()->json([
            'message' => 'Anda tidak memiliki akses ke resource ini.',
        ], 403);
    }
}