// admin.js
import { getData, saveData } from './storage.js';

export function initAdmin(onUpdateCallback) {
    setupAdminToggle(onUpdateCallback);
}

function setupAdminToggle(onUpdateCallback) {
    const allButtons = document.querySelectorAll('button');
    let targetBtn = null;
    allButtons.forEach(b => {
        if (b.textContent.toLowerCase().includes('admin')) targetBtn = b;
    });

    if (targetBtn) {
        targetBtn.onclick = (e) => {
            e.preventDefault();
            toggleAdminView(onUpdateCallback);
        };
    }
}

function toggleAdminView(onUpdateCallback) {
    let adminContainer = document.getElementById('adminContainer');
    
    if (adminContainer) {
        adminContainer.style.display = adminContainer.style.display === 'none' ? 'block' : 'none';
    } else {
        const mainCard = document.querySelector('.card, [style*="border"]') || document.body.children[0];
        
        adminContainer = document.createElement('div');
        adminContainer.id = 'adminContainer';
        adminContainer.style.cssText = 'max-width: 850px; margin: 20px auto; padding: 25px; background: #ffffff; border: 1px solid #d1d5db; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); font-family: inherit;';
        
        const stepArea = document.getElementById('stepContentArea') || mainCard;
        stepArea.parentNode.insertBefore(adminContainer, stepArea.nextSibling);

        renderAdminUI(adminContainer, onUpdateCallback);
    }
}

