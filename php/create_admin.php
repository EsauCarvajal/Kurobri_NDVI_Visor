<?php
// create_admin.php (ejecutar UNA vez)
require 'db.php'; // asume que db.php te devuelve $conn
$nombre = 'Administrador';
$correo = 'admin@prueba';
$contraseña = 'admin123*';
$finca = 'final'; // admin tendrá acceso a ambas por is_admin=1, pero podemos dejar su finca por defecto
$is_admin = 1;

$hash = password_hash($contraseña, PASSWORD_DEFAULT);

$sql = "INSERT INTO usuarios (nombre, finca, correo, contraseña, is_admin) VALUES ('$nombre', '$finca', '$correo', '$hash', '$is_admin')";
$conn->query($sql);
$conn->close();
?>