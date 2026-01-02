<?php

require_once 'connection.php';

header('Content-Type: application/json');

// Log request details for debugging
error_log("Add Finance Request: " . json_encode([
    'method' => $_SERVER['REQUEST_METHOD'],
    'session_admin' => isset($_SESSION['admin_logged_in']) ? $_SESSION['admin_logged_in'] : 'NOT SET',
    'post_data' => $_POST
]));

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
    exit();
}

// Check if user is admin (server-side validation)
if (!isset($_SESSION['admin_logged_in']) || $_SESSION['admin_logged_in'] !== true) {
    error_log("Unauthorized access attempt");
    echo json_encode(['success' => false, 'message' => 'Unauthorized. Admin access required.']);
    exit();
}

$type = isset($_POST['type']) ? $_POST['type'] : '';
$source = isset($_POST['source']) ? trim($_POST['source']) : '';
$amount = isset($_POST['amount']) ? floatval($_POST['amount']) : 0;
$date = isset($_POST['date']) ? $_POST['date'] : '';
$description = isset($_POST['description']) ? trim($_POST['description']) : '';

// Validation
$errors = [];

if (!in_array($type, ['income', 'expense'])) {
    $errors[] = 'Invalid type';
}

if (empty($source)) {
    $errors[] = 'Source/Category is required';
}

if ($amount <= 0) {
    $errors[] = 'Amount must be greater than 0';
}

if (empty($date)) {
    $errors[] = 'Date is required';
}

if (!empty($errors)) {
    echo json_encode(['success' => false, 'message' => implode(', ', $errors)]);
    exit();
}

$conn = getDatabaseConnection();
if ($conn === null) {
    error_log("Database connection failed");
    echo json_encode(['success' => false, 'message' => 'Database connection failed']);
    exit();
}

try {
    if ($type === 'income') {
        $sql = "INSERT INTO income (source, amount, date, description) 
                VALUES (:source, :amount, :date, :description)";
    } else {
        $sql = "INSERT INTO expenses (category, amount, date, description) 
                VALUES (:category, :amount, :date, :description)";
    }
    
    error_log("Executing SQL: " . $sql . " with type: " . $type);
    
    $stmt = $conn->prepare($sql);
    
    if ($type === 'income') {
        $result = $stmt->execute([
            ':source' => $source,
            ':amount' => $amount,
            ':date' => $date,
            ':description' => $description
        ]);
    } else {
        $result = $stmt->execute([
            ':category' => $source,
            ':amount' => $amount,
            ':date' => $date,
            ':description' => $description
        ]);
    }
    
    if ($result) {
        $lastId = $conn->lastInsertId();
        error_log("Insert successful, ID: " . $lastId);
        echo json_encode([
            'success' => true,
            'message' => $type === 'income' ? 'Income added successfully' : 'Expense added successfully',
            'id' => $lastId
        ]);
    } else {
        error_log("Insert failed");
        echo json_encode(['success' => false, 'message' => 'Insert operation failed']);
    }
    
} catch (PDOException $e) {
    error_log("Add Finance Error: " . $e->getMessage() . " Code: " . $e->getCode());
    echo json_encode(['success' => false, 'message' => 'Failed to add entry: ' . $e->getMessage()]);
}
?>