function renderAdminUI(container, onUpdateCallback, activeTab = 'tools') {
    const db = getData();

    container.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
            <h3 style="margin: 0; color: #1f2937;">Admin-Bereich & Datenverwaltung</h3>
            <button id="closeAdminBtn" style="background: none; border: none; font-size: 1.2em; cursor: pointer; color: #6b7280;">✕</button>
        </div>
        
        <!-- Navigation Tabs -->
        <div style="display: flex; gap: 5px; border-bottom: 2px solid #e5e7eb; margin-bottom: 20px; padding-bottom: 5px;">
            <button class="admin-tab-btn" data-tab="tools" style="padding: 6px 12px; border: none; background: ${activeTab === 'tools' ? '#3b82f6' : '#f3f4f6'}; color: ${activeTab === 'tools' ? '#fff' : '#374151'}; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 0.85em;">Werkzeuge & vc-Matrix</button>
            <button class="admin-tab-btn" data-tab="machines" style="padding: 6px 12px; border: none; background: ${activeTab === 'machines' ? '#3b82f6' : '#f3f4f6'}; color: ${activeTab === 'machines' ? '#fff' : '#374151'}; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 0.85em;">Maschinen</button>
            <button class="admin-tab-btn" data-tab="materials" style="padding: 6px 12px; border: none; background: ${activeTab === 'materials' ? '#3b82f6' : '#f3f4f6'}; color: ${activeTab === 'materials' ? '#fff' : '#374151'}; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 0.85em;">Werkstoffe</button>
            <button class="admin-tab-btn" data-tab="profiles" style="padding: 6px 12px; border: none; background: ${activeTab === 'profiles' ? '#3b82f6' : '#f3f4f6'}; color: ${activeTab === 'profiles' ? '#fff' : '#374151'}; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 0.85em;">Profile</button>
        </div>

        <div id="adminTabContent"></div>
    `;

    container.querySelector('#closeAdminBtn').onclick = () => {
        container.style.display = 'none';
    };

    container.querySelectorAll('.admin-tab-btn').forEach(btn => {
        btn.onclick = () => {
            renderAdminUI(container, onUpdateCallback, btn.dataset.tab);
        };
    });

    const contentArea = container.querySelector('#adminTabContent');
    if (activeTab === 'tools') renderToolsTab(contentArea, db, container, onUpdateCallback);
    if (activeTab === 'machines') renderMachinesTab(contentArea, db, container, onUpdateCallback);
    if (activeTab === 'materials') renderMaterialsTab(contentArea, db, container, onUpdateCallback);
    if (activeTab === 'profiles') renderProfilesTab(contentArea, db, container, onUpdateCallback);
}

// --- TAB: TOOLS ---
function renderToolsTab(contentArea, db, container, onUpdateCallback) {
    contentArea.innerHTML = `
        <h4 style="font-size: 0.9em; color: #374151; margin-top:0;">Einzelnes Werkzeug manuell hinzufügen</h4>
        <form id="addSingleToolForm" style="display: grid; grid-template-columns: 2fr 1fr 1fr 1fr auto; gap: 8px; margin-bottom: 20px; font-size: 0.8em;">
            <input type="text" name="name" placeholder="Werkzeugname" required style="padding: 5px; border: 1px solid #d1d5db; border-radius: 4px;">
            <input type="number" name="d" placeholder="D (mm)" step="0.1" required style="padding: 5px; border: 1px solid #d1d5db; border-radius: 4px;">
            <input type="number" name="z" placeholder="Z (Zähne)" required style="padding: 5px; border: 1px solid #d1d5db; border-radius: 4px;">
            <input type="number" name="l" placeholder="L (Länge)" step="0.1" required style="padding: 5px; border: 1px solid #d1d5db; border-radius: 4px;">
            <button type="submit" style="background: #22c55e; color: #fff; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">Hinzufügen</button>
        </form>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 15px 0;">

        <h4 style="font-size: 0.9em; color: #374151; margin-top:0;">Massenimport (Excel / CSV / Smart Paste)</h4>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
            <div style="background: #f9fafb; padding: 12px; border: 1px solid #e5e7eb; border-radius: 8px;">
                <h4 style="margin-top: 0; font-size: 0.85em; color: #374151;">Excel- / CSV-Datei</h4>
                <input type="file" id="excelUploadInput" accept=".xlsx, .xls, .csv" style="margin-bottom: 6px; width: 100%; font-size: 0.8em;">
                <div style="font-size: 0.7em; color: #6b7280;">Unterstützt .xlsx, .xls, .csv mit Kopfzeile.</div>
            </div>
            
            <div style="background: #f9fafb; padding: 12px; border: 1px solid #e5e7eb; border-radius: 8px;">
                <h4 style="margin-top: 0; font-size: 0.85em; color: #374151;">Smart Paste (Text)</h4>
                <textarea id="bulkDataInput" placeholder="Name | D | Z | L&#10;Fräser 10 | 10 | 4 | 30" style="width: 100%; height: 45px; padding: 6px; font-family: monospace; font-size: 0.8em; box-sizing: border-box; border: 1px solid #d1d5db; border-radius: 4px;"></textarea>
                <button id="parseBulkBtn" style="margin-top: 4px; padding: 4px 8px; background: #3b82f6; color: #fff; border: none; border-radius: 4px; cursor: pointer; font-size: 0.8em;">Analysieren & Vorschau</button>
            </div>
        </div>

        <div id="stagingArea" style="display: none; background: #f0fdf4; padding: 12px; border: 1px solid #22c55e; border-radius: 8px; margin-bottom: 20px;">
            <h4 style="color: #15803d; margin-top: 0; font-size: 0.9em;">Import-Vorschau & Korrektur</h4>
            <div style="max-height: 150px; overflow-y: auto; margin-bottom: 8px; background: #fff; border: 1px solid #d1d5db; border-radius: 4px;">
                <table style="width: 100%; border-collapse: collapse; font-size: 0.8em;">
                    <thead>
                        <tr style="background: #f3f4f6; text-align: left;">
                            <th style="padding: 4px; border-bottom: 1px solid #d1d5db;">Name</th>
                            <th style="padding: 4px; border-bottom: 1px solid #d1d5db;">D (mm)</th>
                            <th style="padding: 4px; border-bottom: 1px solid #d1d5db;">Z</th>
                            <th style="padding: 4px; border-bottom: 1px solid #d1d5db;">L (mm)</th>
                            <th style="padding: 4px; border-bottom: 1px solid #d1d5db; width: 30px;"></th>
                        </tr>
                    </thead>
                    <tbody id="stagingTbody"></tbody>
                </table>
            </div>
            <button id="confirmImportBtn" style="padding: 5px 10px; background: #22c55e; color: #fff; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 0.8em;">Verbindlich speichern</button>
            <button id="cancelImportBtn" style="padding: 5px 10px; background: #ef4444; color: #fff; border: none; border-radius: 4px; cursor: pointer; margin-left: 6px; font-size: 0.8em;">Verwerfen</button>
        </div>

        <!-- Container für werkzeugspezifische vc-Bearbeitung -->
        <div id="vcEditorContainer" style="display: none; background: #eff6ff; border: 1px solid #3b82f6; border-radius: 8px; padding: 12px; margin-bottom: 20px;"></div>

        <h4 style="font-size: 0.9em; color: #374151; margin-bottom: 6px;">Vorhandene Werkzeuge (${db.tools.length})</h4>
        <div style="max-height: 180px; overflow-y: auto; background: #fff; border: 1px solid #e5e7eb; border-radius: 6px;">
            <table style="width: 100%; border-collapse: collapse; font-size: 0.8em;">
                <thead>
                    <tr style="background: #f9fafb; text-align: left;">
                        <th style="padding: 5px; border-bottom: 1px solid #e5e7eb;">Name</th>
                        <th style="padding: 5px; border-bottom: 1px solid #e5e7eb;">D</th>
                        <th style="padding: 5px; border-bottom: 1px solid #e5e7eb;">Z</th>
                        <th style="padding: 5px; border-bottom: 1px solid #e5e7eb;">L</th>
                        <th style="padding: 5px; border-bottom: 1px solid #e5e7eb; text-align: right;">Schnittwerte (vc)</th>
                        <th style="padding: 5px; border-bottom: 1px solid #e5e7eb; width: 50px;"></th>
                    </tr>
                </thead>
                <tbody>
                    ${db.tools.length === 0 ? '<tr><td colspan="6" style="padding: 8px; text-align: center; color: #6b7280;">Keine Werkzeuge vorhanden</td></tr>' : ''}
                    ${db.tools.map(t => `
                        <tr>
                            <td style="padding: 5px; border-bottom: 1px solid #f3f4f6;">${t.name}</td>
                            <td style="padding: 5px; border-bottom: 1px solid #f3f4f6;">${t.d}</td>
                            <td style="padding: 5px; border-bottom: 1px solid #f3f4f6;">${t.z}</td>
                            <td style="padding: 5px; border-bottom: 1px solid #f3f4f6;">${t.l}</td>
                            <td style="padding: 5px; border-bottom: 1px solid #f3f4f6; text-align: right;">
                                <button class="edit-vc-btn" data-id="${t.id}" style="background: #3b82f6; color: #fff; border: none; padding: 2px 6px; border-radius: 3px; cursor: pointer; font-size: 0.75em;">vc je Werkstoff</button>
                            </td>
                            <td style="padding: 5px; border-bottom: 1px solid #f3f4f6; text-align: right;">
                                <button class="delete-tool-btn" data-id="${t.id}" style="background: #ef4444; color: #fff; border: none; padding: 2px 5px; border-radius: 3px; cursor: pointer; font-size: 0.75em;">Löschen</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;

    // Handler für manuelle Einzelerfassung
    contentArea.querySelector('#addSingleToolForm').onsubmit = (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        db.tools.push({
            id: 'tool_' + Date.now(),
            name: fd.get('name'),
            d: parseFloat(fd.get('d')),
            z: parseInt(fd.get('z')),
            l: parseFloat(fd.get('l')),
            materialVc: {} // Speichert werkstoffspezifische vc Werte { materialId: vcValue }
        });
        saveData(db);
        renderAdminUI(container, onUpdateCallback, 'tools');
        if (onUpdateCallback) onUpdateCallback();
    };

    contentArea.querySelector('#parseBulkBtn').onclick = () => {
        const rawText = contentArea.querySelector('#bulkDataInput').value;
        const parsedRows = parseTextData(rawText);
        showStagingArea(contentArea, parsedRows, onUpdateCallback);
    };

    const fileInput = contentArea.querySelector('#excelUploadInput');
    fileInput.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        const fileName = file.name.toLowerCase();

        if (fileName.endsWith('.csv') || fileName.endsWith('.txt')) {
            reader.onload = (event) => {
                const parsedRows = parseTextData(event.target.result);
                showStagingArea(contentArea, parsedRows, onUpdateCallback);
            };
            reader.readAsText(file);
        } else {
            reader.onload = (event) => {
                try {
                    if (window.XLSX) {
                        const data = new Uint8Array(event.target.result);
                        const workbook = window.XLSX.read(data, { type: 'array' });
                        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                        const json = window.XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                        const parsedRows = parseArrayData(json);
                        showStagingArea(contentArea, parsedRows, onUpdateCallback);
                    } else {
                        alert("Für .xlsx-Dateien wird SheetJS benötigt. Bitte nutzen Sie CSV.");
                    }
                } catch (err) {
                    alert("Fehler: " + err.message);
                }
            };
            reader.readAsArrayBuffer(file);
        }
    };

    // vc-Editor öffnen
    contentArea.querySelectorAll('.edit-vc-btn').forEach(btn => {
        btn.onclick = () => {
            const toolId = btn.dataset.id;
            const tool = db.tools.find(t => t.id === toolId);
            if (!tool) return;
            showVcEditor(contentArea, tool, db, container, onUpdateCallback);
        };
    });

    contentArea.querySelectorAll('.delete-tool-btn').forEach(btn => {
        btn.onclick = () => {
            const id = btn.dataset.id;
            db.tools = db.tools.filter(t => t.id !== id);
            saveData(db);
            renderAdminUI(container, onUpdateCallback, 'tools');
            if (onUpdateCallback) onUpdateCallback();
        };
    });
}

// Editor für werkstoffspezifische vc-Werte eines Werkzeugs
function showVcEditor(contentArea, tool, db, container, onUpdateCallback) {
    const editorDiv = contentArea.querySelector('#vcEditorContainer');
    editorDiv.style.display = 'block';

    if (!tool.materialVc) tool.materialVc = {};

    editorDiv.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <h4 style="margin: 0; font-size: 0.9em; color: #1e40af;">Schnittgeschwindigkeiten (vc) für Werkzeug: <b>${tool.name}</b></h4>
            <button id="closeVcEditor" style="background: none; border: none; cursor: pointer; font-size: 1.1em; color: #1e40af;">✕</button>
        </div>
        <p style="font-size: 0.75em; color: #4b5563; margin-top: 0; margin-bottom: 10px;">Legen Sie fest, welchen vc-Wert dieses Werkzeug in den jeweiligen Werkstoffen hat. Leer lassen = Werkstoff-Standard.</p>
        
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 8px; margin-bottom: 10px;">
            ${db.materials.length === 0 ? '<div style="font-size: 0.8em; color: #6b7280;">Keine Werkstoffe definiert. Bitte zuerst Werkstoffe anlegen.</div>' : ''}
            ${db.materials.map(mat => {
                const currentVal = tool.materialVc[mat.id] !== undefined ? tool.materialVc[mat.id] : '';
                return `
                    <div style="background: #fff; padding: 6px 8px; border: 1px solid #bfdbfe; border-radius: 4px; font-size: 0.8em;">
                        <div style="font-weight: bold; color: #374151; margin-bottom: 2px;">${mat.name} <span style="font-weight: normal; color: #6b7280;">(Std: ${mat.vc})</span></div>
                        <div style="display: flex; align-items: center; gap: 4px;">
                            <input type="number" class="vc-input" data-matid="${mat.id}" value="${currentVal}" placeholder="Standard (${mat.vc})" style="width: 100%; padding: 3px; border: 1px solid #d1d5db; border-radius: 3px; font-size: 0.8em;">
                            <span style="font-size: 0.75em; color: #6b7280;">m/min</span>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
        <button id="saveVcEditorBtn" style="background: #2563eb; color: #fff; border: none; padding: 5px 12px; border-radius: 4px; cursor: pointer; font-size: 0.8em; font-weight: bold;">vc-Werte speichern</button>
    `;

    editorDiv.querySelector('#closeVcEditor').onclick = () => {
        editorDiv.style.display = 'none';
    };

    editorDiv.querySelector('#saveVcEditorBtn').onclick = () => {
        editorDiv.querySelectorAll('.vc-input').forEach(input => {
            const matId = input.dataset.matid;
            const val = input.value.trim();
            if (val === '') {
                delete tool.materialVc[matId];
            } else {
                tool.materialVc[matId] = parseFloat(val);
            }
        });
        saveData(db);
        editorDiv.style.display = 'none';
        if (onUpdateCallback) onUpdateCallback();
        alert(`Schnittwerte für ${tool.name} aktualisiert!`);
    };
}

// --- TAB: MACHINES ---
function renderMachinesTab(contentArea, db, container, onUpdateCallback) {
    contentArea.innerHTML = `
        <h4 style="font-size: 0.9em; color: #374151; margin-top:0;">Neue Maschine hinzufügen</h4>
        <form id="addMachineForm" style="display: grid; grid-template-columns: 2fr 1fr 1fr 1fr auto; gap: 8px; margin-bottom: 15px; font-size: 0.8em;">
            <input type="text" name="name" placeholder="Maschinenname" required style="padding: 5px; border: 1px solid #d1d5db; border-radius: 4px;">
            <input type="number" name="maxRpm" placeholder="Max U/min" required style="padding: 5px; border: 1px solid #d1d5db; border-radius: 4px;">
            <input type="number" name="maxFeed" placeholder="Max Vorschub" required style="padding: 5px; border: 1px solid #d1d5db; border-radius: 4px;">
            <input type="number" name="powerKw" placeholder="Leistung kW" step="0.1" required style="padding: 5px; border: 1px solid #d1d5db; border-radius: 4px;">
            <button type="submit" style="background: #22c55e; color: #fff; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">Hinzufügen</button>
        </form>
        <h4 style="font-size: 0.9em; color: #374151; margin-bottom: 6px;">Vorhandene Maschinen (${db.machines.length})</h4>
        <div style="max-height: 180px; overflow-y: auto; background: #fff; border: 1px solid #e5e7eb; border-radius: 6px;">
            <table style="width: 100%; border-collapse: collapse; font-size: 0.8em;">
                <thead>
                    <tr style="background: #f9fafb; text-align: left;">
                        <th style="padding: 5px; border-bottom: 1px solid #e5e7eb;">Name</th>
                        <th style="padding: 5px; border-bottom: 1px solid #e5e7eb;">Max U/min</th>
                        <th style="padding: 5px; border-bottom: 1px solid #e5e7eb;">Max Vorschub</th>
                        <th style="padding: 5px; border-bottom: 1px solid #e5e7eb;">Leistung</th>
                        <th style="padding: 5px; border-bottom: 1px solid #e5e7eb; width: 50px;"></th>
                    </tr>
                </thead>
                <tbody>
                    ${db.machines.map(m => `
                        <tr>
                            <td style="padding: 5px; border-bottom: 1px solid #f3f4f6;">${m.name}</td>
                            <td style="padding: 5px; border-bottom: 1px solid #f3f4f6;">${m.maxRpm}</td>
                            <td style="padding: 5px; border-bottom: 1px solid #f3f4f6;">${m.maxFeed}</td>
                            <td style="padding: 5px; border-bottom: 1px solid #f3f4f6;">${m.powerKw} kW</td>
                            <td style="padding: 5px; border-bottom: 1px solid #f3f4f6; text-align: right;">
                                <button class="delete-machine-btn" data-id="${m.id}" style="background: #ef4444; color: #fff; border: none; padding: 2px 5px; border-radius: 3px; cursor: pointer; font-size: 0.75em;">Löschen</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;

    contentArea.querySelector('#addMachineForm').onsubmit = (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        db.machines.push({
            id: 'mach_' + Date.now(),
            name: fd.get('name'),
            maxRpm: parseFloat(fd.get('maxRpm')),
            maxFeed: parseFloat(fd.get('maxFeed')),
            powerKw: parseFloat(fd.get('powerKw'))
        });
        saveData(db);
        renderAdminUI(container, onUpdateCallback, 'machines');
        if (onUpdateCallback) onUpdateCallback();
    };

    contentArea.querySelectorAll('.delete-machine-btn').forEach(btn => {
        btn.onclick = () => {
            db.machines = db.machines.filter(m => m.id !== btn.dataset.id);
            saveData(db);
            renderAdminUI(container, onUpdateCallback, 'machines');
            if (onUpdateCallback) onUpdateCallback();
        };
    });
}

// --- TAB: MATERIALS ---
function renderMaterialsTab(contentArea, db, container, onUpdateCallback) {
    contentArea.innerHTML = `
        <h4 style="font-size: 0.9em; color: #374151; margin-top:0;">Neuen Werkstoff hinzufügen</h4>
        <form id="addMaterialForm" style="display: grid; grid-template-columns: 2fr 1fr 1fr auto; gap: 8px; margin-bottom: 15px; font-size: 0.8em;">
            <input type="text" name="name" placeholder="Werkstoffname" required style="padding: 5px; border: 1px solid #d1d5db; border-radius: 4px;">
            <input type="text" name="isoGroup" placeholder="ISO Gruppe (z.B. P)" required style="padding: 5px; border: 1px solid #d1d5db; border-radius: 4px;">
            <input type="number" name="vc" placeholder="v_c (Standard m/min)" required style="padding: 5px; border: 1px solid #d1d5db; border-radius: 4px;">
            <button type="submit" style="background: #22c55e; color: #fff; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">Hinzufügen</button>
        </form>
        <h4 style="font-size: 0.9em; color: #374151; margin-bottom: 6px;">Vorhandene Werkstoffe (${db.materials.length})</h4>
        <div style="max-height: 180px; overflow-y: auto; background: #fff; border: 1px solid #e5e7eb; border-radius: 6px;">
            <table style="width: 100%; border-collapse: collapse; font-size: 0.8em;">
                <thead>
                    <tr style="background: #f9fafb; text-align: left;">
                        <th style="padding: 5px; border-bottom: 1px solid #e5e7eb;">Name</th>
                        <th style="padding: 5px; border-bottom: 1px solid #e5e7eb;">ISO-Gruppe</th>
                        <th style="padding: 5px; border-bottom: 1px solid #e5e7eb;">Standard-vc (m/min)</th>
                        <th style="padding: 5px; border-bottom: 1px solid #e5e7eb; width: 50px;"></th>
                    </tr>
                </thead>
                <tbody>
                    ${db.materials.map(mat => `
                        <tr>
                            <td style="padding: 5px; border-bottom: 1px solid #f3f4f6;">${mat.name}</td>
                            <td style="padding: 5px; border-bottom: 1px solid #f3f4f6;">ISO ${mat.isoGroup}</td>
                            <td style="padding: 5px; border-bottom: 1px solid #f3f4f6;">${mat.vc}</td>
                            <td style="padding: 5px; border-bottom: 1px solid #f3f4f6; text-align: right;">
                                <button class="delete-material-btn" data-id="${mat.id}" style="background: #ef4444; color: #fff; border: none; padding: 2px 5px; border-radius: 3px; cursor: pointer; font-size: 0.75em;">Löschen</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;

    contentArea.querySelector('#addMaterialForm').onsubmit = (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        db.materials.push({
            id: 'mat_' + Date.now(),
            name: fd.get('name'),
            isoGroup: fd.get('isoGroup'),
            vc: parseFloat(fd.get('vc'))
        });
        saveData(db);
        renderAdminUI(container, onUpdateCallback, 'materials');
        if (onUpdateCallback) onUpdateCallback();
    };

    contentArea.querySelectorAll('.delete-material-btn').forEach(btn => {
        btn.onclick = () => {
            db.materials = db.materials.filter(m => m.id !== btn.dataset.id);
            saveData(db);
            renderAdminUI(container, onUpdateCallback, 'materials');
            if (onUpdateCallback) onUpdateCallback();
        };
    });
}

// --- TAB: PROFILES ---
function renderProfilesTab(contentArea, db, container, onUpdateCallback) {
    contentArea.innerHTML = `
        <h4 style="font-size: 0.9em; color: #374151; margin-top:0;">Neues Profil hinzufügen</h4>
        <form id="addProfileForm" style="display: grid; grid-template-columns: 2fr 1fr 1fr 1fr auto; gap: 8px; margin-bottom: 15px; font-size: 0.8em;">
            <input type="text" name="name" placeholder="Profilname" required style="padding: 5px; border: 1px solid #d1d5db; border-radius: 4px;">
            <input type="number" name="aeValue" placeholder="a_e Wert" step="0.1" required style="padding: 5px; border: 1px solid #d1d5db; border-radius: 4px;">
            <select name="aeType" style="padding: 5px; border: 1px solid #d1d5db; border-radius: 4px;">
                <option value="percent">% vom D</option>
                <option value="mm">mm</option>
            </select>
            <input type="number" name="fz" placeholder="f_z (Zahnvorschub)" step="0.01" required style="padding: 5px; border: 1px solid #d1d5db; border-radius: 4px;">
            <button type="submit" style="background: #22c55e; color: #fff; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">Hinzufügen</button>
        </form>
        <h4 style="font-size: 0.9em; color: #374151; margin-bottom: 6px;">Vorhandene Profile (${db.profiles.length})</h4>
        <div style="max-height: 180px; overflow-y: auto; background: #fff; border: 1px solid #e5e7eb; border-radius: 6px;">
            <table style="width: 100%; border-collapse: collapse; font-size: 0.8em;">
                <thead>
                    <tr style="background: #f9fafb; text-align: left;">
                        <th style="padding: 5px; border-bottom: 1px solid #e5e7eb;">Name</th>
                        <th style="padding: 5px; border-bottom: 1px solid #e5e7eb;">a_e</th>
                        <th style="padding: 5px; border-bottom: 1px solid #e5e7eb;">f_z</th>
                        <th style="padding: 5px; border-bottom: 1px solid #e5e7eb; width: 50px;"></th>
                    </tr>
                </thead>
                <tbody>
                    ${db.profiles.map(p => `
                        <tr>
                            <td style="padding: 5px; border-bottom: 1px solid #f3f4f6;">${p.name}</td>
                            <td style="padding: 5px; border-bottom: 1px solid #f3f4f6;">${p.aeValue}${p.aeType === 'percent' ? '% vom D' : 'mm'}</td>
                            <td style="padding: 5px; border-bottom: 1px solid #f3f4f6;">${p.fz} mm</td>
                            <td style="padding: 5px; border-bottom: 1px solid #f3f4f6; text-align: right;">
                                <button class="delete-profile-btn" data-id="${p.id}" style="background: #ef4444; color: #fff; border: none; padding: 2px 5px; border-radius: 3px; cursor: pointer; font-size: 0.75em;">Löschen</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;

    contentArea.querySelector('#addProfileForm').onsubmit = (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        db.profiles.push({
            id: 'prof_' + Date.now(),
            name: fd.get('name'),
            aeValue: parseFloat(fd.get('aeValue')),
            aeType: fd.get('aeType'),
            fz: parseFloat(fd.get('fz'))
        });
        saveData(db);
        renderAdminUI(container, onUpdateCallback, 'profiles');
        if (onUpdateCallback) onUpdateCallback();
    };

    contentArea.querySelectorAll('.delete-profile-btn').forEach(btn => {
        btn.onclick = () => {
            db.profiles = db.profiles.filter(p => p.id !== btn.dataset.id);
            saveData(db);
            renderAdminUI(container, onUpdateCallback, 'profiles');
            if (onUpdateCallback) onUpdateCallback();
        };
    });
}

function parseTextData(text) {
    const lines = text.split('\n');
    const rows = [];
    for (let line of lines) {
        if (!line.trim()) continue;
        const parts = line.split(/[\t;,|]+/).map(p => p.trim());
        if (parts.length >= 2) {
            let name = parts[0];
            let d = extractNumber(parts[1]) || 10;
            let z = extractNumber(parts[2]) || 2;
            let l = parts[3] ? extractNumber(parts[3]) : (d * 3);

            if (isNaN(d) || name.toLowerCase().includes('name') || name.toLowerCase().includes('durchmesser')) continue;
            rows.push({ name, d, z, l });
        }
    }
    return rows;
}

function parseArrayData(arrayData) {
    const rows = [];
    for (let i = 1; i < arrayData.length; i++) {
        const row = arrayData[i];
        if (!row || row.length === 0) continue;
        let name = String(row[0] || 'Werkzeug ' + i);
        let d = extractNumber(row[1]) || 10;
        let z = extractNumber(row[2]) || 2;
        let l = row[3] ? extractNumber(row[3]) : (d * 3);

        if (!isNaN(d)) {
            rows.push({ name, d, z, l });
        }
    }
    return rows;
}

function extractNumber(val) {
    if (typeof val === 'number') return val;
    if (!val) return null;
    const clean = String(val).replace(',', '.').replace(/[^0-9.]/g, '');
    const num = parseFloat(clean);
    return isNaN(num) ? null : num;
}

function showStagingArea(container, rows, onUpdateCallback) {
    const stagingArea = container.querySelector('#stagingArea');
    const tbody = container.querySelector('#stagingTbody');
    
    if (rows.length === 0) {
        alert("Es konnten keine gültigen Werkzeugdaten erkannt werden.");
        return;
    }

    stagingArea.style.display = 'block';
    tbody.innerHTML = '';

    rows.forEach((row, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="padding: 4px; border-bottom: 1px solid #e5e7eb;"><input type="text" value="${row.name}" data-index="${index}" data-field="name" style="width: 100%; border: none; background: transparent; font-size: 0.8em;"></td>
            <td style="padding: 4px; border-bottom: 1px solid #e5e7eb;"><input type="number" value="${row.d}" data-index="${index}" data-field="d" style="width: 100%; border: none; background: transparent; font-size: 0.8em;"></td>
            <td style="padding: 4px; border-bottom: 1px solid #e5e7eb;"><input type="number" value="${row.z}" data-index="${index}" data-field="z" style="width: 100%; border: none; background: transparent; font-size: 0.8em;"></td>
            <td style="padding: 4px; border-bottom: 1px solid #e5e7eb;"><input type="number" value="${row.l}" data-index="${index}" data-field="l" style="width: 100%; border: none; background: transparent; font-size: 0.8em;"></td>
            <td style="padding: 4px; border-bottom: 1px solid #e5e7eb; text-align: center;"><button class="remove-row-btn" data-index="${index}" style="background: #ef4444; color: #fff; border: none; border-radius: 3px; cursor: pointer; padding: 2px 4px; font-size: 0.7em;">✕</button></td>
        `;
        tbody.appendChild(tr);
    });

    let stagingData = [...rows];

    tbody.querySelectorAll('input').forEach(input => {
        input.onchange = (e) => {
            const idx = parseInt(e.target.dataset.index);
            const field = e.target.dataset.field;
            let val = e.target.value;
            if (field !== 'name') val = parseFloat(val) || 0;
            stagingData[idx][field] = val;
        };
    });

    tbody.querySelectorAll('.remove-row-btn').forEach(btn => {
        btn.onclick = (e) => {
            const idx = parseInt(e.target.dataset.index);
            stagingData.splice(idx, 1);
            showStagingArea(container, stagingData, onUpdateCallback);
        };
    });

    container.querySelector('#confirmImportBtn').onclick = () => {
        const db = getData();
        stagingData.forEach(item => {
            db.tools.push({
                id: 'tool_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
                name: item.name,
                d: item.d,
                z: item.z,
                l: item.l,
                materialVc: {}
            });
        });
        saveData(db);
        stagingArea.style.display = 'none';
        renderAdminUI(container, onUpdateCallback, 'tools');
        if (onUpdateCallback) onUpdateCallback();
        alert(`${stagingData.length} Werkzeuge erfolgreich importiert!`);
    };

    container.querySelector('#cancelImportBtn').onclick = () => {
        stagingArea.style.display = 'none';
    };
}
