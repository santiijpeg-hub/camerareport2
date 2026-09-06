// --- BASE DE DATOS LOCAL ---
const PROJECTS_KEY = 'camlog_projects_v2';
let projects = JSON.parse(localStorage.getItem(PROJECTS_KEY)) || [];
let currentProjectId = null;
let currentEntries = [];

function saveProjects() { localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects)); }
function getEntriesKey(id) { return `camlog_entries_${id}`; }
function loadEntries(id) { return JSON.parse(localStorage.getItem(getEntriesKey(id))) || []; }
function saveEntries(id, entries) { localStorage.setItem(getEntriesKey(id), JSON.stringify(entries)); }
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2,7); }
function todayISO() { return new Date().toISOString().slice(0, 10); }

// Lista de cámaras disponibles para el selector desplegable
const CAMERA_MODELS = [
  "ARRI ALEXA 35",
  "ARRI ALEXA MINI",
  "ARRI ALEXA MINI LF",
  "ARRIFLEX SR3",
  "FX3",
  "FX6",
  "BMPCC6K",
  "BMPCC4K",
  "RED KOMODO 6K",
  "RED V-RAPTOR 8K VV"
];

// Configuración de especificaciones por cámara (Codecs, Resoluciones y Espacio de Color)
const CAMERA_SPECS = {
  "ARRI ALEXA 35": {
    codecs: ["ARRIRAW", "Apple ProRes 4444 XQ", "Apple ProRes 4444", "Apple ProRes 422 HQ"],
    resolutions: [
      "4.6K 3:2 Open Gate",
      "4.6K 16:9",
      "4K 16:9",
      "4K 2:1",
      "3.8K 16:9",
      "3.3K 6:5",
      "3K 1:1",
      "2.7K 8:9",
      "2K 16:9 S16"
    ],
    fixedColorSpace: "Log C4"
  },
  "ARRI ALEXA MINI": {
    codecs: ["ARRIRAW", "ProRes 4444 XQ", "ProRes 4444", "ProRes 422 HQ", "ProRes 422", "ProRes 422 LT"],
    resolutions: [
      "S16 HD",
      "HD",
      "2K",
      "3.2K",
      "4K UHD",
      "4:3 2.8K",
      "2.39:1 2K Anamorphic",
      "HD Anamorphic",
      "ARRIRAW 16:9 2.8K",
      "Open Gate 3.4K"
    ],
    colorSpaces: ["LogC3", "AWG3"]
  },
  "ARRI ALEXA MINI LF": {
    codecs: ["ARRIRAW", "ProRes 4444 XQ", "ProRes 4444", "ProRes 422 HQ", "ProRes 422", "ProRes 422 LT"],
    resolutions: [
      "4.5K LF 3:2 Open Gate",
      "4.5K LF 2.39:1",
      "4.3K LF 16:9",
      "3.8K LF 16:9",
      "2K Full HD",
      "2.8K LF 1:1",
      "3.4K S35 3:2",
      "3.2K S35 16:9",
      "3.2K S35 4:3",
      "2.8K S35 16:9"
    ],
    colorSpaces: ["LogC3", "AWG3"]
  },
  "FX6": {
    codecs: ["XAVC-I", "XAVC-L", "RAW"],
    resolutions: [
      "4K DCI",
      "4K UHD",
      "1080p"
    ],
    colorSpaces: ["S-Gamut3.Cine", "S-Gamut3"]
  },
  "FX3": {
    codecs: ["XAVC S-I", "XAVC S", "XAVC HS"],
    resolutions: [
      "4K DCI",
      "4K UHD",
      "1080p"
    ],
    colorSpaces: ["S-Gamut3.Cine", "S-Gamut3"]
  },
  "RED KOMODO 6K": {
    codecs: ["REDCODE RAW", "ProRes 422 HQ", "ProRes 422"],
    resolutions: [
      "6K 17:9",
      "6K 2.4:1",
      "6K 2:1",
      "6K 16:9",
      "5K 17:9",
      "4K 17:9",
      "4K 16:9",
      "2K 17:9"
    ],
    fixedColorSpace: "REDWideGamutRGB"
  },
  "BMPCC6K": {
    codecs: [
      "Blackmagic RAW 3:1", "Blackmagic RAW 5:1", "Blackmagic RAW 8:1", "Blackmagic RAW 12:1",
      "Blackmagic RAW Q0", "Blackmagic RAW Q1", "Blackmagic RAW Q3", "Blackmagic RAW Q5",
      "ProRes 422 HQ", "ProRes 422", "ProRes 422 LT", "ProRes Proxy"
    ],
    resolutions: [
      "6K 17:9",
      "6K 2.4:1",
      "5.7K 17:9",
      "4K DCI",
      "4K UHD",
      "3.7K 6:5 Anamorphic",
      "2.8K 17:9",
      "1080 HD"
    ],
    fixedColorSpace: "Blackmagic Design Generation 5"
  },
  "BMPCC4K": {
    codecs: [
      "Blackmagic RAW 3:1", "Blackmagic RAW 5:1", "Blackmagic RAW 8:1", "Blackmagic RAW 12:1",
      "Blackmagic RAW Q0", "Blackmagic RAW Q5",
      "ProRes 422 HQ", "ProRes 422", "ProRes 422 LT", "ProRes Proxy"
    ],
    resolutions: [
      "4K DCI",
      "4K 2.4:1",
      "4K UHD",
      "2.8K 4:3 Anamorphic",
      "2.6K 16:9",
      "1080 HD"
    ],
    colorSpaces: ["Blackmagic Design Generation 4", "Blackmagic Design Generation 5"]
  },
  "RED V-RAPTOR 8K VV": {
    codecs: ["REDCODE RAW HQ", "REDCODE RAW MQ", "REDCODE RAW LQ"],
    resolutions: [
      "8K 17:9", "8K 2:1", "8K 2.4:1", "8K 16:9", "8K 1:1",
      "7K 17:9", "7K 2:1", "7K 2.4:1", "7K 16:9", "7K 1:1",
      "6K 17:9", "6K 2:1", "6K 2.4:1", "6K 16:9", "6K 1:1",
      "5K 17:9", "5K 2:1", "5K 2.4:1", "5K 16:9", "5K 1:1",
      "4K 17:9", "4K 2:1", "4K 2.4:1", "4K 16:9", "4K 1:1",
      "3K 17:9", "3K 2:1", "3K 2.4:1", "3K 16:9", "3K 1:1",
      "2K 17:9", "2K 2:1", "2K 2.4:1", "2K 16:9", "2K 1:1"
    ],
    fixedColorSpace: "REDWideGamutRGB"
  },
  "ARRIFLEX SR3": {
    codecs: ["Película 16 mm"],
    resolutions: [
      "Normal 16",
      "Super 16"
    ],
    colorSpaces: [
      "Kodak VISION3 50D 7203",
      "Kodak VISION3 200T 7213",
      "Kodak VISION3 250D 7207",
      "Kodak VISION3 500T 7219",
      "Kodak VERITA 200D 7206",
      "Kodak EASTMAN DOUBLE-X 7222",
      "Kodak EKTACHROME 100D 7294",
      "Kodak TRI-X 7266"
    ]
  }
};

