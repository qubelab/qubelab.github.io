<?php
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // Set your email address where you want to receive messages
    $to = "lewis.antill@g.skku.edu"; // Replace with your actual email

    // Get form inputs and sanitize them
    $name = htmlspecialchars(strip_tags($_POST["name"]));
    $email = filter_var($_POST["email"], FILTER_SANITIZE_EMAIL);
    $subject = htmlspecialchars(strip_tags($_POST["subject"]));
    $message = htmlspecialchars(strip_tags($_POST["message"]));

    // Validate fields
    if (empty($name) || empty($email) || empty($subject) || empty($message)) {
        echo "error";
        exit;
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        echo "invalid_email";
        exit;
    }

    // Email headers
    $headers = "From: $name <$email>\r\n";
    $headers .= "Reply-To: $email\r\n";
    $headers .= "Content-Type: text/plain; charset=UTF-8\r\n";

    // Email body
    $body = "Name: $name\n";
    $body .= "Email: $email\n\n";
    $body .= "Message:\n$message\n";

    // Send email
    if (mail($to, $subject, $body, $headers)) {
        echo "success"; // Will be used by JavaScript to show success message
    } else {
        echo "error";
    }
} else {
    echo "error";
}
?>
