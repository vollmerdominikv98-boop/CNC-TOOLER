// admin.js
// Steuert die gesamte CRUD (Create, Read, Update, Delete) Logik für die Datenbank

import { getData, saveData, exportDB, importDB, resetDB } from './storage.js';

export function initAdmin(onDataChangedCallback) {
    const adminBtn = document.getElementById('adminBtn');
    const adminModal = document.getElementById('adminModal');
    const closeBtn = document.getElementById('closeAdminBtn');
    const tabs = document.querySelectorAll('.tab-btn');
    
    // Backup & Reset Buttons
    document.getElementById('factoryResetBtn').addEventListener('click', () => {
        if(confirm("WARNUNG: Alle eigenen Daten gehen verloren. Zurücksetzen?")) {
            resetDB();
            onDataChangedCallback();
            renderAdminTab('machTab');
        }
    });

    const fileInput = document.getElementById('importFile');
    fileInput.addEventListener('change', (e) => {
        if(e.target.files.length > 0) {
            importDB(e.target.files[0], (success, msg) => {
                alert(msg);
                if(success) {
                    onDataChangedCallback();
                    adminModal.style.display = 'none';
                }
            });
        }
    });

    // Modal öffnen/schließen
    adminBtn.onclick = () => {
        adminModal.style.display = 'block';
        renderAdminTab('machTab'); // Start mit Maschinen
    };
    closeBtn.onclick = () => adminModal.style.display = 'none';

    // Tabs umschalten
    tabs.forEach(tab => {
        tab.onclick = () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            if(tab.dataset.tab === 'backupTab') {
                renderBackupTab();
            } else {
                renderAdminTab(tab.dataset.tab);
            }
        };
    });
}

function renderBackupTab() {
    const container = document.getElementById('admin-form-container');
    document.getElementById('admin-list').innerHTML = '';
    document.getElementById('admin-hr').style.display = 'none';
    document.getElementById('admin-list-title').style.display = 'none';

    container.innerHTML = `
        <div style="text-align: center; padding: 30px;">
            <h3>Sichern Sie Ihre Datenbank</h3>
            <p>Exportieren Sie Ihre Werkzeuge, Materialien und Maschinen als JSON-Datei.</p>
            <button id="exportBtn" style="background: var(--success); margin: 10px;">💾 Backup herunterladen</button>
            <button id="importBtn" style="background: var(--accent); margin: 10px;">📂 Backup laden</button>
        </div>
    `;

    document.getElementById('exportBtn').onclick = () => exportDB();
    document.getElementById('importBtn').onclick = () => document.getElementById('importFile').click();
}

