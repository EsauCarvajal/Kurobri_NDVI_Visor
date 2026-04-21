/*
 app.js - NDVI viewer / Visor de NDVI
 Este script cumple las siguientes funciones:
  - obtiene el .tif público de S3
  - lo decodifica con GeoTIFF
  - renderiza el canvas coloreado de pixeles
  - Lo coloca encima de OpenLayers
  - Muestra NDVI al pasarlo por encima
*/

// Esto asegura que se importe GeoTIFF
(async function ensureGeoTiffAndRun(){
  const cdn = 'https://cdn.jsdelivr.net/npm/geotiff/dist-browser/geotiff.js';
  const local = 'js/geotiff.js'; // if you place a local copy here as fallback

  async function tryLoad(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src;
      s.onload = () => resolve(true);
      s.onerror = () => reject(new Error('Failed to load ' + src));
      document.head.appendChild(s);
    });
  }

  if (typeof GeoTIFF === 'undefined') {
    // probar CDN (otra vez)
    try {
      await tryLoad(cdn);
    } catch(e) {
      console.warn('CDN load failed, trying local fallback', e);
      try {
        await tryLoad(local);
      } catch(e2) {
        alert('No se pudo cargar la librería GeoTIFF. Coloca una copia local en js/geotiff.js o revisa la conexión al CDN.');
        console.error(e2);
        return;
      }
    }
  }

  // ---------- Scrpit principal inicia aquí! ----------

  const yearSelect = document.getElementById('year');
  const monthSelect = document.getElementById('month');
  const acceptBtn = document.getElementById('accept');
  const clearBtn = document.getElementById('clear');

  const startYear = 2020, endYear = 2025;
  for (let y = startYear; y <= endYear; y++) {
    const o = document.createElement('option'); o.value = y; o.textContent = y; yearSelect.appendChild(o);
  }
  for (let m = 1; m <= 12; m++) {
    const mm = String(m).padStart(2, '0');
    const o = document.createElement('option');
    o.value = mm;
    o.textContent = mm;
    // El año aún no está definido aquí, así que no se puede deshabilitar en este momento
    monthSelect.appendChild(o);
  }

