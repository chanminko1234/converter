<?php
require 'vendor/autoload.php';

$options = ['dataMasking' => true];
$line = "INSERT INTO users (name, email, phone) VALUES ('John Doe', 'john.doe@example.com', '+1-555-0199');";

function maskSensitiveData($line, $options) {
    if (!($options['dataMasking'] ?? false)) return $line;
    $line = preg_replace_callback('/\'([^\'@\s]+)@([^\'@\s]+\.[^\'@\s]+)\'/', function($m) {
        $user = $m[1];
        $domain = $m[2];
        return "'m***k@d***n.com'";
    }, $line);
    return $line;
}

echo maskSensitiveData($line, $options);

$line2 = "INSERT INTO users (phone) VALUES ('+1-555-0199');";
function maskPhone($line, $options) {
    return preg_replace_callback('/\'(\+?[\d\s\-\.\(\)]{7,18})\'/', function($m) {
        $num = $m[1];
        if (preg_match('/\d{7,}/', $num)) {
            return "'" . substr($num, 0, strlen($num)-4) . "****'";
        }
        return $m[0];
    }, $line);
}
echo "\n" . maskPhone($line2, $options);
