# Registro de Cámara — mini guía

## Qué es esto
Una app web (PWA) para registrar tomas de cámara: escena, toma, lente, filtro y notas.
Todo se guarda en tu propio móvil (localStorage del navegador) — nadie más lo ve, no hace falta cuenta ni internet. Cuando quieras, exportas todo a un PDF.

## 1. Probarla en tu ordenador (VS Code)
1. Abre esta carpeta `camlog` en VS Code.
2. Instala la extensión **Live Server** (de Ritwick Dey) desde el marketplace de extensiones.
3. Clic derecho sobre `index.html` → **Open with Live Server**.
4. Se abrirá en tu navegador. Prueba a registrar una toma y exportar el PDF.

## 2. Publicarla para tener un link real (necesario para instalarla en el iPhone)
Un PWA necesita estar en HTTPS para poder "Añadir a pantalla de inicio". La forma más rápida y gratis:

**Opción recomendada: Netlify Drop**
1. Ve a https://app.netlify.com/drop
2. Arrastra la carpeta `camlog` entera a la web.
3. En segundos te da un link tipo `https://tu-app-random.netlify.app`
4. Ese es tu link — te lo puedes guardar en Notas o mandarte un mensaje a ti mismo.

**Alternativa: GitHub Pages**
1. Sube esta carpeta a un repositorio en GitHub.
2. En el repo → Settings → Pages → Deploy from branch → main.
3. Tu link será `https://tu-usuario.github.io/nombre-repo`

## 3. Instalarla en el iPhone
1. Abre el link en **Safari** (tiene que ser Safari, no Chrome, para que funcione el "Añadir a pantalla de inicio" como app).
2. Toca el botón de compartir (el cuadrado con la flecha hacia arriba).
3. Elige **"Añadir a pantalla de inicio"**.
4. Ya tienes un icono propio que abre la app a pantalla completa, sin la barra de Safari, y funciona sin conexión.

## 4. Estructura de archivos
```
camlog/
├── index.html          → estructura de la app
├── style.css            → estilos
├── app.js                → lógica: guardar, listar, exportar a PDF
├── manifest.json     → configuración de instalación (nombre, icono, colores)
├── service-worker.js → hace que funcione sin internet
└── icons/                 → iconos de la app
```

## 5. Cómo modificarla
- Para añadir un campo nuevo (por ejemplo "Cámara"): añade un `<label class="field">` en `index.html`, léelo en el objeto `entry` dentro de `app.js` (función del `submit`), y muéstralo donde quieras en `renderEntry()` y en la sección de exportación PDF.
- Los datos viven en `localStorage` bajo la clave `camlog_entries_v1`. Si algún día quieres borrarlos todos desde el navegador: consola → `localStorage.clear()`.