// Deshabilitar meses 7-12 si el año es 2025
yearSelect.addEventListener('change', function() {
  const selectedYear = parseInt(yearSelect.value, 10);
  for (let i = 0; i < monthSelect.options.length; i++) {
    const opt = monthSelect.options[i];
    if (selectedYear === 2025 && parseInt(opt.value, 10) > 6) {
      opt.disabled = true;
      // Si el mes seleccionado está deshabilitado, selecciona el mes 06
      if (monthSelect.value > '06') monthSelect.value = '06';
    } else {
      opt.disabled = false;
    }
  }
});

  // Inicializa OpenLayers map con una capa base satelital ESRI
  const rasterLayer = new ol.layer.Tile({
    source: new ol.source.XYZ({
      url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attributions: 'Tiles © Esri'
    })
  });

  const ndviLayer = new ol.layer.Image({
    source: new ol.source.ImageStatic({
      url: '',
      imageExtent: [0,0,0,0],
    }),
    opacity: 0.85
  });

  const boundaryLayer = new ol.layer.Vector({
    source: new ol.source.Vector(),
    style: new ol.style.Style({
      stroke: new ol.style.Stroke({ color: '#ff6600', width: 2 }),
      fill: new ol.style.Fill({ color: 'rgba(255,102,0,0.05)' })
    })
  });

  const map = new ol.Map({
    target: 'map',
    layers: [rasterLayer, ndviLayer, boundaryLayer],
    view: new ol.View({
      center: ol.proj.fromLonLat([-76.65, 6.67]), // centro placeholder.
      zoom: 13
    })
  });

  // Función para elegir el color de los pixeles
  // 
  function ndviToColor(v) {
  // Transparente para no-data
    if (isNaN(v)) return 'rgba(0,0,0,0)';

  // Clamp por seguridad
    v = Math.max(-1, Math.min(1, v));

  // Caso 1: valores negativos -> tonos rojos oscuros hacia rojo puro en 0
    if (v < 0.15) {
    // u = 0 en -1, u = 1 en 0
      const u = (v + 1); // rango [0,1]
    // Interpolar r entre un rojo oscuro (128) y rojo brillante (255)
      const r = Math.round(128 + u * (255 - 128));
      const g = 0;
      const b = 0;
      return `rgb(${r},${g},${b})`;
    }

  // Caso 2: valores entre 0 y 1
  // t = 0 en 0, t = 1 en 1
    const t = v;

  // 0.0 -> rojo (255,0,0)
  // 0.5 -> amarillo (255,255,0)
  // 1.0 -> verde puro (0,255,0)
    if (t <= 0.5) {
    // rojo -> amarillo: r = 255 fijo, g crece desde 0 hasta 255
      const u = t / 0.5; // 0..1
      const r = 255;
      const g = Math.round(255 * u);
      const b = 0;
      return `rgb(${r},${g},${b})`;
    } else {
    // amarillo -> verde: g = 255 fijo, r decrece desde 255 hasta 0
      const u = (t - 0.5) / 0.5; // 0..1
      const r = Math.round(255 * (1 - u));
      const g = 255;
      const b = 0;
      return `rgb(${r},${g},${b})`;
    }
  }

  // Renderizar GeoTIFF al canvas de OpenLayers
  async function renderGeoTiffToCanvas(arrayBuffer) {
    const tiff = await GeoTIFF.fromArrayBuffer(arrayBuffer);
    const image = await tiff.getImage();
    const width = image.getWidth();
    const height = image.getHeight();

    const raster = await image.readRasters({ interleave: true, samples: [0] });
    const data = raster;

    const fileDir = image.getFileDirectory();
    const tiepoints = image.getTiePoints();
    const origin = image.getOrigin ? image.getOrigin() : (tiepoints && tiepoints[0] ? [tiepoints[0].x, tiepoints[0].y] : [0,0]);
    const pixelScale = fileDir.ModelPixelScale || image.getResolution && image.getResolution() || [1,1,0];
    const minX = origin[0];
    const maxY = origin[1];
    const maxX = minX + pixelScale[0] * width;
    const minY = maxY - pixelScale[1] * height;
    const extent = [minX, minY, maxX, maxY];

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    const imgData = ctx.createImageData(width, height);

    for (let i = 0; i < width*height; i++) {
      const v = data[i];
      // Si NDVI < -1, totalmente transparente
      if (isNaN(v) || v < -1) {
        imgData.data[i*4+3] = 0;
      } else {
        const col = ndviToColor(v);
        const m = col.match(/rgb\((\d+),(\d+),(\d+)\)/);
        const r = parseInt(m[1]), g = parseInt(m[2]), b = parseInt(m[3]);
        imgData.data[i*4+0] = r;
        imgData.data[i*4+1] = g;
        imgData.data[i*4+2] = b;
        imgData.data[i*4+3] = 220;
      }
    }
    ctx.putImageData(imgData, 0, 0);
    return { dataUrl: canvas.toDataURL('image/png'), extent: extent, width, height, raster: data };
  }

  // Tooltip (Que aparezca el número NDVI al apuntar un pixel)
  const tooltip = document.createElement('div');
  tooltip.style.position='absolute';
  tooltip.style.background='rgba(0,0,0,0.7)';
  tooltip.style.color='white';
  tooltip.style.padding='4px 6px';
  tooltip.style.borderRadius='4px';
  tooltip.style.display='none';
  tooltip.style.pointerEvents='none';
  document.body.appendChild(tooltip);

  map.on('pointermove', function(evt){
    const coord = evt.coordinate;
    const src = ndviLayer.getSource();
    const imgExtent = src.getImageExtent();
    if (!imgExtent) { tooltip.style.display='none'; return; }
    const [minX,minY,maxX,maxY] = imgExtent;
    const x = coord[0]; const y = coord[1];
    if (x < minX || x > maxX || y < minY || y > maxY) { tooltip.style.display='none'; return; }
    const w = src.imageWidth || src._imageW || 0;
    const h = src.imageHeight || src._imageH || 0;
    if (!w || !h) { tooltip.style.display='none'; return; }
    const px = Math.floor((x - minX) / (maxX - minX) * w);
    const py = Math.floor((maxY - y) / (maxY - minY) * h);
    if (window._lastRaster) {
      const idx = py * w + px;
      const v = window._lastRaster[idx];
      // Si NDVI < -1, no mostrar tooltip
      if (v === undefined || isNaN(v) || v < -1) { tooltip.style.display='none'; return; }
      tooltip.style.display='block';
      tooltip.style.left = (evt.originalEvent.pageX + 12) + 'px';
      tooltip.style.top = (evt.originalEvent.pageY + 12) + 'px';
      tooltip.textContent = 'NDVI: ' + v.toFixed(3);
    } else {
      tooltip.style.display='none';
    }
  });

// Determinar finca actual: por defecto la del usuario (inyectada por NDVI.php)
let currentFinca = window.USER_FINCA || 'final';
const userIsAdmin = !!window.USER_IS_ADMIN;

// Si hay select admin en DOM, escuchar cambios (solo admin lo verá)
const fincaSelectElem = document.getElementById('fincaSelect');
if (fincaSelectElem) {
  fincaSelectElem.addEventListener('change', (e) => {
    currentFinca = e.target.value;
    // recargar la boundary del nuevo parcel (si ya está cargada, recargar para que se vea el cambio)
    tryLoadBoundary(); // intentará cargar parcel.geojson o parcel_nuevo.geojson según currentFinca
  });
}

