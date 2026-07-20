// admin.js
import { getData, saveData, exportDB, importDB, resetDB } from './storage.js';

export function initAdmin(onDataChangedCallback) {
    const adminBtn = document.getElementById('adminBtn');
    const adminModal = document.getElementById('adminModal');
    const closeBtn = document.getElementById('closeAdminBtn');
    const tabs = document.querySelectorAll('.tab-btn');
    const factoryResetBtn = document.getElementById('factoryResetBtn');
    const fileInput = document.getElementById('importFile');

    if (factoryResetBtn) {
        factoryResetBtn.addEventListener('click', () => {
            if(confirm("WARNUNG: Alle eigenen Daten gehen verloren. Zurücksetzen?")) {
                resetDB();
                if (onDataChangedCallback) onDataChangedCallback();
                renderAdminTab('machTab');
            }
        });
    }

    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            if(e.target.files.length > 0) {
                importDB(e.target.files[0], (success, msg) => {
                    alert(msg);
                    if(success) {
                        if (onDataChangedCallback) onDataChangedCallback();
                        if (adminModal) adminModal.style.display = 'none';
                    }
                });
            }
        });
    }

    if (adminBtn && adminModal) {
        adminBtn.onclick = () => {
            adminModal.style.display = 'block';
            renderAdminTab('machTab');
        };
    }

    if (closeBtn && adminModal) {
        closeBtn.onclick = () => adminModal.style.display = 'none';
    }

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
    const list = document.getElementById('admin-list');
    const hr = document.getElementById('admin-hr');
    const listTitle = document.getElementById('admin-list-title');

    if (list) list.innerHTML = '';
    if (hr) hr.style.display = 'none';
    if (listTitle) listTitle.style.display = 'none';

    if (container) {
        container.innerHTML = `
            <div style="text-align: center; padding: 30px;">
                <h3>Sichern Sie Ihre Datenbank</h3>
                <p>Exportieren Sie Ihre Konfiguration als JSON-Datei.</p>
                <button id="exportBtn" style="background: var(--success, #2ecc71); margin: 10px; padding: 10px 20px; color:#fff; border:none; border-radius:4px; cursor:pointer;">💾 Backup herunterladen</button>
                <button id="importBtn" style="background: var(--accent, #0984e3); margin: 10px; padding: 10px 20px; color:#fff; border:none; border-radius:4px; cursor:pointer;">📂 Backup laden</button>
            </div>
        `;
        
        const exportBtn = document.getElementById('exportBtn');
        const importBtn = document.getElementById('importBtn');
        if (exportBtn) exportBtn.onclick = () => exportDB();
        if (importBtn) importBtn.onclick = () => {
            const fileInput = document.getElementById('importFile');
            if (fileInput) fileInput.click();
        };
    }
}

