// ---------- Storage ----------
const STORAGE_KEY = 'camlog_entries_v1';

function loadEntries(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  }catch(e){
    console.error('No se pudieron leer los datos guardados', e);
    return [];
  }
}

function saveEntries(entries){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

let entries = loadEntries();

// ---------- Helpers ----------
const $ = (id) => document.getElementById(id);

function todayISO(){
  const d = new Date();
  return d.toISOString().slice(0,10);
}

function formatDayLabel(iso){
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
}

function formatTime(iso){
  const d = new Date(iso);
  return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

function uid(){
  return Date.now().toString(36) + Math.random().toString(36).slice(2,7);
}

// ---------- Header ----------
$('todayLabel').textContent = formatDayLabel(todayISO());

// ---------- Good-take toggle ----------
let goodPressed = false;
const goodToggle = $('goodToggle');
goodToggle.addEventListener('click', () => {
  goodPressed = !goodPressed;
  goodToggle.setAttribute('aria-pressed', String(goodPressed));
});

// ---------- Form submit ----------
$('entryForm').addEventListener('submit', (e) => {
  e.preventDefault();

  const entry = {
    id: uid(),
    createdAt: new Date().toISOString(),
    date: todayISO(),
    scene: $('f_scene').value.trim(),
    take: $('f_take').value.trim(),
    lens: $('f_lens').value.trim(),
    filter: $('f_filter').value.trim(),
    note: $('f_note').value.trim(),
    good: goodPressed
  };

  if(!entry.scene || !entry.take) return;

  entries.unshift(entry);
  saveEntries(entries);
  render();

  e.target.reset();
  goodPressed = false;
  goodToggle.setAttribute('aria-pressed', 'false');
  $('f_scene').focus();
});

// ---------- Delete single ----------
function deleteEntry(id){
  entries = entries.filter(en => en.id !== id);
  saveEntries(entries);
  render();
}

// ---------- Clear all ----------
$('clearAll').addEventListener('click', () => {
  if(entries.length === 0) return;
  if(confirm('¿Borrar todas las tomas registradas? Esta acción no se puede deshacer.')){
    entries = [];
    saveEntries(entries);
    render();
  }
});

// ---------- Render ----------
function groupByDate(list){
  const groups = {};
  list.forEach(en => {
    if(!groups[en.date]) groups[en.date] = [];
    groups[en.date].push(en);
  });
  return groups;
}

function render(){
  $('countNumber').textContent = entries.length;

  const logList = $('logList');
  logList.innerHTML = '';

  if(entries.length === 0){
    const p = document.createElement('p');
    p.className = 'empty-state';
    p.id = 'emptyState';
    p.textContent = 'Todavía no has registrado ninguna toma. Usa el formulario de arriba para empezar.';
    logList.appendChild(p);
    return;
  }

  const sorted = [...entries].sort((a,b) => b.createdAt.localeCompare(a.createdAt));
  const groups = groupByDate(sorted);
  const dates = Object.keys(groups).sort().reverse();

  dates.forEach(date => {
    const group = document.createElement('div');
    group.className = 'day-group';

    const label = document.createElement('p');
    label.className = 'day-group__label';
    label.textContent = `${formatDayLabel(date)} · ${groups[date].length} toma${groups[date].length === 1 ? '' : 's'}`;
    group.appendChild(label);

    groups[date].forEach(en => {
      group.appendChild(renderEntry(en));
    });

    logList.appendChild(group);
  });
}

function renderEntry(en){
  const row = document.createElement('div');
  row.className = 'entry' + (en.good ? ' entry--good' : '');

  const mark = document.createElement('div');
  mark.className = 'entry__mark';
  if(en.good){
    mark.innerHTML = '&#9733;';
  } else {
    mark.textContent = formatTime(en.createdAt);
    mark.style.fontSize = '9px';
  }

  const body = document.createElement('div');
  body.className = 'entry__body';

  const head = document.createElement('div');
  head.className = 'entry__head';
  head.innerHTML = `<span class="entry__scene">${escapeHtml(en.scene)}</span><span class="entry__take">T${escapeHtml(en.take)}</span>`;
  body.appendChild(head);

  const metaParts = [];
  if(en.lens) metaParts.push(`<span>${escapeHtml(en.lens)}</span>`);
  if(en.filter) metaParts.push(`<span>${escapeHtml(en.filter)}</span>`);
  if(metaParts.length){
    const meta = document.createElement('div');
    meta.className = 'entry__meta';
    meta.innerHTML = metaParts.join('');
    body.appendChild(meta);
  }

  if(en.note){
    const note = document.createElement('p');
    note.className = 'entry__note';
    note.textContent = en.note;
    body.appendChild(note);
  }

  const del = document.createElement('button');
  del.className = 'entry__delete';
  del.type = 'button';
  del.textContent = 'Borrar';
  del.addEventListener('click', () => deleteEntry(en.id));

  row.appendChild(mark);
  row.appendChild(body);
  row.appendChild(del);

  return row;
}

function escapeHtml(str){
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// ---------- PDF export ----------
$('exportPdf').addEventListener('click', () => {
  if(entries.length === 0){
    alert('Todavía no hay tomas registradas para exportar.');
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });

  const marginX = 40;
  let y = 50;
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('Registro de cámara', marginX, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(120);
  y += 16;
  doc.text(`Exportado el ${new Date().toLocaleString('es-ES')} · ${entries.length} tomas`, marginX, y);
  doc.setTextColor(0);

  y += 26;

  const sorted = [...entries].sort((a,b) => a.createdAt.localeCompare(b.createdAt));
  const groups = groupByDate(sorted);
  const dates = Object.keys(groups).sort();

  dates.forEach(date => {
    if(y > pageHeight - 80){ doc.addPage(); y = 50; }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(formatDayLabel(date), marginX, y);
    y += 8;
    doc.setDrawColor(200);
    doc.line(marginX, y, pageWidth - marginX, y);
    y += 16;

    groups[date].forEach(en => {
      if(y > pageHeight - 80){ doc.addPage(); y = 50; }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      const title = `${en.scene}  ·  Toma ${en.take}${en.good ? '  ★' : ''}`;
      doc.text(title, marginX, y);
      y += 14;

      const metaBits = [];
      if(en.lens) metaBits.push(`Lente: ${en.lens}`);
      if(en.filter) metaBits.push(`Filtro: ${en.filter}`);
      metaBits.push(formatTime(en.createdAt));

      if(metaBits.length){
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(100);
        doc.text(metaBits.join('   ·   '), marginX, y);
        doc.setTextColor(0);
        y += 13;
      }

      if(en.note){
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9.5);
        const lines = doc.splitTextToSize(en.note, pageWidth - marginX*2);
        lines.forEach(line => {
          if(y > pageHeight - 60){ doc.addPage(); y = 50; }
          doc.text(line, marginX, y);
          y += 12;
        });
      }

      y += 12;
    });

    y += 6;
  });

  doc.save(`registro-camara-${todayISO()}.pdf`);
});

// ---------- Service worker ----------
if('serviceWorker' in navigator){
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js').catch(() => {});
  });
}

// ---------- Initial render ----------
render();