// --- NAVEGACIÓN ---
const views = {
  home: document.getElementById('view-home'),
  newProject: document.getElementById('view-new-project'),
  myProjects: document.getElementById('view-my-projects'),
  entries: document.getElementById('view-entries')
};

function showView(viewName) {
  Object.values(views).forEach(v => v.classList.add('hidden'));
  views[viewName].classList.remove('hidden');
}

// Botones Home
document.getElementById('btnNewProject').addEventListener('click', openNewProjectCreation);
document.getElementById('btnListNewProject').addEventListener('click', openNewProjectCreation);

document.getElementById('btnMyProjects').addEventListener('click', () => {
  renderProjects(); 
  showView('myProjects');
});

// Botones Volver
document.getElementById('btnBackHome').addEventListener('click', () => showView('home'));
document.getElementById('btnBackFromProjects').addEventListener('click', () => showView('home'));
document.getElementById('btnBackToProjects').addEventListener('click', () => {
  renderProjects(); 
  showView('myProjects');
});

// Inicialización de eventos para dependencias de cámara
document.addEventListener('DOMContentLoaded', () => {
  populateCameraModelOptions();
  setupCameraModelListener();
  setupEntriesViewAndExport();
});

function populateCameraModelOptions() {
  const camModelEl = document.getElementById('p_cam_model');
  if (camModelEl && camModelEl.tagName === 'SELECT') {
    camModelEl.innerHTML = '<option value="">- Seleccionar cámara -</option>';
    CAMERA_MODELS.forEach(model => {
      const opt = document.createElement('option');
      opt.value = model;
      opt.textContent = model;
      camModelEl.appendChild(opt);
    });
  }
}

function setupCameraModelListener() {
  const camModelEl = document.getElementById('p_cam_model');
  if (camModelEl) {
    camModelEl.addEventListener('change', (e) => {
      updateCameraDependentFields(e.target.value);
    });
  }
}

function updateCameraDependentFields(selectedCamera, savedCodec = '', savedRes = '', savedColor = '') {
  const codecEl = document.getElementById('p_cam_codec');
  const resEl = document.getElementById('p_cam_res');
  const colorEl = document.getElementById('p_cam_colorspace');

  if (!codecEl || !resEl || !colorEl) return;

  const specs = CAMERA_SPECS[selectedCamera];

  if (specs && specs.codecs) {
    if (codecEl.tagName !== 'SELECT') transformElementToSelect(codecEl, 'p_cam_codec');
    const selectCodec = document.getElementById('p_cam_codec');
    selectCodec.innerHTML = '<option value="">- Seleccionar códec -</option>';
    specs.codecs.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c;
      opt.textContent = c;
      if (c === savedCodec) opt.selected = true;
      selectCodec.appendChild(opt);
    });
  } else {
    if (codecEl.tagName === 'SELECT') transformElementToInput(codecEl, 'p_cam_codec', 'text');
    document.getElementById('p_cam_codec').value = savedCodec;
  }

  if (specs && specs.resolutions) {
    if (resEl.tagName !== 'SELECT') transformElementToSelect(resEl, 'p_cam_res');
    const selectRes = document.getElementById('p_cam_res');
    selectRes.innerHTML = '<option value="">- Seleccionar resolución -</option>';
    specs.resolutions.forEach(r => {
      const opt = document.createElement('option');
      opt.value = r;
      opt.textContent = r;
      if (r === savedRes) opt.selected = true;
      selectRes.appendChild(opt);
    });
  } else {
    if (resEl.tagName === 'SELECT') transformElementToInput(resEl, 'p_cam_res', 'text');
    document.getElementById('p_cam_res').value = savedRes;
  }

  if (specs && specs.fixedColorSpace) {
    if (colorEl.tagName === 'SELECT') transformElementToInput(colorEl, 'p_cam_colorspace', 'text');
    const inputColor = document.getElementById('p_cam_colorspace');
    inputColor.value = specs.fixedColorSpace;
    inputColor.readOnly = true;
    inputColor.style.opacity = '0.7';
    inputColor.style.cursor = 'not-allowed';
  } else if (specs && specs.colorSpaces) {
    if (colorEl.tagName !== 'SELECT') transformElementToSelect(colorEl, 'p_cam_colorspace');
    const selectColor = document.getElementById('p_cam_colorspace');
    selectColor.innerHTML = '<option value="">- Seleccionar opción -</option>';
    specs.colorSpaces.forEach(cs => {
      const opt = document.createElement('option');
      opt.value = cs;
      opt.textContent = cs;
      if (cs === savedColor) opt.selected = true;
      selectColor.appendChild(opt);
    });
    selectColor.readOnly = false;
    selectColor.style.opacity = '1';
    selectColor.style.cursor = 'pointer';
  } else {
    if (colorEl.tagName === 'SELECT') transformElementToInput(colorEl, 'p_cam_colorspace', 'text');
    const inputColor = document.getElementById('p_cam_colorspace');
    inputColor.readOnly = false;
    inputColor.style.opacity = '1';
    inputColor.style.cursor = 'text';
    inputColor.value = savedColor;
  }
}

function transformElementToSelect(element, id) {
  const select = document.createElement('select');
  select.id = id;
  select.className = element.className;
  select.style.cssText = element.style.cssText;
  element.parentNode.replaceChild(select, element);
}

function transformElementToInput(element, id, type) {
  const input = document.createElement('input');
  input.type = type;
  input.id = id;
  input.className = element.className;
  input.style.cssText = element.style.cssText;
  element.parentNode.replaceChild(input, element);
}

// --- ESTADOS DE EDICIÓN, INFO CÁMARA, FILTROS INTERNOS, LENTES Y FILTROS ---
let editingProjectId = null; 

let projectInternalFilters = []; 
const pInternalFilterInput = document.getElementById('p_internal_filter_input');
const btnAddInternalFilter = document.getElementById('btnAddInternalFilter');
const savedInternalFiltersContainer = document.getElementById('savedInternalFiltersContainer');

let tempCurrentSetLenses = [];
let projectLensSets = []; 
let editingLensSetIndex = null; 

const pLensInput = document.getElementById('p_lens_input');
const pSetName = document.getElementById('p_set_name');
const btnAddLensToSet = document.getElementById('btnAddLensToSet');
const btnAddSet = document.getElementById('btnAddSet');
const currentSetTags = document.getElementById('currentSetTags');
const savedSetsContainer = document.getElementById('savedSetsContainer');

let tempCurrentSetFilters = [];
let projectFilterSets = []; 
let editingFilterSetIndex = null; 

const pFilterInput = document.getElementById('p_filter_input');
const pFilterSetName = document.getElementById('p_filter_set_name');
const btnAddFilterToSet = document.getElementById('btnAddFilterToSet');
const btnAddFilterSet = document.getElementById('btnAddFilterSet');
const currentFilterSetTags = document.getElementById('currentFilterSetTags');
const savedFilterSetsContainer = document.getElementById('savedFilterSetsContainer');

// --- GESTIÓN DE FILTROS INTERNOS ---
if (btnAddInternalFilter) {
  btnAddInternalFilter.addEventListener('click', () => {
    const val = pInternalFilterInput.value.trim();
    if (val && !projectInternalFilters.includes(val)) {
      projectInternalFilters.push(val);
      pInternalFilterInput.value = '';
      renderSavedInternalFilters();
    }
  });
}

