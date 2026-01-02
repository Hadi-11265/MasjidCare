<?php
require_once 'connection.php';
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'POST Method Required']);
    exit();
}

$conn = getDatabaseConnection();
if ($conn === null) {
    echo json_encode(['success' => false, 'message' => 'Database Connection Failed']);
    exit();
}

$donation_type = trim($_POST['donation_type'] ?? '');
$amount = floatval($_POST['amount'] ?? 0);
$payment_method = trim($_POST['payment_method'] ?? '');
$mobile_number = trim($_POST['mobile_number'] ?? '');
$transaction_id = trim($_POST['transaction_id'] ?? '');
$timestamp = $_POST['timestamp'] ?? date('Y-m-d H:i:s');

$errors = [];
if (empty($donation_type)) $errors[] = 'Donation type required';
if ($amount < 10) $errors[] = 'Minimum 10 BDT required';
if (empty($payment_method)) $errors[] = 'Payment method required';
if (empty($mobile_number)) $errors[] = 'Mobile number required';
if (empty($transaction_id)) $errors[] = 'Transaction ID required';

if (!empty($errors)) {
    echo json_encode(['success' => false, 'message' => implode(', ', $errors)]);
    exit();
}

try {
    $sql = "INSERT INTO donations (donation_type, amount, payment_method, mobile_number, transaction_id, timestamp, status) 
            VALUES (:donation_type, :amount, :payment_method, :mobile_number, :transaction_id, :timestamp, 'Completed')";
    
    $stmt = $conn->prepare($sql);
    $stmt->execute([
        ':donation_type' => $donation_type,
        ':amount' => $amount,
        ':payment_method' => $payment_method,
        ':mobile_number' => $mobile_number,
        ':transaction_id' => $transaction_id,
        ':timestamp' => $timestamp
    ]);
    
    $income_sql = "INSERT INTO income (source, amount, date, description) 
                   VALUES (:source, :amount, :date, :description)";
    $income_stmt = $conn->prepare($income_sql);
    $income_stmt->execute([
        ':source' => $donation_type,
        ':amount' => $amount,
        ':date' => date('Y-m-d', strtotime($timestamp)),
        ':description' => $payment_method . ' - ' . $mobile_number
    ]);
    
    echo json_encode([
        'success' => true,
        'message' => 'Donation Saved Successfully',
        'transaction_id' => $transaction_id,
        'amount' => $amount
    ]);
} catch (PDOException $e) {
    error_log("Error: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Database Error: ' . $e->getMessage()]);
}
?>
