<?php

define('DB_HOST', 'sql310.infinityfree.com');
define('DB_USER', 'if0_40809984');
define('DB_PASS', '09ZCI8QHciyp2');
define('DB_NAME', 'if0_40809984_masjid_management');
define('DB_CHARSET', 'utf8mb4');


function getDatabaseConnection() {
    try {
        $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ];
        
        $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        return $pdo;
    } catch (PDOException $e) {
        // Log error and return user-friendly message
        error_log("Database Connection Error: " . $e->getMessage());
        return null;
    }
}

// Test Database Connection
function testDatabaseConnection() {
    $conn = getDatabaseConnection();
    if ($conn === null) {
        return [
            'success' => false,
            'message' => 'Database connection failed. Please check XAMPP MySQL service.'
        ];
    }
    return [
        'success' => true,
        'message' => 'Database connected successfully!'
    ];
}

// Session Management
session_start();

// Timezone Setting
date_default_timezone_set('Asia/Dhaka');