function renderSavedInternalFilters() {
  if (!savedInternalFiltersContainer) return;
  savedInternalFiltersContainer.innerHTML = '';
  projectInternalFilters.forEach((filter, index) => {
    const card = document.createElement('div');
    card.className = 'lens-set-card';
    card.innerHTML = `
      <div class="lens-set-card__header">
        <h4 class="lens-set-card__title">INT F. - ${filter}</h4>
        <button type="button" onclick="removeInternalFilter(${index})" style="background:none; border:none; color:var(--text-faint); cursor:pointer;">Borrar</button>
      </div>
    `;
    savedInternalFiltersContainer.appendChild(card);
  });
}

window.removeInternalFilter = function(index) {
  projectInternalFilters.splice(index, 1);
  renderSavedInternalFilters();
}

// --- GESTIÓN DE LENTES ---
btnAddLensToSet.addEventListener('click', () => {
  const val = pLensInput.value.trim();
  if (val && !tempCurrentSetLenses.includes(val)) {
    tempCurrentSetLenses.push(val);
    renderTempSetTags();
    pLensInput.value = '';
    pLensInput.focus();
  }
});

function renderTempSetTags() {
  currentSetTags.innerHTML = '';
  tempCurrentSetLenses.forEach(lens => {
    const tag = document.createElement('div');
    tag.className = 'lens-tag';
    const lensText = lens.toLowerCase().includes('mm') ? lens : `${lens}mm`;
    tag.innerHTML = `<span>${lensText}</span> <button type="button" onclick="removeTempSetLens('${lens}')">×</button>`;
    currentSetTags.appendChild(tag);
  });
}

window.removeTempSetLens = function(lens) {
  tempCurrentSetLenses = tempCurrentSetLenses.filter(l => l !== lens);
  renderTempSetTags();
}

btnAddSet.addEventListener('click', () => {
  const setName = pSetName.value.trim() || `Set ${projectLensSets.length + 1}`;
  const pendingLens = pLensInput.value.trim();
  if (pendingLens && !tempCurrentSetLenses.includes(pendingLens)) {
    tempCurrentSetLenses.push(pendingLens);
    pLensInput.value = '';
  }

  if (tempCurrentSetLenses.length === 0) {
    alert('Añade al menos una lente o rango a este set.');
    return;
  }

  if (editingLensSetIndex !== null) {
    projectLensSets[editingLensSetIndex] = { name: setName, lenses: [...tempCurrentSetLenses] };
    editingLensSetIndex = null;
    btnAddSet.textContent = '+ GUARDAR ESTE SET';
  } else {
    projectLensSets.push({ name: setName, lenses: [...tempCurrentSetLenses] });
  }

  tempCurrentSetLenses = [];
  pSetName.value = '';
  renderTempSetTags();
  renderSavedSets();
});

window.editLensSet = function(index) {
  const set = projectLensSets[index];
  pSetName.value = set.name;
  tempCurrentSetLenses = [...set.lenses];
  editingLensSetIndex = index;
  btnAddSet.textContent = 'ACTUALIZAR ESTE SET';
  renderTempSetTags();
  renderSavedSets();
}

function renderSavedSets() {
  savedSetsContainer.innerHTML = '';
  projectLensSets.forEach((set, index) => {
    const card = document.createElement('div');
    card.className = 'lens-set-card';
    const formattedLenses = set.lenses.map(l => l.toLowerCase().includes('mm') ? l : `${l}mm`).join(', ');
    card.innerHTML = `
      <div class="lens-set-card__header">
        <h4 class="lens-set-card__title">${set.name}</h4>
        <div>
          <button type="button" onclick="editLensSet(${index})" style="background:none; border:none; color:var(--amber); cursor:pointer; margin-right:8px;">Editar</button>
          <button type="button" onclick="removeLensSet(${index})" style="background:none; border:none; color:var(--text-faint); cursor:pointer;">Borrar</button>
        </div>
      </div>
      <div style="font-size:12px; color:var(--text-lo);">${formattedLenses}</div>
    `;
    savedSetsContainer.appendChild(card);
  });
}

window.removeLensSet = function(index) {
  if (editingLensSetIndex === index) {
    editingLensSetIndex = null;
    btnAddSet.textContent = '+ GUARDAR ESTE SET';
    pSetName.value = '';
    tempCurrentSetLenses = [];
    renderTempSetTags();
  }
  projectLensSets.splice(index, 1);
  renderSavedSets();
}

// --- GESTIÓN DE FILTROS ---
btnAddFilterToSet.addEventListener('click', () => {
  const val = pFilterInput.value.trim();
  if (val && !tempCurrentSetFilters.includes(val)) {
    tempCurrentSetFilters.push(val);
    renderTempFilterSetTags();
    pFilterInput.value = '';
    pFilterInput.focus();
  }
});

function renderTempFilterSetTags() {
  currentFilterSetTags.innerHTML = '';
  tempCurrentSetFilters.forEach(filter => {
    const tag = document.createElement('div');
    tag.className = 'filter-tag';
    tag.innerHTML = `<span>${filter}</span> <button type="button" onclick="removeTempFilterSetItem('${filter}')">×</button>`;
    currentFilterSetTags.appendChild(tag);
  });
}

window.removeTempFilterSetItem = function(filter) {
  tempCurrentSetFilters = tempCurrentSetFilters.filter(f => f !== filter);
  renderTempFilterSetTags();
}

btnAddFilterSet.addEventListener('click', () => {
  const setName = pFilterSetName.value.trim() || `Set Filtros ${projectFilterSets.length + 1}`;
  const pendingFilter = pFilterInput.value.trim();
  if (pendingFilter && !tempCurrentSetFilters.includes(pendingFilter)) {
    tempCurrentSetFilters.push(pendingFilter);
    pFilterInput.value = '';
  }

  if (tempCurrentSetFilters.length === 0) {
    alert('Añade al menos un filtro a este set.');
    return;
  }

  if (editingFilterSetIndex !== null) {
    projectFilterSets[editingFilterSetIndex] = { name: setName, filters: [...tempCurrentSetFilters] };
    editingFilterSetIndex = null;
    btnAddFilterSet.textContent = '+ GUARDAR ESTE SET DE FILTROS';
  } else {
    projectFilterSets.push({ name: setName, filters: [...tempCurrentSetFilters] });
  }

  tempCurrentSetFilters = [];
  pFilterSetName.value = '';
  renderTempFilterSetTags();
  renderSavedFilterSets();
});

window.editFilterSet = function(index) {
  const set = projectFilterSets[index];
  pFilterSetName.value = set.name;
  tempCurrentSetFilters = [...set.filters];
  editingFilterSetIndex = index;
  btnAddFilterSet.textContent = 'ACTUALIZAR ESTE SET DE FILTROS';
  renderTempFilterSetTags();
  renderSavedFilterSets();
}