function renderAdminTab(tabName) {
    const db = getData();
    const container = document.getElementById('admin-form-container');
    const list = document.getElementById('admin-list');
    
    document.getElementById('admin-hr').style.display = 'block';
    document.getElementById('admin-list-title').style.display = 'block';

    let config = {};

    // Definition der Formulare je nach Tab
    if(tabName === 'machTab') {
        config = {
            title: "Neue Maschine anlegen",
            key: "machines",
            fields: [
                { id: "m_name", label: "Maschinenname", type: "text" },
                { id: "m_rpm", label: "Max. Drehzahl (U/min)", type: "number" },
                { id: "m_feed", label: "Max. Vorschub (mm/min)", type: "number" },
                { id: "m_kw", label: "Leistung (kW)", type: "number", step: "0.1" }
            ],
            createObj: (inputs) => ({
                id: 'mach_' + Date.now(),
                name: inputs.m_name,
                maxRpm: parseInt(inputs.m_rpm),
                maxFeed: parseInt(inputs.m_feed),
                powerKw: parseFloat(inputs.m_kw)
            }),
            renderListItem: (item) => `<strong>${item.name}</strong> (${item.maxRpm} U/min, ${item.powerKw} kW)`
        };
    } 
    else if(tabName === 'matTab') {
        config = {
            title: "Neuen Werkstoff anlegen",
            key: "materials",
            fields: [
                { id: "mat_name", label: "Werkstoffbezeichnung", type: "text" },
                { id: "mat_iso", label: "ISO-Gruppe (P,M,K,N,S,H)", type: "select", options: ['P','M','K','N','S','H'] },
                { id: "mat_vc", label: "Schnittgeschwindigkeit vc (m/min)", type: "number" }
            ],
            createObj: (inputs) => ({
                id: 'mat_' + Date.now(),
                name: inputs.mat_name,
                isoGroup: inputs.mat_iso,
                vc: parseInt(inputs.mat_vc)
            }),
            renderListItem: (item) => `<span class="iso-badge iso-${item.isoGroup}">${item.isoGroup}</span> <strong>${item.name}</strong> (vc: ${item.vc})`
        };
    }
    // HIER KÖNNTEN catTab und profTab ergänzt werden (Analog zu oben)
    else if(tabName === 'toolTab') {
        // Dropdown Optionen für Kategorien holen
        let catOptions = db.categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
        config = {
            title: "Neues Werkzeug anlegen",
            key: "tools",
            html: `
                <div class="input-group"><label>Werkzeugname</label><input type="text" id="t_name" required></div>
                <div class="input-group"><label>Hersteller</label><input type="text" id="t_manu"></div>
                <div class="input-group"><label>Kategorie</label><select id="t_cat">${catOptions}</select></div>
                <div class="input-group" style="display:flex; gap:10px;">
                    <div style="flex:1"><label>Durchmesser D (mm)</label><input type="number" id="t_d" step="0.1" required></div>
                    <div style="flex:1"><label>Zähnezahl Z</label><input type="number" id="t_z" required></div>
                </div>
                <div class="input-group"><label>Bild-URL (Optional)</label><input type="text" id="t_img" placeholder="https://..."></div>
            `,
            createObj: () => ({
                id: 'tool_' + Date.now(),
                name: document.getElementById('t_name').value,
                manufacturer: document.getElementById('t_manu').value,
                categoryId: document.getElementById('t_cat').value,
                d: parseFloat(document.getElementById('t_d').value),
                z: parseInt(document.getElementById('t_z').value),
                imageUrl: document.getElementById('t_img').value
            }),
            renderListItem: (item) => `<strong>${item.name}</strong> (D${item.d} / Z${item.z}) - ${item.manufacturer || ''}`
        };
    } else {
        container.innerHTML = "<p>Dieser Bereich ist in Bearbeitung.</p>";
        list.innerHTML = "";
        return;
    }

    // Formular generieren (Entweder per config.html oder automatisch aus config.fields)
    let formHtml = `<h3>${config.title}</h3><form id="adminForm">`;
    
    if(config.html) {
        formHtml += config.html;
    } else {
        config.fields.forEach(f => {
            if(f.type === 'select') {
                let opts = f.options.map(o => `<option value="${o}">${o}</option>`).join('');
                formHtml += `<div class="input-group"><label>${f.label}</label><select id="${f.id}">${opts}</select></div>`;
            } else {
                let step = f.step ? `step="${f.step}"` : "";
                formHtml += `<div class="input-group"><label>${f.label}</label><input type="${f.type}" id="${f.id}" ${step} required></div>`;
            }
        });
    }
    
    formHtml += `<button type="submit">Speichern</button></form>`;
    container.innerHTML = formHtml;

    // Speichern-Logik
    document.getElementById('adminForm').onsubmit = (e) => {
        e.preventDefault();
        let inputs = {};
        if(config.fields) {
            config.fields.forEach(f => { inputs[f.id] = document.getElementById(f.id).value; });
        }
        
        let newObj = config.createObj(inputs);
        db[config.key].push(newObj);
        saveData(db);
        
        // Neu laden der Seite
        window.location.reload(); 
    };

    // Liste rendern
    list.innerHTML = '';
    db[config.key].forEach((item, index) => {
        let div = document.createElement('div');
        div.className = 'list-item';
        div.innerHTML = `
            <div>${config.renderListItem(item)}</div>
            <button class="del-btn" onclick="window._delAdminItem('${config.key}', ${index})">Löschen</button>
        `;
        list.appendChild(div);
    });

    // Löschfunktion ans window hängen (wegen onclick in string)
    window._delAdminItem = (key, index) => {
        if(confirm("Eintrag wirklich löschen?")) {
            let curDb = getData();
            curDb[key].splice(index, 1);
            saveData(curDb);
            window.location.reload();
        }
    };
}
