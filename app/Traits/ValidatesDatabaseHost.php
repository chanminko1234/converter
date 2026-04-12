<?php

namespace App\Traits;

trait ValidatesDatabaseHost
{
    /**
     * Check if a host resolves to a private or restricted IP address
     * to prevent SSRF attacks.
     */
    protected function validateHost(string $host): void
    {
        // Explicit check for common local names
        if (app()->environment() !== 'testing') {
            if (in_array(strtolower($host), ['localhost', '127.0.0.1', '::1'])) {
                throw new \Exception("Security Violation: Access to local database hosts is restricted.");
            }
        }

        $ip = gethostbyname($host);
        
        if (app()->environment() !== 'testing') {
            // Block IPv4 private ranges (10.x.x.x, 172.16-31.x.x, 192.168.x.x)
            // Block IPv4 loopback (127.x.x.x)
            // Block IPv4 link-local (169.254.x.x)
            if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4)) {
                if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) === false) {
                    throw new \Exception("Security Violation: Access to private or internal hosts is restricted.");
                }
            }

            // Block IPv6 local/private ranges
            if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV6)) {
                if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) === false) {
                    throw new \Exception("Security Violation: Access to private or internal hosts is restricted.");
                }
            }
        }

        // Explicit Cloud Metadata Service block
        if ($ip === '169.254.169.254') {
            throw new \Exception("Security Violation: Access to cloud metadata service is restricted.");
        }
    }
}
