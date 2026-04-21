<?php
$host = "ndvi-viewer-db.c1cyk648kke8.us-east-1.rds.amazonaws.com";
$usuario = "root";
$clave = "astya935*";
$bd = "kurobri";

$conn = new mysqli($host, $usuario, $clave, $bd);
if ($conn->connect_error) {
    die("Error de conexión: " . $conn->connect_error);
}
?>