function renderSavedFilterSets() {
  savedFilterSetsContainer.innerHTML = '';
  projectFilterSets.forEach((set, index) => {
    const card = document.createElement('div');
    card.className = 'lens-set-card';
    const formattedFilters = set.filters.join(', ');
    card.innerHTML = `
      <div class="lens-set-card__header">
        <h4 class="lens-set-card__title">${set.name}</h4>
        <div>
          <button type="button" onclick="editFilterSet(${index})" style="background:none; border:none; color:var(--amber); cursor:pointer; margin-right:8px;">Editar</button>
          <button type="button" onclick="removeFilterSet(${index})" style="background:none; border:none; color:var(--text-faint); cursor:pointer;">Borrar</button>
        </div>
      </div>
      <div style="font-size:12px; color:var(--text-lo);">${formattedFilters}</div>
    `;
    savedFilterSetsContainer.appendChild(card);
  });
}

window.removeFilterSet = function(index) {
  if (editingFilterSetIndex === index) {
    editingFilterSetIndex = null;
    btnAddFilterSet.textContent = '+ GUARDAR ESTE SET DE FILTROS';
    pFilterSetName.value = '';
    tempCurrentSetFilters = [];
    renderTempFilterSetTags();
  }
  projectFilterSets.splice(index, 1);
  renderSavedFilterSets();
}

function resetSetsForms() {
  projectInternalFilters = [];
  if (pInternalFilterInput) pInternalFilterInput.value = '';
  renderSavedInternalFilters();

  tempCurrentSetLenses = [];
  projectLensSets = [];
  editingLensSetIndex = null;
  btnAddSet.textContent = '+ GUARDAR ESTE SET';
  pSetName.value = '';
  pLensInput.value = '';
  renderTempSetTags();
  renderSavedSets();

  tempCurrentSetFilters = [];
  projectFilterSets = [];
  editingFilterSetIndex = null;
  btnAddFilterSet.textContent = '+ GUARDAR ESTE SET DE FILTROS';
  pFilterSetName.value = '';
  pFilterInput.value = '';
  renderTempFilterSetTags();
  renderSavedFilterSets();
}

// --- ABRIR FORMULARIO CREAR / EDITAR ---
function openNewProjectCreation() {
  editingProjectId = null; 
  document.querySelector('#view-new-project .topbar-title').textContent = 'Crear Proyecto';
  document.getElementById('newProjectForm').reset();
  document.getElementById('p_date').value = todayISO();
  
  document.getElementById('p_cam_letter').value = '';
  document.getElementById('p_cam_model').value = '';
  updateCameraDependentFields('');
  document.getElementById('p_cam_codec').value = '';
  document.getElementById('p_cam_res').value = '';
  document.getElementById('p_cam_colorspace').value = '';
  document.getElementById('p_cam_aspect').value = '';
  document.getElementById('p_cam_serial').value = '';

  resetSetsForms();
  showView('newProject');
}

function openProjectEdit(proj) {
  editingProjectId = proj.id; 
  currentProjectId = proj.id;
  document.querySelector('#view-new-project .topbar-title').textContent = 'Editar Proyecto';
  
  document.getElementById('p_name').value = proj.name || '';
  document.getElementById('p_date').value = proj.date || todayISO();
  document.getElementById('p_loc').value = proj.location || '';
  document.getElementById('p_dir').value = proj.director || '';
  document.getElementById('p_dop').value = proj.dop || '';
  document.getElementById('p_1ac').value = proj.ac1 || '';
  document.getElementById('p_2ac').value = proj.ac2 || '';
  document.getElementById('p_prod').value = proj.producer || '';

  document.getElementById('p_cam_letter').value = proj.cameraLetter || '';
  const camModelVal = proj.cameraModel || '';
  document.getElementById('p_cam_model').value = camModelVal;
  
  updateCameraDependentFields(camModelVal, proj.cameraCodec || '', proj.cameraResolution || '', proj.cameraColorSpace || '');

  document.getElementById('p_cam_aspect').value = proj.cameraAspectRatio || '';
  document.getElementById('p_cam_serial').value = proj.cameraSerial || '';

  projectInternalFilters = proj.internalFilters ? [...proj.internalFilters] : [];
  renderSavedInternalFilters();

  projectLensSets = proj.lensSets ? JSON.parse(JSON.stringify(proj.lensSets)) : [];
  tempCurrentSetLenses = [];
  editingLensSetIndex = null;
  btnAddSet.textContent = '+ GUARDAR ESTE SET';
  renderTempSetTags();
  renderSavedSets();

  projectFilterSets = proj.filterSets ? JSON.parse(JSON.stringify(proj.filterSets)) : [];
  tempCurrentSetFilters = [];
  editingFilterSetIndex = null;
  btnAddFilterSet.textContent = '+ GUARDAR ESTE SET DE FILTROS';
  renderTempFilterSetTags();
  renderSavedFilterSets();

  showView('newProject');
}

document.getElementById('btnEditProject').addEventListener('click', () => {
  const proj = projects.find(p => p.id === currentProjectId);
  if (proj) openProjectEdit(proj);
});

// --- SUBMIT UNIFICADO DE PROYECTO ---
document.getElementById('newProjectForm').addEventListener('submit', (e) => {
  e.preventDefault();

  const pendingInternalFilter = pInternalFilterInput ? pInternalFilterInput.value.trim() : '';
  if (pendingInternalFilter && !projectInternalFilters.includes(pendingInternalFilter)) {
    projectInternalFilters.push(pendingInternalFilter);
    if (pInternalFilterInput) pInternalFilterInput.value = '';
  }

  const pendingSetName = pSetName.value.trim();
  const pendingLens = pLensInput.value.trim();
  if (pendingLens && !tempCurrentSetLenses.includes(pendingLens)) tempCurrentSetLenses.push(pendingLens);
  if (pendingSetName && tempCurrentSetLenses.length > 0) {
    if (editingLensSetIndex !== null) {
      projectLensSets[editingLensSetIndex] = { name: pendingSetName, lenses: [...tempCurrentSetLenses] };
      editingLensSetIndex = null;
    } else {
      projectLensSets.push({ name: pendingSetName, lenses: [...tempCurrentSetLenses] });
    }
    tempCurrentSetLenses = [];
  }

  const pendingFilterSetName = pFilterSetName.value.trim();
  const pendingFilterInputVal = pFilterInput.value.trim();
  if (pendingFilterInputVal && !tempCurrentSetFilters.includes(pendingFilterInputVal)) tempCurrentSetFilters.push(pendingFilterInputVal);
  if (pendingFilterSetName && tempCurrentSetFilters.length > 0) {
    if (editingFilterSetIndex !== null) {
      projectFilterSets[editingFilterSetIndex] = { name: pendingFilterSetName, filters: [...tempCurrentSetFilters] };
      editingFilterSetIndex = null;
    } else {
      projectFilterSets.push({ name: pendingFilterSetName, filters: [...tempCurrentSetFilters] });
    }
    tempCurrentSetFilters = [];
  }

  const formData = {
    name: document.getElementById('p_name').value.trim(),
    date: document.getElementById('p_date').value,
    location: document.getElementById('p_loc').value.trim(),
    director: document.getElementById('p_dir').value.trim(),
    dop: document.getElementById('p_dop').value.trim(),
    ac1: document.getElementById('p_1ac').value.trim(),
    ac2: document.getElementById('p_2ac').value.trim(),
    producer: document.getElementById('p_prod').value.trim(),
    cameraLetter: document.getElementById('p_cam_letter').value.trim(),
    cameraModel: document.getElementById('p_cam_model').value.trim(),
    cameraCodec: document.getElementById('p_cam_codec').value.trim(),
    cameraResolution: document.getElementById('p_cam_res').value.trim(),
    cameraColorSpace: document.getElementById('p_cam_colorspace').value.trim(),
    cameraAspectRatio: document.getElementById('p_cam_aspect').value.trim(),
    cameraSerial: document.getElementById('p_cam_serial').value.trim(),
    internalFilters: [...projectInternalFilters],
    lensSets: JSON.parse(JSON.stringify(projectLensSets)),
    filterSets: JSON.parse(JSON.stringify(projectFilterSets))
  };

  if (!formData.name) return;

  if (editingProjectId) {
    const proj = projects.find(p => p.id === editingProjectId);
    if (proj) {
      proj.name = formData.name;
      proj.date = formData.date;
      proj.location = formData.location;
      proj.director = formData.director;
      proj.dop = formData.dop;
      proj.ac1 = formData.ac1;
      proj.ac2 = formData.ac2;
      proj.producer = formData.producer;
      proj.cameraLetter = formData.cameraLetter;
      proj.cameraModel = formData.cameraModel;
      proj.cameraCodec = formData.cameraCodec;
      proj.cameraResolution = formData.cameraResolution;
      proj.cameraColorSpace = formData.cameraColorSpace;
      proj.cameraAspectRatio = formData.cameraAspectRatio;
      proj.cameraSerial = formData.cameraSerial;
      proj.internalFilters = formData.internalFilters;
      proj.lensSets = formData.lensSets;
      proj.filterSets = formData.filterSets;

      saveProjects();
      editingProjectId = null;
      e.target.reset();
      updateCameraDependentFields('');
      resetSetsForms();
      openProject(proj);
    }
  } else {
    const newProject = { id: uid(), ...formData };
    projects.unshift(newProject);
    saveProjects();
    e.target.reset();
    updateCameraDependentFields('');
    resetSetsForms();
    openProject(newProject);
  }
});

