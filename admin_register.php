<?php
/**
 * Admin Registration Processing
 */
require_once 'connection.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
    exit();
}

$name = isset($_POST['name']) ? trim($_POST['name']) : '';
$age = isset($_POST['age']) ? intval($_POST['age']) : 0;
$holding_number = isset($_POST['holding_number']) ? trim($_POST['holding_number']) : '';
$phone = isset($_POST['phone']) ? trim($_POST['phone']) : '';
$password = isset($_POST['password']) ? trim($_POST['password']) : '';

// Validation
$errors = [];

if (empty($name)) {
    $errors[] = 'Name is required';
}

if ($age < 18 || $age > 100) {
    $errors[] = 'Age must be between 18 and 100';
}

if (empty($phone) || !preg_match('/^01[0-9]{9}$/', $phone)) {
    $errors[] = 'Valid 11-digit phone number is required';
}

if (strlen($password) < 6) {
    $errors[] = 'Password must be at least 6 characters';
}

if (!empty($errors)) {
    echo json_encode(['success' => false, 'message' => implode(', ', $errors)]);
    exit();
}

$conn = getDatabaseConnection();
if ($conn === null) {
    echo json_encode(['success' => false, 'message' => 'Database connection failed']);
    exit();
}

try {
    // Check if phone already exists
    $check_sql = "SELECT id FROM admin_users WHERE phone = :phone LIMIT 1";
    $check_stmt = $conn->prepare($check_sql);
    $check_stmt->execute([':phone' => $phone]);
    
    if ($check_stmt->fetch()) {
        echo json_encode(['success' => false, 'message' => 'Phone number already registered']);
        exit();
    }
    
    // Hash password
    $hashed_password = password_hash($password, PASSWORD_DEFAULT);
    
    // Insert new admin
    $sql = "INSERT INTO admin_users (name, age, holding_number, phone, password) 
            VALUES (:name, :age, :holding_number, :phone, :password)";
    
    $stmt = $conn->prepare($sql);
    $stmt->execute([
        ':name' => $name,
        ':age' => $age,
        ':holding_number' => $holding_number,
        ':phone' => $phone,
        ':password' => $hashed_password
    ]);
    
    echo json_encode([
        'success' => true,
        'message' => 'Admin account created successfully!',
        'redirect' => 'admin.html'
    ]);
    
} catch (PDOException $e) {
    error_log("Registration Error: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Registration failed. Please try again.']);
}

