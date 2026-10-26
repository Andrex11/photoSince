# Requisitos del Sistema y Dependencias (Requirements) 📋

Este documento detalla los requerimientos de software, hardware, navegadores y dependencias necesarios para el funcionamiento y desarrollo de la aplicación **Pixelador de Rostros**.

---

## 1. Requisitos de Entorno de Ejecución y Desarrollo

| Componente | Requisito Mínimo | Requisito Recomendado | Verificación |
| :--- | :--- | :--- | :--- |
| **Node.js** | `>= 18.0.0` | `v20.x` o `v22.x` (LTS) | `node -v` |
| **npm** | `>= 9.0.0` | `>= 10.x` | `npm -v` |
| **Sistema Operativo** | Windows 10/11, macOS 11+, Linux (Ubuntu, Debian, Fedora, etc.) | Cualquier SO de 64 bits | — |

---

## 2. Dependencias del Proyecto

El proyecto está diseñado bajo una arquitectura ligera y moderna, evitando dependencias externas para el procesamiento de imágenes o la manipulación del DOM.

### 2.1. Dependencias de Tiempo de Ejecución (Runtime)
- **Ninguna (0 dependencias externas)**: Todo el procesamiento, pixelado, selección y exportación se realiza utilizando las APIs nativas del navegador web:
  - `HTML5 Canvas API 2D` (`CanvasRenderingContext2D`, `drawImage`, `clip`, `toBlob`).
  - `File API` (`File`, `FileReader`, `FileList`).
  - `Pointer Events API` (`pointerdown`, `pointermove`, `pointerup`, `setPointerCapture`).
  - `URL API` (`URL.createObjectURL`, `URL.revokeObjectURL`).
  - `Web Storage / DOM APIs` estándar.

### 2.2. Dependencias de Desarrollo (devDependencies)
Definidas en [package.json](file:///e:/Proyectos/PhotoSince/package.json):

```json
{
  "devDependencies": {
    "vite": "^5.4.8"
  }
}
```

- **`vite`**: Servidor de desarrollo ultrarrápido basado en ESM y empaquetador para producción (Rollup).

---

## 3. Compatibilidad de Navegadores Web

La aplicación requiere navegadores con soporte completo para Canvas 2D, Pointer Events y ES Modules:

| Navegador | Versión Mínima Soportada | Estado |
| :--- | :--- | :--- |
| **Google Chrome / Chromium** | 90+ | Totalmente compatible |
| **Mozilla Firefox** | 88+ | Totalmente compatible |
| **Microsoft Edge** | 90+ | Totalmente compatible |
| **Apple Safari (macOS / iOS)** | 14+ | Totalmente compatible |
| **Opera** | 76+ | Totalmente compatible |
| **Navegadores móviles (Android Chrome, iOS Safari)** | Versiones recientes | Compatible (interfaz táctil adaptada) |

---

## 4. Requisitos de Hardware y Memoria

- **Memoria RAM**:
  - *Mínimo*: 2 GB libres de memoria RAM.
  - *Recomendado*: 4 GB o más cuando se procesen fotografías de muy alta resolución (4K, 8K o superiores a 20 Megapíxeles) para permitir el almacenamiento de estados en el historial de deshacer.
- **Procesador (CPU/GPU)**: Cualquier procesador moderno con aceleración gráfica por hardware habilitada en el navegador para renderizado fluido en Canvas.
- **Espacio en disco**: Menos de 50 MB para el proyecto y las dependencias de desarrollo (`node_modules`).

---

## 5. Formatos de Imagen Soportados

La aplicación valida y procesa nativamente los siguientes formatos estándar de imagen digital:

- **JPEG / JPG** (`image/jpeg`)
- **PNG** (`image/png`)
- **WebP** (`image/webp`)

---

## 6. Verificación Rápida de Instalación

Ejecuta en tu terminal para validar que cumples con los requisitos:

```bash
# Comprobar versión de Node.js (debe ser >= 18.0.0)
node -v

# Comprobar versión de npm (debe ser >= 9.0.0)
npm -v

# Instalar dependencias del proyecto
npm install
```