function openProject(proj) {
  currentProjectId = proj.id;
  currentEntries = loadEntries(proj.id);
  document.getElementById('currentProjectTitle').textContent = proj.name;
  
  const lensSelect = document.getElementById('f_lens');
  lensSelect.innerHTML = '<option value="">- Seleccionar lente -</option>';
  if (proj.lensSets && proj.lensSets.length > 0) {
    proj.lensSets.forEach(set => {
      const group = document.createElement('optgroup');
      group.label = set.name;
      set.lenses.forEach(l => {
        const opt = document.createElement('option');
        const lensValue = l.toLowerCase().includes('mm') ? l : `${l}mm`;
        opt.value = `${set.name} - ${lensValue}`;
        opt.textContent = `${set.name} (${lensValue})`;
        group.appendChild(opt);
      });
      lensSelect.appendChild(group);
    });
  } else {
    lensSelect.innerHTML = '<option value="">Sin sets de lentes</option>';
  }

  const internalFilterSelect = document.getElementById('f_internal_filter');
  if (internalFilterSelect) {
    internalFilterSelect.innerHTML = '<option value="">- Sin filtro interno -</option>';
    if (proj.internalFilters && proj.internalFilters.length > 0) {
      proj.internalFilters.forEach(f => {
        const opt = document.createElement('option');
        opt.value = f;
        opt.textContent = `INT F. - ${f}`;
        internalFilterSelect.appendChild(opt);
      });
    } else {
      const opt = document.createElement('option');
      opt.value = "";
      opt.textContent = "Sin filtros internos configurados";
      internalFilterSelect.appendChild(opt);
    }
  }

  loadFiltersIntoSelect(proj);
  renderEntries();
  showView('entries');
}

// --- ESTADOS PARA TOMAS ---
let tempEntryFilters = [];
let editingEntryId = null; 

const fFilterSelect = document.getElementById('f_filter_select');
const btnAddFilterToEntry = document.getElementById('btnAddFilterToEntry');
const entryFilterTags = document.getElementById('entryFilterTags');
const btnSubmitEntry = document.getElementById('btnSubmitEntry');
const btnCancelEditEntry = document.getElementById('btnCancelEditEntry');

// --- SETUP VISTA TOMAS Y EXPORTACIÓN ---
function setupEntriesViewAndExport() {
  const entryFormActions = document.getElementById('entryForm');
  if (entryFormActions && !document.getElementById('btnRestoreLastTake')) {
    const submitBtnParent = btnSubmitEntry.parentElement;
    
    const btnRestore = document.createElement('button');
    btnRestore.type = 'button';
    btnRestore.id = 'btnRestoreLastTake';
    btnRestore.textContent = 'Recuperar última toma';
    btnRestore.style.cssText = 'background: var(--surface-2, #262626); color: var(--amber); border: 1px solid var(--amber); padding: 10px; border-radius: 6px; font-weight: bold; cursor: pointer; width: 100%; margin-bottom: 8px; font-size: 13px;';
    btnRestore.onclick = restoreLastTake;
    
    submitBtnParent.insertBefore(btnRestore, btnSubmitEntry);
  }

  const entriesTopbar = document.querySelector('#view-entries .topbar');
  if (entriesTopbar && !entriesTopbar.querySelector('.btn-pdf-export')) {
    const btnExport = document.createElement('button');
    btnExport.className = 'btn-pdf-export';
    btnExport.textContent = 'Guardar y Exportar a PDF';
    btnExport.style.cssText = 'background: var(--amber); color: #000; border: none; padding: 6px 10px; border-radius: 4px; font-size: 11px; cursor: pointer; font-weight: bold; margin-left: auto;';
    btnExport.onclick = exportToPDF;
    
    entriesTopbar.style.display = 'flex';
    entriesTopbar.style.alignItems = 'center';
    entriesTopbar.appendChild(btnExport);
  }

  const printStyle = document.createElement('style');
  printStyle.innerHTML = `
    @media print {
      @page {
        size: landscape;
        margin: 1cm;
      }
      body { background: #fff !important; color: #000 !important; margin: 0; padding: 0; }
      
      #view-home, #view-new-project, #view-my-projects, #view-entries > *:not(#printArea), .bottom-nav { display: none !important; }
      
      #printArea { display: block !important; width: 100%; max-width: 100%; color: #000; font-family: sans-serif; }
      
      .pdf-header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 10px; }
      .pdf-header h1 { font-size: 24px; margin: 0; font-weight: 800; letter-spacing: 1px; }
      .pdf-header h2 { font-size: 16px; margin: 5px 0 0 0; font-weight: 600; text-transform: uppercase; }
      
      .pdf-info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px; font-size: 11px; line-height: 1.4; width: 100%; }
      .pdf-info-box { border: 1px solid #000; padding: 10px; border-radius: 4px; }
      .pdf-info-box strong { font-size: 12px; display: block; border-bottom: 1px solid #ccc; margin-bottom: 5px; padding-bottom: 3px; }
      
      .pdf-table { width: 100%; max-width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 10px; page-break-inside: auto; table-layout: auto; }
      .pdf-table tr { page-break-inside: avoid; page-break-after: auto; }
      .pdf-table th, .pdf-table td { border: 1px solid #000; padding: 4px; text-align: left; vertical-align: top; color: #000; }
      .pdf-table th { background-color: #e0e0e0 !important; -webkit-print-color-adjust: exact; font-weight: bold; text-align: center; white-space: nowrap; }
      .pdf-table td { text-align: center; }
      
      .pdf-table td:nth-child(15) { text-align: left; }
      
      .pdf-take-good td { background-color: #d4edda !important; -webkit-print-color-adjust: exact; }
    }
  `;
  document.head.appendChild(printStyle);
}

