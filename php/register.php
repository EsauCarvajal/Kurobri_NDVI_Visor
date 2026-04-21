<?php
include("db.php");

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $nombre = $_POST["nombre"];
    $finca = $_POST['finca'] ?? 'final'; // elegir entre 'final' o 'nuevo'
    $correo = $_POST["correo"];
    $contraseña = password_hash($_POST["clave"], PASSWORD_DEFAULT);

    $sql = "INSERT INTO usuarios (nombre,finca, correo, contraseña) VALUES ('$nombre', '$finca', '$correo', '$contraseña')";

    if ($conn->query($sql) === TRUE) {
        header("Location: login.php");
        exit();
    } else {
        echo "Error: " . $sql . "<br>" . $conn->error;
    }
}
?>

<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Crear cuenta</title>
    <link rel="stylesheet" href="style.css">
    <link rel="icon" type="image/png" href="Logo.png">
</head>
<body>
    <div class="principal">
        <img src="Logo.png" alt="Logo" class="Main" />
        <div class="container">
            <h1 class="reg-log">Registrarse</h1>
            <div class="form-container">
                <?php if (isset($error)) echo "<p style='color: red;'>$error</p>"; ?>
                <form method="POST" class="form">
                    <input type="text" name="nombre" placeholder="Nombre completo" id= "form" required >
                    <select name="finca" class="lista" required>
                        <option value="final">La Navarra</option>
                        <option value="nuevo">La Toyosa</option>
                    </select>
                    <input type="email" name="correo" placeholder="Correo electrónico" id= "form" required>
                    <input type="password" name="clave" placeholder="Contraseña" id= "form" required>
                    <button type="submit" class="btn">Registrarse</button>
                </form>
            </div>
            <p class="cuenta">¿Ya tienes una cuenta? <a href="login.php" id="login-link">Inicia sesión aquí</a></p>
        </div>
        <img src="Logo girado.png" alt="Logo" class="Main" />
    </div>
    <script>
        document.getElementById('login-link').addEventListener('click', function(e) {
            e.preventDefault();
            document.body.classList.add('fade-out');
            setTimeout(function() {
                window.location.href = 'login.php';
            }, 500); // Duración igual a la animación
        });
    </script>
</body>
</html>

