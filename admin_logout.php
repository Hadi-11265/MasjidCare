<?php
/**
 * Admin Logout
 */
require_once 'connection.php';

// Destroy session
session_unset();
session_destroy();
// Clear session cookie
if (isset($_COOKIE[session_name()])) {
    setcookie(session_name(), '', time()-3600, '/');
}

// Redirect to home
header('Location: index.html');
exit();?>
