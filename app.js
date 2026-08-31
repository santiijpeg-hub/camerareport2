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

// --- ESTADOS DE EDICIÓN, INFO CÁMARA, LENTES Y FILTROS ---
let editingProjectId = null; // null = Creando, ID = Editando

// Lentes
let tempCurrentSetLenses = [];
let projectLensSets = []; 
let editingLensSetIndex = null; 

const pLensInput = document.getElementById('p_lens_input');
const pSetName = document.getElementById('p_set_name');
const btnAddLensToSet = document.getElementById('btnAddLensToSet');
const btnAddSet = document.getElementById('btnAddSet');
const currentSetTags = document.getElementById('currentSetTags');
const savedSetsContainer = document.getElementById('savedSetsContainer');

// Filtros
let tempCurrentSetFilters = [];
let projectFilterSets = []; 
let editingFilterSetIndex = null; 

const pFilterInput = document.getElementById('p_filter_input');
const pFilterSetName = document.getElementById('p_filter_set_name');
const btnAddFilterToSet = document.getElementById('btnAddFilterToSet');
const btnAddFilterSet = document.getElementById('btnAddFilterSet');
const currentFilterSetTags = document.getElementById('currentFilterSetTags');
const savedFilterSetsContainer = document.getElementById('savedFilterSetsContainer');

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
  
  // Limpiar Info Cámara
  document.getElementById('p_cam_letter').value = '';
  document.getElementById('p_cam_model').value = '';
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

  // Cargar Info Cámara
  document.getElementById('p_cam_letter').value = proj.cameraLetter || '';
  document.getElementById('p_cam_model').value = proj.cameraModel || '';
  document.getElementById('p_cam_codec').value = proj.cameraCodec || '';
  document.getElementById('p_cam_res').value = proj.cameraResolution || '';
  document.getElementById('p_cam_colorspace').value = proj.cameraColorSpace || '';
  document.getElementById('p_cam_aspect').value = proj.cameraAspectRatio || '';
  document.getElementById('p_cam_serial').value = proj.cameraSerial || '';

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
    // Info Cámara
    cameraLetter: document.getElementById('p_cam_letter').value.trim(),
    cameraModel: document.getElementById('p_cam_model').value.trim(),
    cameraCodec: document.getElementById('p_cam_codec').value.trim(),
    cameraResolution: document.getElementById('p_cam_res').value.trim(),
    cameraColorSpace: document.getElementById('p_cam_colorspace').value.trim(),
    cameraAspectRatio: document.getElementById('p_cam_aspect').value.trim(),
    cameraSerial: document.getElementById('p_cam_serial').value.trim(),
    // Sets
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
      proj.lensSets = formData.lensSets;
      proj.filterSets = formData.filterSets;

      saveProjects();
      editingProjectId = null;
      e.target.reset();
      resetSetsForms();
      openProject(proj);
    }
  } else {
    const newProject = { id: uid(), ...formData };
    projects.unshift(newProject);
    saveProjects();
    e.target.reset();
    resetSetsForms();
    openProject(newProject);
  }
});

function openProject(proj) {
  currentProjectId = proj.id;
  currentEntries = loadEntries(proj.id);
  document.getElementById('currentProjectTitle').textContent = proj.name;
  
  // Cargar Select Lentes
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

  // Cargar Select Filtros para Tomas
  loadFiltersIntoSelect(proj);

  renderEntries();
  showView('entries');
}

// --- ESTADOS PARA TOMAS (Múltiples filtros y Edición) ---
let tempEntryFilters = [];
let editingEntryId = null; 

const fFilterSelect = document.getElementById('f_filter_select');
const btnAddFilterToEntry = document.getElementById('btnAddFilterToEntry');
const entryFilterTags = document.getElementById('entryFilterTags');
const btnSubmitEntry = document.getElementById('btnSubmitEntry');
const btnCancelEditEntry = document.getElementById('btnCancelEditEntry');

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

