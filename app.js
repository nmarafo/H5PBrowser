document.addEventListener('DOMContentLoaded', () => {
  // Constants
  const DEFAULT_API_KEY = '20462364-4650be092c1702f82e17ad513';
  
  // State
  let parsedWorkbook = null;
  let parsedRows = [];
  let sheetColumns = [];
  let isProcessing = false;
  let processCancelled = false;

  // H5P Import State
  let h5pExtractedHeaders = [];
  let h5pExtractedRows = [];

  // Tab DOM Elements
  const tabExcelH5p = document.getElementById('tab-excel-h5p');
  const tabH5pExcel = document.getElementById('tab-h5p-excel');
  const panelExcelH5p = document.getElementById('panel-excel-h5p');
  const panelH5pExcel = document.getElementById('panel-h5p-excel');
  const settingsExcelH5p = document.getElementById('settings-excel-h5p');
  const settingsH5pExcel = document.getElementById('settings-h5p-excel');

  // DOM Elements (Excel to H5P)
  const uploadZone = document.getElementById('upload-zone');
  const fileInput = document.getElementById('file-input');
  const fileInfoBox = document.getElementById('file-info-box');
  const fileNameDisplay = document.getElementById('file-name');
  const fileSizeDisplay = document.getElementById('file-size');
  const removeFileBtn = document.getElementById('remove-file-btn');
  
  const setupStep = document.getElementById('setup-step');
  const sheetSelect = document.getElementById('sheet-select');
  const mappingsGrid = document.getElementById('mappings-grid');
  
  const previewTableContainer = document.getElementById('preview-table-container');
  const previewTableBody = document.getElementById('preview-table-body');
  const previewTableHeader = document.getElementById('preview-table-header');
  
  const generateBtn = document.getElementById('generate-btn');

  // DOM Elements (H5P to Excel)
  const h5pUploadZone = document.getElementById('h5p-upload-zone');
  const h5pFileInput = document.getElementById('h5p-file-input');
  const h5pFileInfoBox = document.getElementById('h5p-file-info-box');
  const h5pFileNameDisplay = document.getElementById('h5p-file-name');
  const h5pFileSizeDisplay = document.getElementById('h5p-file-size');
  const h5pRemoveFileBtn = document.getElementById('h5p-remove-file-btn');
  
  const h5pPreviewStep = document.getElementById('h5p-preview-step');
  const h5pPreviewTableHeader = document.getElementById('h5p-preview-table-header');
  const h5pPreviewTableBody = document.getElementById('h5p-preview-table-body');
  
  const downloadExcelBtn = document.getElementById('download-excel-btn');
  const downloadOdsBtn = document.getElementById('download-ods-btn');
  
  // Settings DOM
  const apiKeyInput = document.getElementById('api-key');
  const saveApiKeyBtn = document.getElementById('save-api-key-btn');
  const enablePixabayCheckbox = document.getElementById('enable-pixabay');
  const pixabaySettings = document.getElementById('pixabay-settings');
  const queryLangSelect = document.getElementById('query-lang');
  const infoWallTitleInput = document.getElementById('infowall-title');
  const h5pLangInput = document.getElementById('h5p-lang');
  
  // Modal DOM
  const modalOverlay = document.getElementById('modal-overlay');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const progressFill = document.getElementById('progress-fill');
  const progressText = document.getElementById('progress-text');
  const percentText = document.getElementById('percent-text');
  const consoleBox = document.getElementById('console-box');
  const cancelProcessBtn = document.getElementById('cancel-process-btn');
  
  const processingDashboard = document.getElementById('processing-dashboard');
  const successCard = document.getElementById('success-card');
  const downloadH5pBtn = document.getElementById('download-h5p-btn');
  const downloadZipBtn = document.getElementById('download-zip-btn');
  
  // Map fields required by H5P InfoWall
  const H5P_FIELDS = [
    { id: 'field-id', label: 'ID / Nombre para buscar imagen', required: true, desc: 'Nombre clave de la actividad o recurso' },
    { id: 'field-title', label: 'Título del Panel', required: false, desc: 'Si está vacío, se usará el ID/Nombre anterior' },
    { id: 'field-desc', label: 'Descripción', required: false, desc: 'Cuerpo principal de texto' },
    { id: 'field-project', label: 'Proyecto', required: false, desc: 'Atributo para filtrar por Proyecto' },
    { id: 'field-category', label: 'Categoría', required: false, desc: 'Atributo para filtrar por Categoría' },
    { id: 'field-tags', label: 'Etiquetas', required: false, desc: 'Palabras clave separadas por comas' },
    { id: 'field-url', label: 'URL de Enlace', required: false, desc: 'Añadirá un enlace interactivo al final de la descripción' }
  ];

  // Initialize Settings
  loadSettings();

  // Event Listeners for Upload Zone
  uploadZone.addEventListener('click', () => fileInput.click());
  
  uploadZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadZone.classList.add('dragover');
  });

  uploadZone.addEventListener('dragleave', () => {
    uploadZone.classList.remove('dragover');
  });

  uploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadZone.classList.remove('dragover');
    if (e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  });

  removeFileBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    resetApp();
  });

  sheetSelect.addEventListener('change', () => {
    if (parsedWorkbook) {
      processSheet(sheetSelect.value);
    }
  });

  saveApiKeyBtn.addEventListener('click', () => {
    localStorage.setItem('h5p_pixabay_api_key', apiKeyInput.value.trim());
    showToast('Clave de API guardada localmente.');
  });

  enablePixabayCheckbox.addEventListener('change', () => {
    if (enablePixabayCheckbox.checked) {
      pixabaySettings.classList.remove('hidden');
    } else {
      pixabaySettings.classList.add('hidden');
    }
  });

  cancelProcessBtn.addEventListener('click', () => {
    processCancelled = true;
    logToConsole('Cancelación solicitada por el usuario...', 'error');
  });

  modalCloseBtn.addEventListener('click', () => {
    modalOverlay.classList.remove('active');
  });

  generateBtn.addEventListener('click', () => {
    if (parsedRows.length === 0) return;
    startGeneration();
  });

  // Tab Navigation listeners
  tabExcelH5p.addEventListener('click', () => {
    tabExcelH5p.classList.add('active');
    tabH5pExcel.classList.remove('active');
    panelExcelH5p.classList.remove('hidden');
    panelH5pExcel.classList.add('hidden');
    settingsExcelH5p.classList.remove('hidden');
    settingsH5pExcel.classList.add('hidden');
  });

  tabH5pExcel.addEventListener('click', () => {
    tabH5pExcel.classList.add('active');
    tabExcelH5p.classList.remove('active');
    panelH5pExcel.classList.remove('hidden');
    panelExcelH5p.classList.add('hidden');
    settingsH5pExcel.classList.remove('hidden');
    settingsExcelH5p.classList.add('hidden');
  });

  // H5P Drag and Drop listeners
  h5pUploadZone.addEventListener('click', () => h5pFileInput.click());

  h5pUploadZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    h5pUploadZone.classList.add('dragover');
  });

  h5pUploadZone.addEventListener('dragleave', () => {
    h5pUploadZone.classList.remove('dragover');
  });

  h5pUploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    h5pUploadZone.classList.remove('dragover');
    if (e.dataTransfer.files.length > 0) {
      handleH5pFile(e.dataTransfer.files[0]);
    }
  });

  h5pFileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      handleH5pFile(e.target.files[0]);
    }
  });

  h5pRemoveFileBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    resetH5pApp();
  });

  downloadExcelBtn.addEventListener('click', () => {
    exportToSpreadsheet(false);
  });

  downloadOdsBtn.addEventListener('click', () => {
    exportToSpreadsheet(true);
  });

  // Load and save settings
  function loadSettings() {
    const savedKey = localStorage.getItem('h5p_pixabay_api_key');
    apiKeyInput.value = savedKey ? savedKey : DEFAULT_API_KEY;
    
    // Set Pixabay visibility based on checked state
    if (enablePixabayCheckbox.checked) {
      pixabaySettings.classList.remove('hidden');
    } else {
      pixabaySettings.classList.add('hidden');
    }
  }

  // Parse file and load SheetJS workbook
  function handleFile(file) {
    // Show loading
    fileNameDisplay.textContent = 'Analizando archivo...';
    fileSizeDisplay.textContent = '';
    fileInfoBox.classList.remove('hidden');
    uploadZone.classList.add('hidden');

    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        const data = new Uint8Array(e.target.result);
        parsedWorkbook = XLSX.read(data, { type: 'array' });
        
        // Show file details
        fileNameDisplay.textContent = file.name;
        fileSizeDisplay.textContent = formatBytes(file.size);
        
        // Populate sheet select
        sheetSelect.innerHTML = '';
        parsedWorkbook.SheetNames.forEach(name => {
          const opt = document.createElement('option');
          opt.value = name;
          opt.textContent = name;
          sheetSelect.appendChild(opt);
        });
        
        setupStep.classList.remove('hidden');
        processSheet(parsedWorkbook.SheetNames[0]);
      } catch (err) {
        console.error(err);
        alert('Error al leer el archivo. Asegúrate de que sea un archivo de hoja de cálculo válido (.ods, .xlsx, .xls, .csv).');
        resetApp();
      }
    };
    reader.readAsArrayBuffer(file);
  }

  // Process a single sheet from the workbook
  function processSheet(sheetName) {
    const worksheet = parsedWorkbook.Sheets[sheetName];
    // Get full rows with blank cells filled as empty strings
    parsedRows = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
    
    if (parsedRows.length === 0) {
      alert('La hoja de cálculo seleccionada está vacía.');
      return;
    }

    // Extract headers (columns)
    // SheetJS gets columns based on first row
    sheetColumns = [];
    const range = XLSX.utils.decode_range(worksheet['!ref']);
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const address = XLSX.utils.encode_cell({ r: range.s.r, c: C });
      const cell = worksheet[address];
      if (cell && cell.v !== undefined) {
        sheetColumns.push(cell.v.toString().trim());
      }
    }

    if (sheetColumns.length === 0) {
      // Fallback: extract keys from parsed rows
      const keys = new Set();
      parsedRows.forEach(r => Object.keys(r).forEach(k => keys.add(k)));
      sheetColumns = Array.from(keys);
    }

    renderMappings();
    renderPreview();
    generateBtn.disabled = false;
  }

  // Render dropdowns for mappings
  function renderMappings() {
    mappingsGrid.innerHTML = '';
    
    H5P_FIELDS.forEach(field => {
      const group = document.createElement('div');
      group.className = 'form-group';
      
      const label = document.createElement('label');
      label.setAttribute('for', field.id);
      label.innerHTML = `${field.label} ${field.required ? '<span>*</span>' : ''}`;
      
      const select = document.createElement('select');
      select.id = field.id;
      select.className = 'form-control mapping-select';
      
      // Add empty choice
      const defaultOpt = document.createElement('option');
      defaultOpt.value = '';
      defaultOpt.textContent = `-- Ninguna columna --`;
      select.appendChild(defaultOpt);
      
      // Add sheet columns
      sheetColumns.forEach(col => {
        const opt = document.createElement('option');
        opt.value = col;
        opt.textContent = col;
        select.appendChild(opt);
      });
      
      // Auto mapping heuristics
      const matchedCol = findBestColumnMatch(field.id, sheetColumns);
      if (matchedCol) {
        select.value = matchedCol;
      }
      
      const desc = document.createElement('p');
      desc.className = 'settings-description';
      desc.textContent = field.desc;
      
      group.appendChild(label);
      group.appendChild(select);
      group.appendChild(desc);
      
      // Add event listener to update preview table on mapping change
      select.addEventListener('change', renderPreview);
      
      mappingsGrid.appendChild(group);
    });
  }

  // Find best match between field and sheet columns
  function findBestColumnMatch(fieldId, columns) {
    const normalize = s => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
    const colMap = columns.map(c => ({ original: c, norm: normalize(c) }));
    
    switch (fieldId) {
      case 'field-id':
        return columns.find(c => ['nombre', 'name', 'id', 'actividad', 'item', 'recurso'].includes(normalize(c))) || columns[0];
      case 'field-title':
        return columns.find(c => ['titulo', 'title'].includes(normalize(c))) || columns.find(c => ['nombre', 'name'].includes(normalize(c)));
      case 'field-desc':
        return columns.find(c => ['descripcion', 'description', 'info', 'detalle', 'cuerpo'].includes(normalize(c)));
      case 'field-project':
        return columns.find(c => ['proyecto', 'project', 'programa', 'maleta'].includes(normalize(c)));
      case 'field-category':
        return columns.find(c => ['categoria', 'category', 'tipo', 'clasificacion'].includes(normalize(c)));
      case 'field-tags':
        return columns.find(c => ['etiquetas', 'tags', 'palabrasclave', 'keywords'].includes(normalize(c)));
      case 'field-url':
        return columns.find(c => ['url', 'link', 'enlace', 'masinformacion'].includes(normalize(c)));
      default:
        return null;
    }
  }

  // Render preview table
  function renderPreview() {
    previewTableHeader.innerHTML = '';
    previewTableBody.innerHTML = '';
    
    const activeMappings = {};
    H5P_FIELDS.forEach(field => {
      const selectEl = document.getElementById(field.id);
      if (selectEl && selectEl.value) {
        activeMappings[field.id] = selectEl.value;
      }
    });

    // Generate table headers
    const headersToRender = H5P_FIELDS.filter(f => activeMappings[f.id]);
    if (headersToRender.length === 0) {
      previewTableContainer.classList.add('hidden');
      return;
    }
    
    previewTableContainer.classList.remove('hidden');
    
    // Add columns headers
    headersToRender.forEach(h => {
      const th = document.createElement('th');
      th.textContent = h.label.split(' / ')[0]; // Show short label
      previewTableHeader.appendChild(th);
    });

    // Populate rows (max 5 rows for preview)
    const previewRows = parsedRows.slice(0, 5);
    previewRows.forEach(row => {
      const tr = document.createElement('tr');
      headersToRender.forEach(h => {
        const td = document.createElement('td');
        const colVal = row[activeMappings[h.id]] || '';
        td.textContent = colVal;
        tr.appendChild(td);
      });
      previewTableBody.appendChild(tr);
    });
  }

  // Reset the application to initial state
  function resetApp() {
    parsedWorkbook = null;
    parsedRows = [];
    sheetColumns = [];
    fileInput.value = '';
    
    fileInfoBox.classList.add('hidden');
    uploadZone.classList.remove('hidden');
    setupStep.classList.add('hidden');
    previewTableContainer.classList.add('hidden');
    generateBtn.disabled = true;
  }

  // Parse H5P or content.json file
  function handleH5pFile(file) {
    h5pFileNameDisplay.textContent = 'Analizando archivo H5P...';
    h5pFileSizeDisplay.textContent = '';
    h5pFileInfoBox.classList.remove('hidden');
    h5pUploadZone.classList.add('hidden');

    const reader = new FileReader();
    reader.onload = async function(e) {
      try {
        let jsonContent = '';
        const isJson = file.name.endsWith('.json');
        
        if (isJson) {
          const textDecoder = new TextDecoder('utf-8');
          jsonContent = textDecoder.decode(e.target.result);
        } else {
          // It's a zip/h5p file
          const zip = await JSZip.loadAsync(e.target.result);
          // Look for content/content.json or content.json in root
          let contentFile = zip.file('content/content.json') || zip.file('content.json');
          if (!contentFile) {
            throw new Error('No se encontró el archivo content.json en el paquete H5P.');
          }
          jsonContent = await contentFile.async('text');
        }

        const data = JSON.parse(jsonContent);
        if (!data.infoWall || !data.infoWall.panels) {
          throw new Error('El archivo no parece ser una actividad H5P InfoWall válida.');
        }

        h5pFileNameDisplay.textContent = file.name;
        h5pFileSizeDisplay.textContent = formatBytes(file.size);

        processH5pData(data);

      } catch (err) {
        console.error(err);
        alert(`Error al leer el archivo H5P: ${err.message}`);
        resetH5pApp();
      }
    };

    reader.readAsArrayBuffer(file);
  }

  // Process H5P InfoWall data and build row array
  function processH5pData(data) {
    const properties = data.infoWall.propertiesGroup.properties || [];
    
    // Extracted columns: "Nombre", properties labels, "Url"
    h5pExtractedHeaders = ['Nombre'];
    properties.forEach(p => {
      h5pExtractedHeaders.push(p.label || 'Campo');
    });
    // Add "Url" column in case we parse links
    h5pExtractedHeaders.push('Url');

    h5pExtractedRows = [];
    const panels = data.infoWall.panels || [];

    panels.forEach(panel => {
      const panelTitle = panel.panelTitle || '';
      const entries = panel.entries || [];
      
      const row = {
        'Nombre': panelTitle
      };

      let extractedUrl = '';

      properties.forEach((prop, idx) => {
        const label = prop.label || 'Campo';
        let val = entries[idx] || '';

        // If description column, check if it contains the URL link pattern
        if (label.toLowerCase().includes('desc') && typeof val === 'string') {
          // Check for link pattern: <br><br><a href='{url_link}' target='_blank'>🔗 Más información</a>
          // We will use a regular expression to extract the URL and strip it from the description
          const linkRegex = /<br\s*\/?>\s*<br\s*\/?>\s*<a\s+[^>]*href=['"]([^'"]+)['"][^>]*>🔗\s*Más\s+información<\/a>/i;
          const match = val.match(linkRegex);
          if (match) {
            extractedUrl = match[1];
            // Strip the link from the description text
            val = val.replace(linkRegex, '').trim();
          } else {
            // Check for simpler link pattern: <a href='{url_link}' ...>...</a>
            const simpleLinkRegex = /<a\s+[^>]*href=['"]([^'"]+)['"][^>]*>[^<]+<\/a>/i;
            const simpleMatch = val.match(simpleLinkRegex);
            if (simpleMatch) {
              extractedUrl = simpleMatch[1];
              // Strip simple link
              val = val.replace(simpleLinkRegex, '').trim();
            }
          }
        }

        row[label] = val;
      });

      row['Url'] = extractedUrl;
      h5pExtractedRows.push(row);
    });

    renderH5pPreview();
    h5pPreviewStep.classList.remove('hidden');
  }

  // Render extracted H5P preview table
  function renderH5pPreview() {
    h5pPreviewTableHeader.innerHTML = '';
    h5pPreviewTableBody.innerHTML = '';

    // Add headers
    h5pExtractedHeaders.forEach(header => {
      const th = document.createElement('th');
      th.textContent = header;
      h5pPreviewTableHeader.appendChild(th);
    });

    // Add rows preview (max 5 rows)
    const previewRows = h5pExtractedRows.slice(0, 5);
    previewRows.forEach(row => {
      const tr = document.createElement('tr');
      h5pExtractedHeaders.forEach(header => {
        const td = document.createElement('td');
        td.textContent = row[header] || '';
        tr.appendChild(td);
      });
      h5pPreviewTableBody.appendChild(tr);
    });
  }

  // Reset H5P reverse mode
  function resetH5pApp() {
    h5pExtractedHeaders = [];
    h5pExtractedRows = [];
    h5pFileInput.value = '';
    
    h5pFileInfoBox.classList.add('hidden');
    h5pUploadZone.classList.remove('hidden');
    h5pPreviewStep.classList.add('hidden');
  }

  // Export extracted data to ODS / XLSX
  function exportToSpreadsheet(isOds) {
    if (h5pExtractedRows.length === 0) return;

    try {
      // Convert row objects to AOA (Array of Arrays)
      const dataToExport = [h5pExtractedHeaders];
      
      h5pExtractedRows.forEach(row => {
        const rowData = h5pExtractedHeaders.map(header => row[header] || '');
        dataToExport.push(rowData);
      });

      const worksheet = XLSX.utils.aoa_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Inventario Extraido");

      const fileType = isOds ? 'ods' : 'xlsx';
      const output = XLSX.write(workbook, { bookType: fileType, type: 'array' });
      
      const mime = isOds 
        ? 'application/vnd.oasis.opendocument.spreadsheet' 
        : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      
      const blob = new Blob([output], { type: mime });
      saveAs(blob, `inventario_extraido.${fileType}`);
      
      showToast(`Exportación a ${fileType.toUpperCase()} completada.`);
    } catch (err) {
      console.error(err);
      alert(`Error al exportar la hoja de cálculo: ${err.message}`);
    }
  }

  // Toast message utility
  function showToast(message) {
    // Basic browser alert or console.log. Let's make a beautiful floating element
    const toast = document.createElement('div');
    toast.style.position = 'fixed';
    toast.style.bottom = '20px';
    toast.style.right = '20px';
    toast.style.background = 'rgba(99, 102, 241, 0.95)';
    toast.style.border = '1px solid rgba(255, 255, 255, 0.15)';
    toast.style.color = '#fff';
    toast.style.padding = '0.75rem 1.5rem';
    toast.style.borderRadius = '8px';
    toast.style.fontSize = '0.9rem';
    toast.style.fontWeight = '500';
    toast.style.zIndex = '2000';
    toast.style.boxShadow = '0 10px 25px rgba(0,0,0,0.3)';
    toast.style.backdropFilter = 'blur(8px)';
    toast.style.animation = 'slideDown 0.3s reverse';
    toast.textContent = message;
    
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.5s ease';
      setTimeout(() => toast.remove(), 500);
    }, 3000);
  }

  // --- Generation Logic ---

  function startGeneration() {
    isProcessing = true;
    processCancelled = false;
    
    // Reset Modal UI
    progressFill.style.width = '0%';
    percentText.textContent = '0%';
    progressText.textContent = 'Preparando...';
    consoleBox.innerHTML = '';
    
    processingDashboard.classList.remove('hidden');
    successCard.classList.add('hidden');
    cancelProcessBtn.classList.remove('hidden');
    modalCloseBtn.classList.add('hidden');
    
    modalOverlay.classList.add('active');

    // Run processing
    executeProcess();
  }

  async function executeProcess() {
    try {
      logToConsole('Iniciando empaquetado H5P...', 'info');
      
      const mappings = {};
      H5P_FIELDS.forEach(field => {
        mappings[field.id] = document.getElementById(field.id).value;
      });

      const enablePixabay = enablePixabayCheckbox.checked;
      const pixabayKey = apiKeyInput.value.trim();
      const pixabayLang = queryLangSelect.value;
      
      // Get title and meta
      const infoWallTitle = infoWallTitleInput.value.trim() || 'Catálogo de Actividades';
      const h5pLang = h5pLangInput.value.trim() || 'es';
      
      if (!mappings['field-id']) {
        throw new Error('Debes mapear obligatoriamente la columna para el Nombre de la actividad.');
      }

      // 1. Prepare base template
      const h5pTemplate = {
        "infoWall": {
          "propertiesGroup": {
            "properties": [
              {"label": "Título", "showLabel": false, "searchInProperty": true, "styling": {"bold": true, "italic": false}},
              {"label": "Descripción", "showLabel": false, "searchInProperty": true, "styling": {"bold": false, "italic": false}},
              {"label": "Proyecto", "showLabel": true, "searchInProperty": true, "styling": {"bold": true, "italic": false}},
              {"label": "Categoría", "showLabel": true, "searchInProperty": true, "styling": {"bold": true, "italic": false}},
              {"label": "Etiquetas", "showLabel": true, "searchInProperty": true, "styling": {"bold": false, "italic": true}}
            ]
          },
          "panels": []
        },
        "behaviour": {
          "useFallbackImage": false, 
          "imageWidth": 150, 
          "imageHeight": 150,
          "alternateBackground": true, 
          "offerFilterField": true, 
          "modeFilterField": "and"
        },
        "l10n": {
          "noEntriesError": "El autor no ha introducido ningún dato.",
          "noMatchesForFilter": "No hay resultados para @query.",
          "enterToFilter": "Introduce un texto para filtrar el contenido.",
          "listChanged": "Lista cambiada. Mostrando @visible de @total elementos."
        },
        "header": infoWallTitle
      };

      logToConsole(`Configurado título de InfoWall: "${infoWallTitle}"`, 'info');
      logToConsole(`Fila mapeada como Nombre/ID: "${mappings['field-id']}"`, 'info');

      // Create JSZip structures
      const zipFull = new JSZip(); // Full .h5p
      const zipBundle = new JSZip(); // Raw bundle (notebook output)
      
      const imagesFolderFull = zipFull.folder('content/images');
      const imagesFolderBundle = zipBundle.folder('images');
      
      // Process unique images map to avoid downloading duplicates
      const downloadedImages = {}; // query -> filename

      const totalRows = parsedRows.length;
      let processedCount = 0;
      let validItemsCount = 0;

      // Rate limit helper
      const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

      for (let i = 0; i < totalRows; i++) {
        if (processCancelled) {
          logToConsole('Proceso cancelado por el usuario.', 'error');
          break;
        }

        const row = parsedRows[i];
        const originalNameVal = row[mappings['field-id']];

        if (!originalNameVal || originalNameVal.toString().trim() === "") {
          processedCount++;
          updateProgress(processedCount, totalRows, `Fila ${i+2}: Nombre vacío. Omitiendo.`);
          continue;
        }

        const originalName = originalNameVal.toString().trim();
        logToConsole(`Procesando (${i+1}/${totalRows}): ${originalName}`, 'info');

        const cleanedName = cleanActivityName(originalName);
        let imageFilename = '';
        let imageMime = 'image/jpeg';
        let imageData = null;

        // Try downloading/searching image
        if (enablePixabay) {
          try {
            if (downloadedImages[cleanedName]) {
              imageFilename = downloadedImages[cleanedName];
              logToConsole(`  -> Reutilizando imagen ya descargada para: "${cleanedName}"`, 'info');
            } else {
              // Search Pixabay
              logToConsole(`  -> Buscando en Pixabay para: "${cleanedName}"...`, 'info');
              const searchUrl = `https://pixabay.com/api/?key=${pixabayKey}&q=${encodeURIComponent(cleanedName)}&image_type=illustration&per_page=3&safesearch=true&lang=${pixabayLang}`;
              
              const response = await fetch(searchUrl);
              
              if (response.status === 429) {
                logToConsole('  -> Pixabay: Límite de API alcanzado. Esperando 10 segundos...', 'warning');
                await delay(10000);
                // Retry once
                const responseRetry = await fetch(searchUrl);
                if (responseRetry.ok) {
                  const data = await responseRetry.json();
                  imageData = await downloadPixabayHit(data, cleanedName);
                } else {
                  logToConsole('  -> Reintento fallido, usando fallback.', 'warning');
                }
              } else if (response.ok) {
                const data = await response.json();
                imageData = await downloadPixabayHit(data, cleanedName);
              } else {
                logToConsole(`  -> Error HTTP en Pixabay (${response.status}). Usando fallback.`, 'warning');
              }
              
              // If successfully fetched Pixabay image
              if (imageData) {
                const uuidPart = generateUUID().substring(0, 6);
                imageFilename = getSafeFilename(cleanedName, uuidPart);
                downloadedImages[cleanedName] = imageFilename;
                imageMime = imageData.mime;
              }
              
              // Small polite delay between API requests to avoid rate limits
              await delay(500);
            }
          } catch (apiErr) {
            logToConsole(`  -> Excepción en Pixabay: ${apiErr.message}. Usando fallback.`, 'warning');
          }
        }

        // If no image from Pixabay, generate a beautiful custom vector fallback SVG card
        if (!imageData && !imageFilename) {
          const fallbackSvgText = generateFallbackSvg(originalName);
          const svgBlob = new Blob([fallbackSvgText], { type: 'image/svg+xml' });
          const svgArrayBuffer = await svgBlob.arrayBuffer();
          
          const uuidPart = generateUUID().substring(0, 6);
          imageFilename = getSafeFilename(cleanedName, uuidPart).replace('.jpg', '.svg');
          imageMime = 'image/svg+xml';
          imageData = {
            data: svgArrayBuffer,
            mime: imageMime
          };
        }

        // Add image data to ZIPs
        if (imageData) {
          imagesFolderFull.file(imageFilename, imageData.data);
          imagesFolderBundle.file(imageFilename, imageData.data);
        }

        // Build text fields using mappings
        const titulo_col = mappings['field-title'];
        const titulo_txt = (titulo_col && row[titulo_col] && row[titulo_col].toString().trim()) 
          ? row[titulo_col].toString().trim() 
          : originalName;

        let descripcion_txt = (mappings['field-desc'] && row[mappings['field-desc']]) 
          ? row[mappings['field-desc']].toString().trim() 
          : '';
        const proyecto_txt = (mappings['field-project'] && row[mappings['field-project']]) 
          ? row[mappings['field-project']].toString().trim() 
          : '';
        const categoria_txt = (mappings['field-category'] && row[mappings['field-category']]) 
          ? row[mappings['field-category']].toString().trim() 
          : '';
        const etiquetas_txt = (mappings['field-tags'] && row[mappings['field-tags']]) 
          ? row[mappings['field-tags']].toString().trim() 
          : '';
        
        const url_col = mappings['field-url'];
        const url_link = (url_col && row[url_col]) ? row[url_col].toString().trim() : '';

        if (url_link) {
          descripcion_txt += `<br><br><a href='${url_link}' target='_blank'>🔗 Más información</a>`;
        }

        // Create the H5P panel object
        const panel = {
          "panelTitle": originalName,
          "image": {
            "params": {
              "file": {
                "path": `images/${imageFilename}`, 
                "mime": imageMime, 
                "copyright": {"license": "U"}
              },
              "alt": `Ilustración de ${originalName}`
            },
            "library": "H5P.Image 1.1",
            "subContentId": generateUUID(),
            "metadata": {
              "contentType": "Imagen", 
              "license": "U", 
              "title": originalName
            }
          },
          "entries": [
            titulo_txt,
            descripcion_txt,
            proyecto_txt,
            categoria_txt,
            etiquetas_txt
          ],
          "keywords": ""
        };

        h5pTemplate.infoWall.panels.push(panel);
        validItemsCount++;
        processedCount++;
        
        // Update UI
        updateProgress(processedCount, totalRows, `Elemento añadido: "${originalName}"`);
      }

      if (processCancelled) {
        isProcessing = false;
        cancelProcessBtn.classList.add('hidden');
        modalCloseBtn.classList.remove('hidden');
        return;
      }

      // 2. Generate and Add content.json files to ZIPs
      const contentJsonString = JSON.stringify(h5pTemplate, null, 4);
      
      // Full .h5p structures require it inside content/content.json
      zipFull.file('content/content.json', contentJsonString);
      
      // Raw bundle requires it in root
      zipBundle.file('content.json', contentJsonString);

      // 3. Create h5p.json for Full .h5p
      const h5pJson = {
        "title": infoWallTitle,
        "mainLibrary": "H5P.InfoWall",
        "language": h5pLang,
        "embedTypes": ["div"],
        "preloadedDependencies": [
          {
            "machineName": "H5P.InfoWall",
            "majorVersion": 0,
            "minorVersion": 4
          },
          {
            "machineName": "H5P.Image",
            "majorVersion": 1,
            "minorVersion": 1
          },
          {
            "machineName": "FontAwesome",
            "majorVersion": 4,
            "minorVersion": 5
          }
        ]
      };
      zipFull.file('h5p.json', JSON.stringify(h5pJson, null, 4));

      logToConsole('Compilando archivos ZIP en el navegador...', 'info');

      // 4. Generate the downloadable packages
      const h5pBlob = await zipFull.generateAsync({ type: 'blob' });
      const bundleBlob = await zipBundle.generateAsync({ type: 'blob' });

      // Set download actions
      const safeTitle = infoWallTitle.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
      
      downloadH5pBtn.onclick = () => {
        saveAs(h5pBlob, `${safeTitle}.h5p`);
        showToast('Descargando archivo H5P...');
      };

      downloadZipBtn.onclick = () => {
        saveAs(bundleBlob, `${safeTitle}_content_bundle.zip`);
        showToast('Descargando paquete de contenidos...');
      };

      logToConsole(`¡Éxito! Se empaquetaron ${validItemsCount} elementos activos.`, 'success');
      
      // Transition UI to success
      isProcessing = false;
      cancelProcessBtn.classList.add('hidden');
      modalCloseBtn.classList.remove('hidden');
      
      processingDashboard.classList.add('hidden');
      successCard.classList.style = 'display: flex';
      
      // Throw confetti!
      runConfetti();

    } catch (err) {
      console.error(err);
      logToConsole(`ERROR CRÍTICO: ${err.message}`, 'error');
      isProcessing = false;
      cancelProcessBtn.classList.add('hidden');
      modalCloseBtn.classList.remove('hidden');
    }
  }

  // Helper to resolve and download Pixabay image
  async function downloadPixabayHit(data, query) {
    if (!data.hits || data.hits.length === 0) {
      logToConsole(`  -> Pixabay: Sin resultados para "${query}". Usando fallback.`, 'warning');
      return null;
    }

    const hit = data.hits[0];
    const webUrl = hit.webformatURL;
    logToConsole(`  -> Pixabay: Descargando ilustración desde: ${webUrl}...`, 'info');
    
    try {
      const response = await fetch(webUrl);
      if (!response.ok) throw new Error(`Status ${response.status}`);
      
      const buffer = await response.arrayBuffer();
      // Inspect content type
      let mime = response.headers.get('content-type') || 'image/jpeg';
      
      return {
        data: buffer,
        mime: mime
      };
    } catch (downloadErr) {
      logToConsole(`  -> Error al descargar imagen: ${downloadErr.message}. Usando fallback.`, 'warning');
      return null;
    }
  }

  // Generate beautiful customized SVG vector fallback card
  function generateFallbackSvg(itemName) {
    // Escape item name for SVG xml safety
    const escapedName = itemName
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
      
    // Truncate name for display on the card
    const displayName = escapedName.length > 25 ? escapedName.substring(0, 22) + '...' : escapedName;

    // Pick a deterministic gradient based on name hash
    let hash = 0;
    for (let i = 0; i < itemName.length; i++) {
      hash = itemName.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue1 = Math.abs(hash % 360);
    const hue2 = (hue1 + 60) % 360;

    return `
      <svg width="400" height="267" viewBox="0 0 400 267" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="gradient-${hue1}" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="hsl(${hue1}, 70%, 45%)" />
            <stop offset="100%" stop-color="hsl(${hue2}, 80%, 30%)" />
          </linearGradient>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>
          </pattern>
        </defs>
        <rect width="400" height="267" fill="url(#gradient-${hue1})" />
        <rect width="400" height="267" fill="url(#grid)" />
        
        <!-- Graphic decoration -->
        <circle cx="200" cy="110" r="45" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="4" />
        <circle cx="200" cy="110" r="30" fill="rgba(255,255,255,0.1)" />
        <path d="M 185 110 L 215 110 M 200 95 L 200 125" stroke="rgba(255,255,255,0.25)" stroke-width="3" stroke-linecap="round" />
        
        <!-- Text -->
        <rect x="20" y="180" width="360" height="67" rx="8" fill="rgba(0,0,0,0.3)" backdrop-filter="blur(5px)" />
        <text x="50%" y="208" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Outfit', sans-serif" font-size="16" fill="#ffffff" font-weight="700" letter-spacing="-0.5px">
          ${displayName}
        </text>
        <text x="50%" y="230" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Outfit', sans-serif" font-size="11" fill="rgba(255,255,255,0.55)" font-weight="600" letter-spacing="1px">
          CATÁLOGO CEP LAS PALMAS
        </text>
      </svg>
    `.trim();
  }

  // Update generation progress bar and label
  function updateProgress(curr, total, text) {
    const percent = Math.round((curr / total) * 100);
    progressFill.style.width = `${percent}%`;
    percentText.textContent = `${percent}%`;
    progressText.textContent = `Procesando fila ${curr} de ${total}...`;
    logToConsole(text, 'info');
  }

  // Append a message to the integrated console box
  function logToConsole(message, type = 'info') {
    const log = document.createElement('div');
    log.className = `log-item ${type}`;
    
    // Add timestamp
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    
    log.textContent = `[${timeStr}] ${message}`;
    consoleBox.appendChild(log);
    
    // Scroll to bottom
    consoleBox.scrollTop = consoleBox.scrollHeight;
  }

  // Clean patterns from query string
  function cleanActivityName(name) {
    if (!name) return "";
    return name.toString().replace(/\(\+\d+\)/g, "").replace(/#[0-9a-zA-Z\-]+/g, "").trim();
  }

  // File size formatting helper
  function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  // Safe file downloader for Blob data
  function saveAs(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Generate safe filename for assets
  function getSafeFilename(name, uuidPart) {
    const safe = name.toString()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // remove accents
      .replace(/[^a-zA-Z0-9]/g, "_")
      .substring(0, 20);
    return `${safe}_${uuidPart}.jpg`;
  }

  // Standard UUID generator
  function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  // High performance Canvas Confetti
  function runConfetti() {
    const canvas = document.createElement('canvas');
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '1500';
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    const colors = ['#6366f1', '#06b6d4', '#d946ef', '#10b981', '#fbbf24'];
    const particles = [];

    // Resize handler
    window.addEventListener('resize', () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    });

    for (let i = 0; i < 150; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height - height,
        r: Math.random() * 6 + 4,
        d: Math.random() * height,
        color: colors[Math.floor(Math.random() * colors.length)],
        tilt: Math.random() * 10 - 5,
        tiltAngleIncremental: Math.random() * 0.07 + 0.02,
        tiltAngle: 0
      });
    }

    let animationFrameId;
    function draw() {
      ctx.clearRect(0, 0, width, height);

      let activeParticles = 0;
      particles.forEach((p) => {
        p.tiltAngle += p.tiltAngleIncremental;
        p.y += (Math.cos(p.d) + 3 + p.r / 2) / 2;
        p.x += Math.sin(p.tiltAngle);
        p.tilt = Math.sin(p.tiltAngle - activeParticles / 3) * 15;

        if (p.y < height) {
          activeParticles++;
        }

        ctx.beginPath();
        ctx.lineWidth = p.r;
        ctx.strokeStyle = p.color;
        ctx.moveTo(p.x + p.tilt + p.r / 2, p.y);
        ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 2);
        ctx.stroke();
      });

      if (activeParticles > 0) {
        animationFrameId = requestAnimationFrame(draw);
      } else {
        canvas.remove();
      }
    }

    draw();
    setTimeout(() => {
      cancelAnimationFrame(animationFrameId);
      canvas.remove();
    }, 6000);
  }
});