// --- ACTUALIZACIÓN VISUAL DEL BOTÓN GOOD TOMA ---
let goodPressed = false;
const goodToggle = document.getElementById('goodToggle');

function updateGoodToggleVisuals(isGood) {
  if (isGood) {
    goodToggle.style.backgroundColor = 'var(--amber, #f59e0b)';
    goodToggle.style.color = '#000';
  } else {
    goodToggle.style.backgroundColor = '';
    goodToggle.style.color = '';
  }
}

goodToggle.addEventListener('click', () => {
  goodPressed = !goodPressed;
  goodToggle.setAttribute('aria-pressed', String(goodPressed));
  updateGoodToggleVisuals(goodPressed);
});

function restoreLastTake() {
  if (!currentEntries || currentEntries.length === 0) {
    alert('No hay ninguna toma anterior registrada en este proyecto.');
    return;
  }

  const last = currentEntries[0];

  document.getElementById('f_roll').value = last.roll || '';
  document.getElementById('f_card').value = last.card || '';
  document.getElementById('f_clip').value = last.clip || '';
  
  if (document.getElementById('f_internal_filter')) {
    document.getElementById('f_internal_filter').value = last.internalFilter || '';
  }
  
  document.getElementById('f_sequence').value = last.sequence || '';
  document.getElementById('f_shot').value = last.shot || '';
  document.getElementById('f_take').value = last.take || '';
  document.getElementById('f_lens').value = last.lens || '';
  document.getElementById('f_ft').value = last.ft || '';
  document.getElementById('f_k').value = last.k || '';
  document.getElementById('f_iso').value = last.iso || '';
  document.getElementById('f_shutter').value = last.shutter || '';
  document.getElementById('f_fps').value = last.fps || '';
  document.getElementById('f_note').value = last.note || '';

  tempEntryFilters = last.filters ? [...last.filters] : (last.filter ? [last.filter] : []);
  renderEntryFilterTags();

  goodPressed = Boolean(last.good);
  goodToggle.setAttribute('aria-pressed', String(goodPressed));
  updateGoodToggleVisuals(goodPressed);
}

btnAddFilterToEntry.addEventListener('click', () => {
  const val = fFilterSelect.value;
  if (val && !tempEntryFilters.includes(val)) {
    tempEntryFilters.push(val);
    renderEntryFilterTags();
    fFilterSelect.value = '';
  }
});

function renderEntryFilterTags() {
  entryFilterTags.innerHTML = '';
  tempEntryFilters.forEach(filter => {
    const tag = document.createElement('div');
    tag.className = 'filter-tag';
    tag.innerHTML = `<span>${filter}</span> <button type="button" onclick="removeEntryFilter('${filter}')">×</button>`;
    entryFilterTags.appendChild(tag);
  });
}

window.removeEntryFilter = function(filter) {
  tempEntryFilters = tempEntryFilters.filter(f => f !== filter);
  renderEntryFilterTags();
}

function loadFiltersIntoSelect(proj) {
  fFilterSelect.innerHTML = '<option value="">- Seleccionar filtro -</option>';
  if (proj.filterSets && proj.filterSets.length > 0) {
    proj.filterSets.forEach(set => {
      const group = document.createElement('optgroup');
      group.label = set.name;
      set.filters.forEach(f => {
        const opt = document.createElement('option');
        const filterVal = `${set.name} - ${f}`;
        opt.value = filterVal;
        opt.textContent = `${set.name} (${f})`;
        group.appendChild(opt);
      });
      fFilterSelect.appendChild(group);
    });
  } else {
    const opt = document.createElement('option');
    opt.value = "Libre";
    opt.textContent = "Sin sets de filtros configurados";
    fFilterSelect.appendChild(opt);
  }
}

document.getElementById('entryForm').addEventListener('submit', (e) => {
  e.preventDefault();
  if(!currentProjectId) return;

  const entryData = {
    roll: document.getElementById('f_roll').value.trim(),
    card: document.getElementById('f_card').value.trim(),
    clip: document.getElementById('f_clip').value.trim(),
    internalFilter: document.getElementById('f_internal_filter') ? document.getElementById('f_internal_filter').value.trim() : '',
    sequence: document.getElementById('f_sequence').value.trim(),
    shot: document.getElementById('f_shot').value.trim(),
    take: document.getElementById('f_take').value.trim(),
    lens: document.getElementById('f_lens').value.trim(),
    filters: [...tempEntryFilters],
    ft: document.getElementById('f_ft').value.trim(),
    k: document.getElementById('f_k').value.trim(),
    iso: document.getElementById('f_iso').value.trim(),
    shutter: document.getElementById('f_shutter').value.trim(),
    fps: document.getElementById('f_fps').value.trim(),
    note: document.getElementById('f_note').value.trim(),
    good: goodPressed
  };

  if (!entryData.sequence || !entryData.shot || !entryData.take) return;

  if (editingEntryId) {
    const entry = currentEntries.find(en => en.id === editingEntryId);
    if (entry) {
      Object.assign(entry, entryData);
    }
    editingEntryId = null;
    btnSubmitEntry.textContent = 'Guardar toma';
    btnCancelEditEntry.classList.add('hidden');
    
    e.target.reset();
    tempEntryFilters = [];
    renderEntryFilterTags();
  } else {
    const entry = {
      id: uid(),
      createdAt: new Date().toISOString(),
      ...entryData
    };
    currentEntries.unshift(entry);
    saveEntries(currentProjectId, currentEntries);
    renderEntries();

    const currentTakeNum = parseInt(entryData.take, 10);
    if (!isNaN(currentTakeNum)) {
      document.getElementById('f_take').value = currentTakeNum + 1;
    }

    const currentClipVal = entryData.clip;
    if (currentClipVal) {
      const clipNum = parseInt(currentClipVal, 10);
      if (!isNaN(clipNum)) {
        const paddingLength = currentClipVal.length;
        document.getElementById('f_clip').value = String(clipNum + 1).padStart(paddingLength, '0');
      }
    }

    document.getElementById('f_note').value = '';
    goodPressed = false;
    goodToggle.setAttribute('aria-pressed', 'false');
    updateGoodToggleVisuals(false);
    document.getElementById('f_take').focus();
    return;
  }

  saveEntries(currentProjectId, currentEntries);
  renderEntries();
  e.target.reset();
  tempEntryFilters = [];
  renderEntryFilterTags();
  goodPressed = false;
  goodToggle.setAttribute('aria-pressed', 'false');
  updateGoodToggleVisuals(false);
  document.getElementById('f_sequence').focus();
});

