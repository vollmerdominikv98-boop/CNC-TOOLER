// admin.js
// Steuert die CRUD-Logik und den intelligenten "Bulk Smart Paste" Massen-Parser

import { getData, saveData, exportDB, importDB, resetDB } from './storage.js';

export function initAdmin(onDataChangedCallback) {
    const adminBtn = document.getElementById('adminBtn');
    const adminModal = document.getElementById('adminModal');
    const closeBtn = document.getElementById('closeAdminBtn');
    const tabs = document.querySelectorAll('.tab-btn');
    
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

    adminBtn.onclick = () => {
        adminModal.style.display = 'block';
        renderAdminTab('machTab');
    };
    closeBtn.onclick = () => adminModal.style.display = 'none';

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
            <p>Exportieren Sie Ihre Konfiguration als JSON-Datei.</p>
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
    else if(tabName === 'catTab') {
        config = {
            title: "Neue Werkzeugkategorie anlegen",
            key: "categories",
            fields: [
                { id: "cat_name", label: "Kategoriename (z.B. Schaftfräser)", type: "text" }
            ],
            createObj: (inputs) => ({
                id: 'cat_' + Date.now(),
                name: inputs.cat_name
            }),
            renderListItem: (item) => `<strong>${item.name}</strong>`
        };
    }
    else if(tabName === 'toolTab') {
        let catOptions = db.categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
        config = {
            title: "Neues Werkzeug anlegen",
            key: "tools",
            html: `
                <!-- BULK SMART PASTE BOX -->
                <div style="background: rgba(9, 132, 227, 0.08); padding: 15px; border-radius: 8px; margin-bottom: 20px; border: 1px dashed var(--accent);">
                    <label style="color: var(--accent); font-weight: bold; display: block; margin-bottom: 5px;">⚡ Bulk Smart Paste (Ganze Tabellen / Mehrere Zeilen einfügen)</label>
                    <p style="font-size: 0.85em; margin-bottom: 8px; color: var(--text);">Kopieren Sie einen ganzen Textblock aus einem PDF-Katalog (jede Zeile ein Werkzeug). Die App legt alle automatisch an.</p>
                    <textarea id="bulkPasteTextarea" rows="4" placeholder="Z.B.&#10;VHM Fräser D6 Z4 L30&#10;VHM Fräser D8 Z4 L40&#10;VHM Fräser D10 Z4 L50" style="width:100%; padding:8px; border:1px solid var(--border); border-radius:4px; background:var(--bg); color:var(--text); font-family:inherit; resize:vertical; margin-bottom:8px;"></textarea>
                    <button type="button" id="bulkParseBtn" style="background: var(--accent); padding: 8px 15px; margin:0; width:100%;">🚀 Alle Zeilen automatisch einlesen & anlegen</button>
                </div>

                <div style="text-align: center; margin: 15px 0; color: var(--border); font-weight: bold;">— ODER EINZELN EINGEBEN —</div>

                <div class="input-group"><label>Werkzeugname</label><input type="text" id="t_name" required></div>
                <div class="input-group"><label>Hersteller</label><input type="text" id="t_manu"></div>
                <div class="input-group"><label>Kategorie</label><select id="t_cat">${catOptions}</select></div>
                <div class="input-group" style="display:flex; gap:10px;">
                    <div style="flex:1"><label>Durchmesser D (mm)</label><input type="number" id="t_d" step="0.1" required></div>
                    <div style="flex:1"><label>Zähnezahl Z</label><input type="number" id="t_z" required></div>
                    <div style="flex:1"><label>Auskraglänge L (mm)</label><input type="number" id="t_l" step="0.1" value="30" required></div>
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
                l: parseFloat(document.getElementById('t_l').value) || 30,
                imageUrl: document.getElementById('t_img').value
            }),
            renderListItem: (item) => `<strong>${item.name}</strong> (D${item.d} / Z${item.z} / L:${item.l || 30}mm) - ${item.manufacturer || ''}`
        };
    }
    else if(tabName === 'profTab') {
        config = {
            title: "Neues Bearbeitungsprofil anlegen",
            key: "profiles",
            fields: [
                { id: "p_name", label: "Profilname (z.B. Abzeilen / Schlichten)", type: "text" },
                { id: "p_type", label: "ae-Typ", type: "select", options: ['percent', 'fixed'] },
                { id: "p_val", label: "ae-Wert (% vom D oder mm absolut)", type: "number", step: "0.1" },
                { id: "p_fz", label: "Vorschub pro Zahn fz (mm)", type: "number", step: "0.01" }
            ],
            createObj: (inputs) => ({
                id: 'prof_' + Date.now(),
                name: inputs.p_name,
                aeType: inputs.p_type,
                aeValue: parseFloat(inputs.p_val),
                fz: parseFloat(inputs.p_fz)
            }),
            renderListItem: (item) => `<strong>${item.name}</strong> (ae: ${item.aeValue}${item.aeType === 'percent' ? '%' : 'mm'}, fz: ${item.fz})`
        };
    }

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

    // --- BULK SMART PASTE MULTI-LINE PARSER LOGIK ---
    if(tabName === 'toolTab') {
        document.getElementById('bulkParseBtn').onclick = () => {
            const rawTextBlock = document.getElementById('bulkPasteTextarea').value;
            if(!rawTextBlock.trim()) {
                alert("Bitte fügen Sie Text in das Textfeld ein.");
                return;
            }

            // Text in einzelne Zeilen aufteilen
            const lines = rawTextBlock.split(/\r?\n/);
            let importedCount = 0;
            const currentCatId = document.getElementById('t_cat').value;

            lines.forEach(line => {
                if(!line.trim()) return; // Leere Zeilen überspringen

                // Regex-Extraktion pro Zeile
                const dMatch = line.match(/(?:d|Ø|\b)\s*([0-9]+[.,]?[0-9]*)\s*(?:mm)?\b/i);
                const zMatch = line.match(/(?:z|schneider|schneiden)\s*[:=]?\s*([0-9]+)\b|\b([0-9]+)\s*(?:Z\b|schneider|schneidig)/i);
                const lMatch = line.match(/(?:l|auskragung|länge)\s*[:=]?\s*([0-9]+[.,]?[0-9]*)/i);

                const diameter = dMatch && dMatch[1] ? parseFloat(dMatch[1].replace(',', '.')) : 10;
                const teeth = zMatch ? parseInt(zMatch[1] || zMatch[2]) : 4;
                const length = lMatch && lMatch[1] ? parseFloat(lMatch[1].replace(',', '.')) : (diameter * 3);

                // Neues Werkzeug-Objekt generieren
                const newTool = {
                    id: 'tool_' + Date.now() + '_' + Math.random().toString(36.substring(2, 7)),
                    name: line.trim(),
                    manufacturer: '',
                    categoryId: currentCatId,
                    d: diameter,
                    z: teeth,
                    l: length,
                    imageUrl: ''
                };

                db.tools.push(newTool);
                importedCount++;
            });

            if(importedCount > 0) {
                saveData(db);
                renderAdminTab(tabName);
                alert(`Erfolgreich ${importedCount} Werkzeuge aus dem Textblock importiert und angelegt!`);
            } else {
                alert("Es konnten keine Werkzeuge in den Zeilen erkannt werden.");
            }
        };
    }

    document.getElementById('adminForm').onsubmit = (e) => {
        e.preventDefault();
        let inputs = {};
        if(config.fields) {
            config.fields.forEach(f => { inputs[f.id] = document.getElementById(f.id).value; });
        }
        
        let newObj = config.createObj(inputs);
        db[config.key].push(newObj);
        saveData(db);
        
        renderAdminTab(tabName);
    };

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

    window._delAdminItem = (key, index) => {
        if(confirm("Eintrag wirklich löschen?")) {
            let curDb = getData();
            curDb[key].splice(index, 1);
            saveData(curDb);
            renderAdminTab(tabName);
        }
    };
}
