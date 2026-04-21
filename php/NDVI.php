<?php
session_start();
if (!isset($_SESSION['nombre'])) {
    header("Location: login.php");
    exit();
}
$user_finca = $_SESSION['finca'] ?? 'final';
$is_admin = !empty($_SESSION['is_admin']) ? 1 : 0;
?>

<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>NDVI Viewer - Kurobri (demo)</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <link rel="stylesheet" href="style.css" />
  <!-- OpenLayers -->
  <script src="https://cdn.jsdelivr.net/npm/ol@v7.3.0/dist/ol.js"></script>
  <link href="https://cdn.jsdelivr.net/npm/ol@v7.3.0/ol.css" rel="stylesheet" />
  <!-- Try to load geotiff UMD build from CDN (dist-browser). If CDN fails, app.js will try fallback to local file. -->
  <script src="https://cdn.jsdelivr.net/npm/geotiff/dist-browser/geotiff.js"></script>
  <!-- shpjs to load shapefiles in browser if needed -->
  <script src="https://unpkg.com/shpjs@latest/dist/shp.min.js"></script>
  <link rel="icon" type="image/png" href="Logo.png">
</head>
<body>
  <header class="topbar">
    <a href="NDVI.php">
      <img src="brand.png" alt="Logo" class="logo" />
    </a>
    <div class="user-container">
      <div class="user" id="user-menu-btn"><?php echo htmlspecialchars($_SESSION['nombre']); ?></div>
      <div class="user-dropdown" id="user-dropdown" style="display:none;">
        <ul>
          <li><a href="logout.php">Cerrar sesión</a></li>
        </ul>
      </div>
    </div>
  </header>
  <main>
    <section class="selector">
      <?php
      // Mapa de códigos internos -> nombres amigables
      $finca_map = [
        'final' => 'La Navarra',
        'nuevo' => 'La Toyosa'
      ];

      // Obtener la clave desde la sesión (fallback a cadena vacía si no existe)
      $finca_key = $_SESSION['finca'] ?? '';

      // Traducir a etiqueta amigable; si no existe la clave, mostramos la clave original (segura)
      $finca_label = isset($finca_map[$finca_key]) ? $finca_map[$finca_key] : $finca_key;
      ?>
      <h1>Finca <?php echo htmlspecialchars($finca_label, ENT_QUOTES, 'UTF-8'); ?></h1>
      <h2>NDVI-viewer</h2>
      <div class="controls">
        <label>Año
          <select id="year"></select>
        </label>
        <label>Mes
          <select id="month"></select>
        </label>
        <button id="accept">Aceptar</button>
        <button id="clear">Limpiar</button>
                <!-- DROPDOWN ADMIN: solo visible si es admin -->
        <?php if ($is_admin): ?>
          <label id="admin-finca-label">Finca:
            <select id="fincaSelect">
              <option value="final" <?php echo $user_finca === 'final' ? 'selected' : '' ?>>La Navarra</option>
              <option value="nuevo" <?php echo $user_finca === 'nuevo' ? 'selected' : '' ?>>La Toyosa</option>
            </select>
          </label>
        <?php endif; ?>
      </div>
    </section>

    <section class="mapbox">
      <div id="map" class="map"></div>
    </section>

  </main>

  <script>
    // variables accesibles por app.js
    window.USER_FINCA = <?php echo json_encode($user_finca); ?>; // 'final' o 'nuevo'
    window.USER_IS_ADMIN = <?php echo json_encode($is_admin ? true : false); ?>;
  </script>
  <script src="app.js"></script>
  <script>
    document.getElementById('user-menu-btn').addEventListener('click', function(e) {
        e.stopPropagation();
        var dropdown = document.getElementById('user-dropdown');
        dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
    });
    document.addEventListener('click', function() {
        document.getElementById('user-dropdown').style.display = 'none';
    });
  </script> 
  <script>
    const nameMap = { final: 'La Navarra', nuevo: 'La Toyosa' };
    const fincaSelect = document.getElementById('fincaSelect');
    const userMenuHeader = document.querySelector('h1'); // o usa un id si prefieres

    // Inicializa (por si la página se cargó con window.USER_FINCA)
    if (window.USER_FINCA && nameMap[window.USER_FINCA]) {
      if (userMenuHeader) userMenuHeader.textContent = 'Finca ' + nameMap[window.USER_FINCA];
    }

    if (fincaSelect) {
      fincaSelect.addEventListener('change', (e) => {
        const v = e.target.value;
        if (userMenuHeader) userMenuHeader.textContent = 'Finca ' + (nameMap[v] || v);
      });
    }
  </script>
</body>
</html>
