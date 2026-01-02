<?php
/**
 * Admin Login Processing
 */
require_once 'connection.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
    exit();
}

$phone = isset($_POST['phone']) ? trim($_POST['phone']) : '';
$password = isset($_POST['password']) ? trim($_POST['password']) : '';

error_log("Login attempt with phone: " . $phone);

if (empty($phone) || empty($password)) {
    echo json_encode(['success' => false, 'message' => 'Phone and password are required']);
    exit();
}

$conn = getDatabaseConnection();
if ($conn === null) {
    error_log("Database connection failed during login");
    echo json_encode(['success' => false, 'message' => 'Database connection failed']);
    exit();
}

try {
    $sql = "SELECT id, name, phone, password FROM admin_users WHERE phone = :phone LIMIT 1";
    $stmt = $conn->prepare($sql);
    $stmt->execute([':phone' => $phone]);
    $user = $stmt->fetch();
    
    error_log("User found: " . json_encode($user));
    
    if ($user && password_verify($password, $user['password'])) {
        // Login successful
        $_SESSION['admin_logged_in'] = true;
        $_SESSION['admin_id'] = $user['id'];
        $_SESSION['admin_name'] = $user['name'];
        $_SESSION['admin_phone'] = $user['phone'];
        
        error_log("Login successful for user: " . $user['name']);
        error_log("Session set: admin_logged_in=" . $_SESSION['admin_logged_in']);
        
        // Update last login
        $update_sql = "UPDATE admin_users SET last_login = NOW() WHERE id = :id";
        $update_stmt = $conn->prepare($update_sql);
        $update_stmt->execute([':id' => $user['id']]);
        
        echo json_encode([
            'success' => true,
            'message' => 'Login successful!',
            'admin_name' => $user['name'],
            'redirect' => 'index.html'
        ]);
    } else {
        error_log("Login failed - invalid credentials");
        echo json_encode([
            'success' => false,
            'message' => 'Invalid phone or password'
        ]);
    }
    
} catch (PDOException $e) {
    error_log("Login Error: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Login failed. Please try again.']);
}
?>
