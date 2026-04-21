<?php
session_start();
include("db.php");

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $correo = $_POST["correo"];
    $contraseña = $_POST["clave"];

    $correo = mysqli_real_escape_string($conn, $correo);
    $contraseña = mysqli_real_escape_string($conn, $contraseña);

    $query = "SELECT * FROM usuarios WHERE correo='$correo'";
    $result = mysqli_query($conn, $query);
    $user = mysqli_fetch_assoc($result);

    if ($user && password_verify($contraseña, $user["contraseña"])) {
        $_SESSION["nombre"] = $user["nombre"];
        $_SESSION["id"] = $user["id"];
        $_SESSION["finca"] = $user["finca"];
        $_SESSION["is_admin"] = $user["is_admin"];
        header("Location: NDVI.php");
        exit();
    } else {
        $error = "Correo o contraseña incorrectos.";
    }
}
?>

<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Iniciar sesión</title>
    <link rel="stylesheet" href="style.css">
    <link rel="icon" type="image/png" href="Logo.png">
</head>
<body>
    <header class="topbar">
        <img src="brand.png" alt="Logo" class="logo" />
    </header>  
    <div class="container">
        <h1 class="reg-log">Iniciar sesión</h1>
        <div class ="form-container">
            <?php if (isset($error)) echo "<p style='color: red;'>$error</p>"; ?>
            <form method="POST" class="form">
                <input type="email" name="correo" placeholder="Correo electrónico" id= "form" required>
                <input type="password" name="clave" placeholder="Contraseña" id= "form" required>
                <button type="submit" class="btn">Entrar</button>
            </form>
        </div>
        <p class="cuenta">¿No tienes una cuenta? <a href="register.php" id="login-link">Regístrate aquí</a></p>
    </div>
    <script>
        document.getElementById('login-link').addEventListener('click', function(e) {
            e.preventDefault();
            document.body.classList.add('fade-out');
            setTimeout(function() {
                window.location.href = 'register.php';
            }, 500); // Duración igual a la animación
        });
    </script>
</body>
</html>