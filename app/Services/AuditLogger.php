<?php

namespace App\Services;

use App\Models\AuditLog;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;

class AuditLogger
{
    /**
     * Log a security or activity event.
     */
    public static function log(string $action, ?string $resourceType = null, ?string $resourceId = null, array $payload = []): AuditLog
    {
        // Sanitize payload to remove passwords or sensitive connection strings
        $sanitizedPayload = self::sanitize($payload);

        return AuditLog::create([
            'user_id' => Auth::id(),
            'action' => $action,
            'resource_type' => $resourceType,
            'resource_id' => $resourceId,
            'payload' => $sanitizedPayload,
            'ip_address' => Request::ip(),
            'user_agent' => Request::userAgent(),
        ]);
    }

    /**
     * Strip sensitive data from logs.
     */
    private static function sanitize(array $payload): array
    {
        $sensitiveKeys = ['pass', 'password', 'key', 'secret', 'token', 'authorization'];
        
        array_walk_recursive($payload, function (&$value, $key) use ($sensitiveKeys) {
            if (in_array(strtolower($key), $sensitiveKeys)) {
                $value = '********';
            }
        });

        return $payload;
    }
}