// --- TOMAS SUBMIT (CREAR / EDITAR) ---
let goodPressed = false;
const goodToggle = document.getElementById('goodToggle');
goodToggle.addEventListener('click', () => {
  goodPressed = !goodPressed;
  goodToggle.setAttribute('aria-pressed', String(goodPressed));
});

document.getElementById('entryForm').addEventListener('submit', (e) => {
  e.preventDefault();
  if(!currentProjectId) return;

  const entryData = {
    roll: document.getElementById('f_roll').value.trim(),
    card: document.getElementById('f_card').value.trim(),
    clip: document.getElementById('f_clip').value.trim(),
    scene: document.getElementById('f_scene').value.trim(),
    take: document.getElementById('f_take').value.trim(),
    lens: document.getElementById('f_lens').value.trim(),
    filters: [...tempEntryFilters],
    ft: document.getElementById('f_ft').value.trim(),
    k: document.getElementById('f_k').value.trim(),
    iso: document.getElementById('f_iso').value.trim(),
    note: document.getElementById('f_note').value.trim(),
    good: goodPressed
  };

  if (!entryData.scene || !entryData.take) return;

  if (editingEntryId) {
    const entry = currentEntries.find(en => en.id === editingEntryId);
    if (entry) {
      Object.assign(entry, entryData);
    }
    editingEntryId = null;
    btnSubmitEntry.textContent = 'Guardar toma';
    btnCancelEditEntry.classList.add('hidden');
  } else {
    const entry = {
      id: uid(),
      createdAt: new Date().toISOString(),
      ...entryData
    };
    currentEntries.unshift(entry);
  }

  saveEntries(currentProjectId, currentEntries);
  renderEntries();

  e.target.reset();
  tempEntryFilters = [];
  renderEntryFilterTags();
  goodPressed = false;
  goodToggle.setAttribute('aria-pressed', 'false');
  document.getElementById('f_scene').focus();
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
  document.getElementById('f_scene').value = entry.scene || '';
  document.getElementById('f_take').value = entry.take || '';
  document.getElementById('f_lens').value = entry.lens || '';
  document.getElementById('f_ft').value = entry.ft || '';
  document.getElementById('f_k').value = entry.k || '';
  document.getElementById('f_iso').value = entry.iso || '';
  document.getElementById('f_note').value = entry.note || '';
  
  tempEntryFilters = entry.filters ? [...entry.filters] : (entry.filter ? [entry.filter] : []);
  renderEntryFilterTags();

  goodPressed = Boolean(entry.good);
  goodToggle.setAttribute('aria-pressed', String(goodPressed));

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

  currentEntries.forEach(en => {
    const row = document.createElement('div');
    row.className = 'entry' + (en.good ? ' entry--good' : '');
    
    const time = new Date(en.createdAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    const markHtml = en.good ? '&#9733;' : `<span style="font-size:9px">${time}</span>`;
    
    const entryFiltersList = en.filters && en.filters.length > 0 ? en.filters : (en.filter ? [en.filter] : []);
    
    const metaBits = [
      en.roll ? `R:${en.roll}` : '',
      en.card ? `C:${en.card}` : '',
      en.clip ? `Cl:${en.clip}` : '',
      en.lens,
      ...entryFiltersList,
      en.ft ? `F/T: ${en.ft}` : '',
      en.k ? `${en.k}K` : '',
      en.iso ? `ISO ${en.iso}` : ''
    ].filter(Boolean).map(m => `<span>${m}</span>`).join('');
    
    row.innerHTML = `
      <div class="entry__mark">${markHtml}</div>
      <div class="entry__body">
        <div class="entry__head"><span class="entry__scene">${en.scene}</span><span class="entry__take">T${en.take}</span></div>
        ${metaBits ? `<div class="entry__meta">${metaBits}</div>` : ''}
        ${en.note ? `<p class="entry__note">${en.note}</p>` : ''}
        <div style="display:flex; gap:10px; margin-top:6px;">
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
        ${proj.location ? `<div class="project-card__meta">Loc: ${proj.location}</div>` : ''}
        
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