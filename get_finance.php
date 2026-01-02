<?php
/**
 * Get Finance Data (Income/Expense)
 */
require_once 'connection.php';

header('Content-Type: application/json');

$type = isset($_GET['type']) ? $_GET['type'] : '';

if (!in_array($type, ['income', 'expense'])) {
    echo json_encode([
        'success' => false,
        'message' => 'Invalid type. Must be "income" or "expense"'
    ]);
    exit();
}

$conn = getDatabaseConnection();
if ($conn === null) {
    echo json_encode([
        'success' => false,
        'message' => 'Database connection failed'
    ]);
    exit();
}

try {
    if ($type === 'income') {
        $sql = "SELECT id, source, amount, date, description, created_at 
                FROM income 
                ORDER BY date DESC, created_at DESC";
    } else {
        $sql = "SELECT id, category, amount, date, description, created_at 
                FROM expenses 
                ORDER BY date DESC, created_at DESC";
    }
    
    $stmt = $conn->prepare($sql);
    $stmt->execute();
    $data = $stmt->fetchAll();
    
    echo json_encode([
        'success' => true,
        'data' => $data,
        'count' => count($data)
    ]);
    
} catch (PDOException $e) {
    error_log("Get Finance Error: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Failed to retrieve data'
    ]);
}
?>