// Modificar tryLoadBoundary para cargar parcel correspondiente
async function tryLoadBoundary() {
  try {
    const filename = (currentFinca === 'nuevo') ? 'parcel_nuevo.geojson' : 'parcel.geojson';
    const res = await fetch(filename);
    if (!res.ok) {
      // si no existe, no limpiar el boundary existente: solo log
      console.warn('No boundary file:', filename);
      return;
    }
    const gj = await res.json();
    const format = new ol.format.GeoJSON();
    const features = format.readFeatures(gj, { featureProjection: 'EPSG:3857' });
    boundaryLayer.getSource().clear();
    boundaryLayer.getSource().addFeatures(features);
    const extent = boundaryLayer.getSource().getExtent();
    map.getView().fit(extent, { padding:[30,30,30,30] });
  } catch(e) {
    console.warn('No boundary loaded:', e);
  }
}
// Llamada inicial
tryLoadBoundary();

// Construir el key según la finca seleccionada
function buildKeyForFinca(year, month, finca) {
  // finca === 'final' -> NDVI_<year>_<month>_final.tif
  // finca === 'nuevo'  -> NDVI_<year>_<month>_nuevo.tif
  if (finca === 'nuevo') {
    return `NDVI_${year}_${month}_nuevo.tif`;
  }
  return `NDVI_${year}_${month}_final.tif`;
}

// Accept handler: usar currentFinca
acceptBtn.addEventListener('click', async () => {
  const y = yearSelect.value;
  const m = monthSelect.value;
  const key = buildKeyForFinca(y, m, currentFinca);
  const bucket = 'kurobri-raster-store';
  const region = 'us-east-1';

    // Armar el URL hacía el bucket de S3 público
  function buildPublicS3Url(bucket, key, region=null) {
    if (!region || region === 'us-east-1') {
      return `https://${bucket}.s3.amazonaws.com/${encodeURIComponent(key)}`;
    } else {
      return `https://${bucket}.s3.${region}.amazonaws.com/${encodeURIComponent(key)}`;
    }
  }

  try {
    const url = buildPublicS3Url(bucket, key, region);
    console.log('Fetching', url);
    const buffRes = await fetch(url);
    if (!buffRes.ok) throw new Error('Error descargando el archivo desde S3: ' + buffRes.status);
    const buff = await buffRes.arrayBuffer();

    // Intentar cargar la geojson correcto (parcel o parcel_nuevo) y pasarlo a render si quieres masking en client
    // (el render ya intenta usar tryLoadBoundary para dibujar boundary, pero para mask interno puedes fetch también)
    let maskGeojson = null;
    try {
      const parcelFilename = (currentFinca === 'nuevo') ? 'parcel_nuevo.geojson' : 'parcel.geojson';
      const p = await fetch(parcelFilename);
      if (p.ok) maskGeojson = await p.json();
    } catch(e) { console.warn('No parcel geojson for mask:', e); }

    // render (la función renderGeoTiffToCanvas espera opcionalmente maskGeojson si la implementaste)
    const rendered = await renderGeoTiffToCanvas(buff, maskGeojson);

    window._lastRaster = rendered.raster;

    const min = ol.proj.fromLonLat([rendered.extent[0], rendered.extent[1]]);
    const max = ol.proj.fromLonLat([rendered.extent[2], rendered.extent[3]]);
    const imgExtent = [min[0], min[1], max[0], max[1]];

    const newSource = new ol.source.ImageStatic({
      url: rendered.dataUrl,
      imageExtent: imgExtent,
      projection: map.getView().getProjection()
    });
    newSource.imageWidth = rendered.width;
    newSource.imageHeight = rendered.height;
    ndviLayer.setSource(newSource);
    ndviLayer.setVisible(true);
    if (typeof map.render === 'function') map.render();
    map.getView().fit(imgExtent, { padding:[30,30,30,30] });

  } catch (e) {
    alert('Error cargando NDVI: ' + e.message);
    console.error(e);
  }
});

// botón limpiar: Elimina la visualización del NDVI.
clearBtn.addEventListener('click', () => {
  // Reasignar una fuente vacía a la capa NDVI
  ndviLayer.setSource(new ol.source.ImageStatic({
    url: '',
    imageExtent: [0,0,0,0],
    projection: map.getView().getProjection()
  }));

  // Ocultar la capa NDVI
  ndviLayer.setVisible(false);

  // Limpiar el raster temporal (para que el tooltip no muestre valores)
  window._lastRaster = null;

  // Ocultar tooltip si estaba visible
  tooltip.style.display = 'none';

  // Forzar render del mapa para actualizar la vista inmediatamente
  if (typeof map.render === 'function') map.render();
});

})(); // Fin del Script