function renderAdminTab(tabName) {
    const db = getData();
    const container = document.getElementById('admin-form-container');
    const list = document.getElementById('admin-list');
    const hr = document.getElementById('admin-hr');
    const listTitle = document.getElementById('admin-list-title');
    
    if (hr) hr.style.display = 'block';
    if (listTitle) listTitle.style.display = 'block';

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
            renderListItem: (item) => `<span style="padding: 2px 6px; border-radius: 4px; font-weight: bold; background: #eee; color: #333;">ISO ${item.isoGroup}</span> <strong>${item.name}</strong> (vc: ${item.vc})`
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
                <div style="background: rgba(9, 132, 227, 0.08); padding: 15px; border-radius: 8px; margin-bottom: 20px; border: 1px dashed var(--accent, #0984e3);">
                    <label style="color: var(--accent, #0984e3); font-weight: bold; display: block; margin-bottom: 5px;">⚡ Bulk Smart Paste (Mehrere Zeilen einfügen)</label>
                    <p style="font-size: 0.85em; margin-bottom: 8px;">Kopieren Sie einen Textblock aus einem PDF-Katalog (jede Zeile ein Werkzeug). Die App legt alle automatisch an.</p>
                    <textarea id="bulkPasteTextarea" rows="4" placeholder="Z.B.&#10;VHM Fräser D6 Z4 L30&#10;VHM Fräser D8 Z4 L40" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px; resize:vertical; margin-bottom:8px;"></textarea>
                    <button type="button" id="bulkParseBtn" style="background: var(--accent, #0984e3); padding: 8px 15px; width:100%; color:#fff; border:none; border-radius:4px; cursor:pointer;">🚀 Alle Zeilen automatisch einlesen & anlegen</button>
                </div>

                <div style="text-align: center; margin: 15px 0; font-weight: bold; opacity: 0.7;">— ODER EINZELN EINGEBEN —</div>

                <div class="input-group" style="margin-bottom:12px;"><label style="display:block; margin-bottom:4px;">Werkzeugname</label><input type="text" id="t_name" style="width:100%; padding:8px;" required></div>
                <div class="input-group" style="margin-bottom:12px;"><label style="display:block; margin-bottom:4px;">Hersteller</label><input type="text" id="t_manu" style="width:100%; padding:8px;"></div>
                <div class="input-group" style="margin-bottom:12px;"><label style="display:block; margin-bottom:4px;">Kategorie</label><select id="t_cat" style="width:100%; padding:8px;">${catOptions}</select></div>
                <div class="input-group" style="display:flex; gap:10px; margin-bottom:12px;">
                    <div style="flex:1"><label style="display:block; margin-bottom:4px;">Durchmesser D (mm)</label><input type="number" id="t_d" step="0.1" style="width:100%; padding:8px;" required></div>
                    <div style="flex:1"><label style="display:block; margin-bottom:4px;">Zähnezahl Z</label><input type="number" id="t_z" style="width:100%; padding:8px;" required></div>
                    <div style="flex:1"><label style="display:block; margin-bottom:4px;">Auskraglänge L (mm)</label><input type="number" id="t_l" step="0.1" value="30" style="width:100%; padding:8px;" required></div>
                </div>
                <div class="input-group" style="margin-bottom:12px;"><label style="display:block; margin-bottom:4px;">Bild-URL (Optional)</label><input type="text" id="t_img" placeholder="https://..." style="width:100%; padding:8px;"></div>
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
            renderListItem: (item) => `<strong>${item.name}</strong> (D${item.d} / Z${item.z} / L:${item.l || 30}mm)`
        };
    }
    else if(tabName === 'profTab') {
        config = {
            title: "Neues Bearbeitungsprofil anlegen",
            key: "profiles",
            fields: [
                { id: "p_name", label: "Profilname (z.B. Schruppen / Schlichten)", type: "text" },
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

    if (container) {
        let formHtml = `<h3>${config.title}</h3><form id="adminForm">`;
        
        if(config.html) {
            formHtml += config.html;
        } else {
            config.fields.forEach(f => {
                if(f.type === 'select') {
                    let opts = f.options.map(o => `<option value="${o}">${o}</option>`).join('');
                    formHtml += `<div class="input-group" style="margin-bottom:12px;"><label style="display:block; margin-bottom:4px;">${f.label}</label><select id="${f.id}" style="width:100%; padding:8px;">${opts}</select></div>`;
                } else {
                    let step = f.step ? `step="${f.step}"` : "";
                    formHtml += `<div class="input-group" style="margin-bottom:12px;"><label style="display:block; margin-bottom:4px;">${f.label}</label><input type="${f.type}" id="${f.id}" ${step} style="width:100%; padding:8px;" required></div>`;
                }
            });
        }
        
        formHtml += `<button type="submit" style="background:var(--success, #2ecc71); color:#fff; padding:10px 20px; border:none; border-radius:4px; cursor:pointer; margin-top:10px;">Speichern</button></form>`;
        container.innerHTML = formHtml;
    }

    if(tabName === 'toolTab') {
        const bulkParseBtn = document.getElementById('bulkParseBtn');
        if (bulkParseBtn) {
            bulkParseBtn.onclick = () => {
                const rawTextBlock = document.getElementById('bulkPasteTextarea').value;
                if(!rawTextBlock.trim()) {
                    alert("Bitte Text einfügen.");
                    return;
                }

                const lines = rawTextBlock.split(/\r?\n/);
                let importedCount = 0;
                const catSelect = document.getElementById('t_cat');
                const currentCatId = catSelect ? catSelect.value : (db.categories[0] ? db.categories[0].id : 'cat1');

                lines.forEach(line => {
                    if(!line.trim()) return;

                    const dMatch = line.match(/(?:d|Ø|\b)\s*([0-9]+[.,]?[0-9]*)\s*(?:mm)?\b/i);
                    const zMatch = line.match(/(?:z|schneider|schneiden)\s*[:=]?\s*([0-9]+)\b|\b([0-9]+)\s*(?:Z\b|schneider|schneidig)/i);
                    const lMatch = line.match(/(?:l|auskragung|länge)\s*[:=]?\s*([0-9]+[.,]?[0-9]*)/i);

                    const diameter = dMatch && dMatch[1] ? parseFloat(dMatch[1].replace(',', '.')) : 10;
                    const teeth = zMatch ? parseInt(zMatch[1] || zMatch[2]) : 4;
                    const length = lMatch && lMatch[1] ? parseFloat(lMatch[1].replace(',', '.')) : (diameter * 3);

                    const newTool = {
                        id: 'tool_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
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
                    if (typeof onDataChangedCallback === 'function') onDataChangedCallback();
                    alert(`Erfolgreich ${importedCount} Werkzeuge importiert!`);
                } else {
                    alert("Keine Werkzeuge erkannt.");
                }
            };
        }
    }

    const adminForm = document.getElementById('adminForm');
    if (adminForm) {
        adminForm.onsubmit = (e) => {
            e.preventDefault();
            let inputs = {};
            if(config.fields) {
                config.fields.forEach(f => { 
                    const el = document.getElementById(f.id);
                    if (el) inputs[f.id] = el.value; 
                });
            }
            
            let newObj = config.createObj(inputs);
            db[config.key].push(newObj);
            saveData(db);
            
            if (typeof onDataChangedCallback === 'function') onDataChangedCallback();
            renderAdminTab(tabName);
        };
    }

    if (list) {
        list.innerHTML = '';
        db[config.key].forEach((item, index) => {
            let div = document.createElement('div');
            div.style.cssText = "display: flex; justify-content: space-between; align-items: center; padding: 10px; border-bottom: 1px solid #eee;";
            div.innerHTML = `
                <div>${config.renderListItem(item)}</div>
                <button style="background:#e74c3c; color:#fff; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;" onclick="window._delAdminItem('${config.key}', ${index})">Löschen</button>
            `;
            list.appendChild(div);
        });
    }

    window._delAdminItem = (key, index) => {
        if(confirm("Eintrag wirklich löschen?")) {
            let curDb = getData();
            curDb[key].splice(index, 1);
            saveData(curDb);
            if (typeof onDataChangedCallback === 'function') onDataChangedCallback();
            renderAdminTab(tabName);
        }
    };
}
