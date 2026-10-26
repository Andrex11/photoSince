# Pixelador de Rostros 🛡️

> Aplicación web moderna y 100% privada para anonimizar y pixelar rostros en fotografías directamente en tu navegador, sin servidores ni servicios externos.

---

## 📋 Descripción del Proyecto

**Pixelador de Rostros** es una herramienta frontend construida con **HTML5 Canvas API**, **CSS3 moderno** y **JavaScript (ES6+)**, empaquetada con **Vite**. Permite a los usuarios importar fotografías en formatos **JPG, JPEG, PNG y WebP**, marcar manualmente los rostros que requieren anonimización mediante selecciones circulares interactivas (móviles y redimensionables) y aplicar un efecto real de pixelado destructivo que protege la privacidad de las personas a resolución completa.

### ✨ Características Principales

- **🔒 Privacidad y Seguridad Absoluta:** Todas las operaciones de decodificación, pixelado y exportación se realizan localmente en la memoria del navegador. Ninguna fotografía se sube a servidores externos, APIs ni servicios en la nube.
- **🎯 Selección Manual e Intuitiva:** Haz clic sobre los rostros para generar círculos de selección de alto contraste con manijas de redimensionado, centro de arrastre y controles táctiles (`touch-action: none`).
- **⚙️ Algoritmo Real de Pixelado en Canvas:** Modifica irreversiblemente los píxeles seleccionados a resolución nativa, conservando las zonas no seleccionadas al 100% de su calidad original.
- **🎚️ Control de Intensidad:** Permite regular el tamaño de los bloques de píxeles en tres niveles: *Moderado*, *Medio* e *Intenso*.
- **↩️ Historial y Deshacer (Undo):** Reviértete a estados anteriores eficientemente mediante snapshots en memoria sin agotar la memoria RAM.
- **💾 Exportación Flexible:** Descarga el resultado procesado en **PNG** (sin pérdidas) o **JPEG** (con selector de calidad configurable). **Los círculos de selección y controles de la interfaz nunca aparecen en la imagen descargada.**
- **📱 Totalmente Responsive y Accesible:** Diseñado con controles adaptados para ordenadores de sobremesa, tabletas y dispositivos móviles.

---

## 📦 ¿Qué se debe instalar? (Requisitos Previos)

Para ejecutar y compilar este proyecto, necesitas tener instalado en tu equipo:

1. **Node.js**: Entorno de ejecución de JavaScript.
   - **Versión requerida:** `>= 18.0.0` (Recomendado: Node.js 20 LTS o 22 LTS).
   - Descarga oficial: [nodejs.org](https://nodejs.org/).
2. **npm**: Gestor de paquetes oficial incluido con Node.js.
   - **Versión requerida:** `>= 9.0.0`.
3. **Navegador web moderno**:
   - Google Chrome / Chromium 90+
   - Mozilla Firefox 88+
   - Microsoft Edge 90+
   - Apple Safari 14+

> Para una lista completa y detallada de requisitos técnicos, hardware y compatibilidad, consulta el archivo [REQUIREMENTS.md](file:///e:/Proyectos/PhotoSince/REQUIREMENTS.md).

---

## 🚀 Instalación y Puesta en Marcha Paso a Paso

### Paso 1: Verificar el entorno
Abre tu terminal o consola (PowerShell, Command Prompt, Bash o Zsh) y verifica las versiones instaladas:

```bash
node -v
npm -v
```

### Paso 2: Clonar o acceder a la carpeta del proyecto
```bash
cd e:\Proyectos\PhotoSince
```

### Paso 3: Instalar dependencias
Instala la única dependencia de desarrollo necesaria (**Vite**):

```bash
npm install
```

### Paso 4: Iniciar el servidor de desarrollo local
```bash
npm run dev
```

La consola mostrará una URL local, normalmente:
```text
  ➜  Local:   http://localhost:5173/
```
Abre esa dirección en tu navegador web para utilizar la aplicación.

---

## 🏗️ Otros Comandos Disponibles

### Compilación para Producción (Build)
Genera el paquete optimizado y minificado para distribución estática en la carpeta `dist/`:

```bash
npm run build
```

### Previsualizar el Build de Producción
Inicia un servidor local para verificar el resultado generado en la carpeta `dist/`:

```bash
npm run preview
```

---

## 🧪 Flujo de Uso

1. **Importar fotografía:**
   - Haz clic en el botón **"Importar fotografía"** o arrastra cualquier archivo JPG, JPEG, PNG o WebP sobre el área inicial.
2. **Seleccionar rostros:**
   - Haz clic sobre cada rostro para crear un círculo de selección.
   - Puedes seleccionar varios rostros en una misma fotografía.
   - Arrastra el círculo para centrarlo correctamente sobre la persona.
   - Utiliza la manija inferior derecha del círculo o el control deslizante de tamaño en la barra superior para ampliarlo o reducirlo.
   - Si deseas quitar un círculo individual, pulsa la tecla `Supr`, `Backspace` o el botón rojo *"Eliminar círculo"*.
3. **Pixelar:**
   - Selecciona la intensidad deseada (*Moderado*, *Medio* o *Intenso*).
   - Haz clic en el botón principal **"Pixelar seleccionados"**. Los píxeles de los rostros marcados se pixelarán instantáneamente.
4. **Deshacer cambios (si es necesario):**
   - Pulsa **"Deshacer cambios"** para revertir la última operación de pixelado sin alterar la imagen original del disco.
5. **Descargar imagen:**
   - Haz clic en **"Descargar imagen"**, selecciona el formato deseado (**PNG** o **JPEG**) y guarda tu archivo final limpio y protegido.

---

## 📂 Estructura del Código

```
pixelador-rostros/
├── index.html                   # Interfaz semántica en español y modales
├── package.json                 # Configuración del proyecto y scripts
├── vite.config.js               # Configuración del servidor Vite
├── REQUIREMENTS.md              # Requisitos detallados del sistema y dependencias
├── README.md                    # Documentación principal del proyecto
├── src/
│   ├── main.js                  # Coordinador central de la aplicación
│   ├── styles.css               # Diseño visual Vanilla CSS, variables y responsive
│   ├── components/
│   │   ├── toolbar.js           # Barra de herramientas y controles contextuales
│   │   ├── imageUploader.js     # Importación File API y drag & drop
│   │   ├── faceSelector.js      # Selección interactiva sobre Canvas Overlay
│   │   └── exportModal.js       # Modal de descarga a resolución nativa
│   └── utils/
│       ├── coordinateHelper.js  # Conversión matemática entre pantalla e imagen nativa
│       ├── pixelate.js          # Algoritmo de pixelado con máscara circular en Canvas API
│       ├── historyManager.js    # Pila de estados para la función Deshacer
│       └── notifications.js     # Notificaciones toast accesibles
```

---

## 🔒 Privacidad y Seguridad

- **Sin backend ni bases de datos:** La aplicación no realiza peticiones HTTP con las imágenes del usuario.
- **Sin telemetría invasiva ni APIs externas:** Las imágenes nunca salen del dispositivo.
- **Liberación de memoria:** Los objetos de memoria (`Blob`, `ImageBitmap`, `Canvas`) se liberan cuando se cambia de imagen o se cierra la pestaña.

---

## 📄 Licencia

Código abierto bajo licencia MIT. Desarrollado con foco estricto en la privacidad y la protección de datos personales.
