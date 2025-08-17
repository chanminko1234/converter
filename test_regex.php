<?php

$testLines = [
    ') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;',
    ');',
    '  ) ENGINE=InnoDB;',
    '  `name` varchar(255) NOT NULL,',
    '  PRIMARY KEY (`id`)'
];

$pattern = '/^\s*\)\s*(ENGINE|DEFAULT|AUTO_INCREMENT|COMMENT|CHARSET|COLLATE|ROW_FORMAT|KEY_BLOCK_SIZE|MAX_ROWS|MIN_ROWS|PACK_KEYS|DELAY_KEY_WRITE|CHECKSUM|PARTITION|;)/i';

foreach ($testLines as $i => $line) {
    $matches = preg_match($pattern, $line);
    echo "Line $i: '$line' -> Match: " . ($matches ? 'YES' : 'NO') . "\n";
}

echo "\n=== Testing simple ); pattern ===\n";
foreach ($testLines as $i => $line) {
    $matches = ($line === ');');
    echo "Line $i: '$line' -> Exact match ');': " . ($matches ? 'YES' : 'NO') . "\n";
}