# H5P InfoWall Browser Generator 🚀

Una aplicación web de cliente moderna, rápida y atractiva que permite convertir cualquier hoja de cálculo (`.ods`, `.xlsx`, `.csv`) en una actividad interactiva de **H5P InfoWall** de forma visual, directamente desde tu navegador.

Esta aplicación ha sido adaptada del cuaderno de Google Colab original y ampliada para proporcionar una interfaz de usuario premium basada en Glassmorphism.

## Características ✨

*   **Procesamiento 100% en Cliente**: Tus hojas de cálculo no se suben a ningún servidor. Todo se procesa de forma segura en tu navegador.
*   **Compatibilidad Multiformato**: Carga archivos OpenDocument (`.ods`), Excel (`.xlsx`, `.xls`) o valores separados por comas (`.csv`).
*   **Mapeo Dinámico de Columnas**: Asocia libremente las columnas de tu hoja con los campos de H5P:
    *   *Nombre de Actividad* (utilizado para buscar la ilustración)
    *   *Título del Panel* (fallback al nombre si queda vacío)
    *   *Descripción* (soporta HTML y añade enlaces `Url` dinámicamente)
    *   *Proyecto*, *Categoría* y *Etiquetas*
*   **Integración con Pixabay**: Busca de forma inteligente ilustraciones en Pixabay a partir del nombre de la actividad de forma automatizada y con gestión de límites de la API (rate-limiting).
*   **Descarga Dual**:
    *   📦 **Descargar H5P Completo**: Genera un archivo `.h5p` listo para subir a Moodle (EVAGD), WordPress o Canvas, incluyendo el archivo `h5p.json` y la estructura de dependencias de InfoWall.
    *   📂 **Descargar content.json + Imágenes (ZIP)**: Descarga un paquete ZIP crudo, tal y como lo hacía el cuaderno de Colab, para parchear manualmente un archivo H5P existente.
*   **Diseño Premium**: Interfaz en modo oscuro con efectos translúcidos (glassmorphism), micro-animaciones fluidas y consola de progreso interactiva en tiempo real.

## Uso Rápido 🛠️

1.  **Carga tu Archivo**: Arrastra y suelta tu archivo de inventario en la zona de carga.
2.  **Selecciona la Hoja y Mapea las Columnas**: La aplicación leerá los encabezados de tu hoja de cálculo y te sugerirá el mapeo adecuado automáticamente (detectando columnas como "Nombre", "Proyecto", etc.).
3.  **Configura Pixabay (Opcional)**: Ingresa tu clave de Pixabay (se incluye una por defecto que puedes cambiar y guardar localmente).
4.  **Genera y Descarga**: Haz clic en "Generar H5P". Verás el progreso detallado en la consola integrada. Al terminar, descarga tu archivo.

## ¿Cómo publicarlo en GitHub Pages? 🌐

Dado que es una aplicación totalmente estática, puedes alojarla de forma gratuita y sencilla usando **GitHub Pages**:

1.  Asegúrate de que este repositorio esté subido a tu cuenta de GitHub (`https://github.com/nmarafo/H5PBrowser`).
2.  En la página de tu repositorio de GitHub, ve a **Settings** (Configuración) > **Pages**.
3.  Bajo **Build and deployment**, selecciona la rama `main` (o `master`) y la carpeta `/ (root)`.
4.  Haz clic en **Save** (Guardar).
5.  ¡Listo! En unos minutos, tu aplicación estará disponible públicamente en `https://nmarafo.github.io/H5PBrowser/`.

## Tecnologías Utilizadas 💻

*   **SheetJS (XLSX)**: Para la lectura y análisis ultra-rápido de hojas de cálculo en el navegador.
*   **JSZip**: Para la creación en tiempo real de archivos ZIP y empaquetado `.h5p`.
*   **CSS3 Vanilla**: Diseño responsivo y efectos visuales de alta gama con variables CSS y animaciones fluidas sin dependencias pesadas.
