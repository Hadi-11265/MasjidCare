<?php

require_once 'connection.php';

header('Content-Type: application/json');

// Check if user is logged in as admin
$is_admin = isset($_SESSION['admin_logged_in']) && $_SESSION['admin_logged_in'] === true;

echo json_encode([
    'is_admin' => $is_admin,
    'admin_name' => $is_admin ? ($_SESSION['admin_name'] ?? 'Admin') : null,
    'admin_id' => $is_admin ? ($_SESSION['admin_id'] ?? null) : null
]);
?>