btnCancelEditEntry.addEventListener('click', () => {
  editingEntryId = null;
  document.getElementById('entryForm').reset();
  tempEntryFilters = [];
  renderEntryFilterTags();
  btnSubmitEntry.textContent = 'Guardar toma';
  btnCancelEditEntry.classList.add('hidden');
  goodPressed = false;
  goodToggle.setAttribute('aria-pressed', 'false');
  updateGoodToggleVisuals(false);
});

function deleteEntry(id) {
  if (editingEntryId === id) {
    btnCancelEditEntry.click();
  }
  currentEntries = currentEntries.filter(en => en.id !== id);
  saveEntries(currentProjectId, currentEntries);
  renderEntries();
}

function editEntry(id) {
  const entry = currentEntries.find(en => en.id === id);
  if (!entry) return;

  editingEntryId = entry.id;
  document.getElementById('f_roll').value = entry.roll || '';
  document.getElementById('f_card').value = entry.card || '';
  document.getElementById('f_clip').value = entry.clip || '';
  if (document.getElementById('f_internal_filter')) {
    document.getElementById('f_internal_filter').value = entry.internalFilter || '';
  }
  document.getElementById('f_sequence').value = entry.sequence || '';
  document.getElementById('f_shot').value = entry.shot || '';
  document.getElementById('f_take').value = entry.take || '';
  document.getElementById('f_lens').value = entry.lens || '';
  document.getElementById('f_ft').value = entry.ft || '';
  document.getElementById('f_k').value = entry.k || '';
  document.getElementById('f_iso').value = entry.iso || '';
  document.getElementById('f_shutter').value = entry.shutter || '';
  document.getElementById('f_fps').value = entry.fps || '';
  document.getElementById('f_note').value = entry.note || '';
  
  tempEntryFilters = entry.filters ? [...entry.filters] : (entry.filter ? [entry.filter] : []);
  renderEntryFilterTags();

  goodPressed = Boolean(entry.good);
  goodToggle.setAttribute('aria-pressed', String(goodPressed));
  updateGoodToggleVisuals(goodPressed);

  btnSubmitEntry.textContent = 'Actualizar toma';
  btnCancelEditEntry.classList.remove('hidden');
  
  document.querySelector('#view-entries .content-scroll').scrollTo({ top: 0, behavior: 'smooth' });
}

function renderEntries() {
  document.getElementById('countNumber').textContent = `${currentEntries.length} tomas`;
  const list = document.getElementById('logList');
  list.innerHTML = '';

  if(currentEntries.length === 0){
    list.innerHTML = '<p class="empty-state" style="min-height:20vh;">Aún no hay tomas registradas.</p>';
    return;
  }

  const currentProj = projects.find(p => p.id === currentProjectId) || {};

  currentEntries.forEach(en => {
    const row = document.createElement('div');
    row.className = 'entry' + (en.good ? ' entry--good' : '');
    
    const time = new Date(en.createdAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    const markHtml = en.good ? '&#9733;' : `<span style="font-size:9px">${time}</span>`;
    
    const entryFiltersList = en.filters && en.filters.length > 0 ? en.filters : (en.filter ? [en.filter] : []);
    
    const clipDisplay = en.clip ? `Clip ${en.clip}` : '';
    const seqShotTakeDisplay = `Sec ${en.sequence} - ${en.shot} T${en.take}`;
    
    const camLetter = currentProj.cameraLetter || '';
    const rollCombined = en.roll ? `${camLetter}${en.roll}` : '';
    const infoLines = [
      rollCombined ? `Roll: ${rollCombined}` : '',
      en.card ? `Card: ${en.card}` : ''
    ].filter(Boolean);
    const infoContent = infoLines.length > 0 ? infoLines.join('<br>') : '';

    const opticsContent = en.lens ? `${en.lens}` : '';

    const allFiltersLines = [
      en.internalFilter ? `INT F. - ${en.internalFilter}` : '',
      ...entryFiltersList
    ].filter(Boolean);
    const filtersContent = allFiltersLines.length > 0 ? allFiltersLines.map(f => `${f}`).join('<br>') : '';

    const camInfoLines = [
      en.ft ? `F/T: ${en.ft}` : '',
      en.k ? `K: ${en.k}` : '',
      en.iso ? `ISO: ${en.iso}` : '',
      en.fps ? `FPS: ${en.fps}` : ''
    ].filter(Boolean);
    const camInfoContent = camInfoLines.length > 0 ? camInfoLines.join('<br>') : '';

    const notesContent = en.note ? en.note : '';

    const columnsData = [
      infoContent ? `<div style="flex: 1 1 45%; font-size: 11px; color: var(--text-lo); background: var(--surface-2, #1a1a1a); padding: 6px; border-radius: 4px; box-sizing: border-box;"><b>INFO</b><br>${infoContent}</div>` : '',
      opticsContent ? `<div style="flex: 1 1 45%; font-size: 11px; color: var(--text-lo); background: var(--surface-2, #1a1a1a); padding: 6px; border-radius: 4px; box-sizing: border-box;"><b>OPTICA</b><br>${opticsContent}</div>` : '',
      filtersContent ? `<div style="flex: 1 1 45%; font-size: 11px; color: var(--text-lo); background: var(--surface-2, #1a1a1a); padding: 6px; border-radius: 4px; box-sizing: border-box;"><b>FILTROS</b><br>${filtersContent}</div>` : '',
      camInfoContent ? `<div style="flex: 1 1 45%; font-size: 11px; color: var(--text-lo); background: var(--surface-2, #1a1a1a); padding: 6px; border-radius: 4px; box-sizing: border-box;"><b>INFO CAM</b><br>${camInfoContent}</div>` : ''
    ].filter(Boolean).join('');

    const notesBlock = notesContent ? `<div style="width: 100%; font-size: 11px; color: var(--text-lo); background: var(--surface-2, #1a1a1a); padding: 6px; border-radius: 4px; box-sizing: border-box; margin-top: 6px;"><b>NOTAS</b><br>${notesContent}</div>` : '';
    
    row.innerHTML = `
      <div class="entry__mark">${markHtml}</div>
      <div class="entry__body">
        <div class="entry__head">
          <span class="entry__scene" style="font-size: 15px; color: var(--amber);">
            ${clipDisplay ? `${clipDisplay} &nbsp;&nbsp;|&nbsp;&nbsp; ${seqShotTakeDisplay}` : seqShotTakeDisplay}
          </span>
        </div>
        <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px;">
          ${columnsData}
          ${notesBlock}
        </div>
        <div style="display:flex; gap:10px; margin-top:8px;">
          <button type="button" class="btn-card-action btn-edit-entry" data-id="${en.id}" style="font-size:10px; padding:2px 6px;">Editar</button>
          <button type="button" class="btn-card-action btn-delete-entry" data-id="${en.id}" style="font-size:10px; padding:2px 6px; color:#B84C3E;">Borrar</button>
        </div>
      </div>
    `;
    
    row.querySelector('.btn-edit-entry').onclick = () => editEntry(en.id);
    row.querySelector('.btn-delete-entry').onclick = () => deleteEntry(en.id);
    
    list.appendChild(row);
  });
}

// --- SELECCIÓN Y LISTA DE PROYECTOS ---
let isSelectionMode = false;
let selectedProjectIds = [];

const btnToggleSelect = document.getElementById('btnToggleSelect');
const btnDeleteSelected = document.getElementById('btnDeleteSelected');

btnToggleSelect.addEventListener('click', () => {
  isSelectionMode = !isSelectionMode;
  selectedProjectIds = [];
  
  if (isSelectionMode) {
    btnToggleSelect.textContent = 'Cancelar';
    btnListNewProject.classList.add('hidden');
    btnDeleteSelected.classList.remove('hidden');
  } else {
    btnToggleSelect.textContent = 'Seleccionar';
    btnListNewProject.classList.remove('hidden');
    btnDeleteSelected.classList.add('hidden');
  }
  renderProjects();
});

btnDeleteSelected.addEventListener('click', () => {
  if (selectedProjectIds.length === 0) {
    alert('No has seleccionado ningún proyecto.');
    return;
  }

  if (confirm(`¿Seguro que quieres borrar ${selectedProjectIds.length} proyecto(s) y todas sus tomas?`)) {
    selectedProjectIds.forEach(id => {
      projects = projects.filter(p => p.id !== id);
      localStorage.removeItem(getEntriesKey(id));
    });
    saveProjects();
    
    isSelectionMode = false;
    selectedProjectIds = [];
    btnToggleSelect.textContent = 'Seleccionar';
    btnListNewProject.classList.remove('hidden');
    btnDeleteSelected.classList.add('hidden');
    renderProjects();
  }
});

function renderProjects() {
  const container = document.getElementById('projectListContainer');
  container.innerHTML = '';
  
  if (projects.length === 0) {
    container.innerHTML = `<div class="empty-state"><p>AQUÍ APARECERÁN TUS PROYECTOS</p></div>`;
    return;
  }
  
  projects.forEach(proj => {
    const card = document.createElement('div');
    card.className = 'project-card';
    
    let checkboxHtml = '';
    if (isSelectionMode) {
      const isChecked = selectedProjectIds.includes(proj.id) ? 'checked' : '';
      checkboxHtml = `<input type="checkbox" class="project-card__checkbox" data-id="${proj.id}" ${isChecked}>`;
    }

    card.innerHTML = `
      ${checkboxHtml}
      <div class="project-card__content">
        <div class="project-card__header" style="cursor: pointer;">
          <h3 class="project-card__title">${proj.name}</h3>
          <span class="project-card__date">${proj.date}</span>
        </div>
        ${proj.director ? `<div class="project-card__meta">Dir: ${proj.director}</div>` : ''}
        ${proj.dop ? `<div class="project-card__meta">DOP: ${proj.dop}</div>` : ''}
        
        <div class="project-card__buttons">
          <button type="button" class="btn-card-action btn-edit-card" data-id="${proj.id}">Editar</button>
        </div>
      </div>
    `;

    card.querySelector('.project-card__header').addEventListener('click', () => {
      if (!isSelectionMode) openProject(proj);
    });
    const metaEl = card.querySelector('.project-card__meta');
    if (metaEl) {
      metaEl.addEventListener('click', () => {
        if (!isSelectionMode) openProject(proj);
      });
    }

    if (isSelectionMode) {
      const checkbox = card.querySelector('.project-card__checkbox');
      checkbox.addEventListener('change', (e) => {
        if (e.target.checked) {
          selectedProjectIds.push(proj.id);
        } else {
          selectedProjectIds = selectedProjectIds.filter(id => id !== proj.id);
        }
      });
    }

    card.querySelector('.btn-card-action').addEventListener('click', (e) => {
      e.stopPropagation();
      openProjectEdit(proj);
    });

    container.appendChild(card);
  });
}

function exportToPDF() {
  const proj = projects.find(p => p.id === currentProjectId);
  if (!proj) return;

  let printArea = document.getElementById('printArea');
  if (!printArea) {
    printArea = document.createElement('div');
    printArea.id = 'printArea';
    document.getElementById('view-entries').appendChild(printArea);
  }

  const chronologicalEntries = [...currentEntries].reverse();

  let tableRows = chronologicalEntries.map(en => {
    const entryFiltersList = en.filters && en.filters.length > 0 ? en.filters : (en.filter ? [en.filter] : []);
    const multipleFilters = entryFiltersList.join(', ');
    const internalFilterClean = en.internalFilter || '';
    
    const camLetter = proj.cameraLetter || '';
    const rollDisplay = en.roll ? `${camLetter}${en.roll}` : '';

    return `
      <tr class="${en.good ? 'pdf-take-good' : ''}">
        <td>${rollDisplay}</td>
        <td>${en.card || ''}</td>
        <td>${en.clip || ''}</td>
        <td>${en.sequence || ''}</td>
        <td>${en.shot || ''}</td>
        <td>${en.take || ''}</td>
        <td>${en.lens || ''}</td>
        <td>${en.ft || ''}</td>
        <td>${en.k ? en.k + 'K' : ''}</td>
        <td>${en.iso || ''}</td>
        <td>${en.fps || ''}</td>
        <td>${internalFilterClean}</td>
        <td>${multipleFilters}</td>
        <td style="text-align: left;">${en.note || ''}</td>
        <td>${en.good ? '★' : ''}</td>
      </tr>
    `;
  }).join('');

  printArea.innerHTML = `
    <div class="pdf-header">
      <h1>CAMERA REPORT</h1>
      <h2>${proj.name}</h2>
    </div>
    
    <div class="pdf-info-grid">
      <div class="pdf-info-box">
        <strong>INFO PROYECTO</strong>
        Fecha: ${proj.date || ''}<br>
        Director: ${proj.director || ''}<br>
        DOP: ${proj.dop || ''}<br>
        Productora: ${proj.producer || ''}<br>
        Loc: ${proj.location || ''}<br>
        1AC: ${proj.ac1 || ''} | 2AC: ${proj.ac2 || ''}
      </div>
      <div class="pdf-info-box">
        <strong>INFO CÁMARA</strong>
        Modelo: ${proj.cameraLetter || ''} - ${proj.cameraModel || ''}<br>
        Códec: ${proj.cameraCodec || ''}<br>
        Res: ${proj.cameraResolution || ''}<br>
        Color: ${proj.cameraColorSpace || ''}<br>
        Aspect: ${proj.cameraAspectRatio || ''}<br>
        S/N: ${proj.cameraSerial || ''}
      </div>
    </div>

    <table class="pdf-table">
      <thead>
        <tr>
          <th>ROLL</th>
          <th>CARD</th>
          <th>CLIP</th>
          <th>SEC</th>
          <th>PLANO</th>
          <th>TOMA</th>
          <th>ÓPTICA</th>
          <th>F/T</th>
          <th>K</th>
          <th>ISO</th>
          <th>FPS</th>
          <th>INT F</th>
          <th>FILTROS</th>
          <th>NOTAS</th>
          <th>★</th>
        </tr>
      </thead>
      <tbody>
        ${tableRows}
      </tbody>
    </table>
  `;

  window.print();

  setTimeout(() => {
    printArea.innerHTML = '';
  }, 500);
}