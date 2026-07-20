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
        adminContainer.style.cssText = `
            max-width: 980px; 
            margin: 30px auto; 
            padding: 28px; 
            background: #ffffff; 
            border: 1px solid #e2e8f0; 
            border-radius: 20px; 
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.02); 
            font-family: system-ui, -apple-system, sans-serif;
        `;
        
        const stepArea = document.getElementById('stepContentArea') || mainCard;
        stepArea.parentNode.insertBefore(adminContainer, stepArea.nextSibling);

        renderAdminUI(adminContainer, onUpdateCallback);
    }
}

function renderAdminUI(container, onUpdateCallback, activeTab = 'tools') {
    const db = getData();

    container.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; border-bottom: 2px solid #f1f5f9; padding-bottom: 16px;">
            <div>
                <h3 style="margin: 0; color: #0f172a; font-size: 1.4rem; font-weight: 800; letter-spacing: -0.02em;">Zentraler Admin- & Stammdatenbereich</h3>
                <p style="margin: 6px 0 0 0; color: #64748b; font-size: 0.9rem;">Professionelle Verwaltung von Werkzeugen, Maschinen, Werkstoffen und Schnittwerten</p>
            </div>
            <button id="closeAdminBtn" style="background: #f8fafc; border: 1px solid #e2e8f0; width: 36px; height: 36px; border-radius: 50%; font-size: 1.1rem; cursor: pointer; color: #64748b; display: flex; align-items: center; justify-content: center; transition: all 0.2s;" onmouseover="this.style.background='#ef4444';this.style.color='#fff';this.style.borderColor='#ef4444'" onmouseout="this.style.background='#f8fafc';this.style.color='#64748b';this.style.borderColor='#e2e8f0'">✕</button>
        </div>
        
        <!-- Navigation Tabs -->
        <div style="display: flex; gap: 10px; margin-bottom: 28px; background: #f8fafc; padding: 6px; border-radius: 12px; border: 1px solid #f1f5f9;">
            ${renderTabButton('tools', '🛠️ Werkzeuge & vc-Matrix', activeTab)}
            ${renderTabButton('machines', '⚙️ Maschinen', activeTab)}
            ${renderTabButton('materials', '🧪 Werkstoffe', activeTab)}
            ${renderTabButton('profiles', '📐 Profile / Bearbeitung', activeTab)}
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

function renderTabButton(tabKey, label, activeTab) {
    const isActive = activeTab === tabKey;
    return `
        <button class="admin-tab-btn" data-tab="${tabKey}" style="
            flex: 1;
            padding: 10px 16px; 
            border: none; 
            background: ${isActive ? '#ffffff' : 'transparent'}; 
            color: ${isActive ? '#2563eb' : '#64748b'}; 
            border-radius: 8px; 
            cursor: pointer; 
            font-weight: ${isActive ? '700' : '500'}; 
            font-size: 0.9rem;
            box-shadow: ${isActive ? '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)' : 'none'};
            transition: all 0.2s ease;
        ">${label}</button>
    `;
}

// Helper für ISO-Farbkodes (Shopfloor-Standard)
function getIsoBadge(iso) {
    const group = (iso || '').toUpperCase().trim();
    let bg = '#f1f5f9', color = '#475569', border = '#cbd5e1';
    
    if (group.includes('P')) { bg = '#eff6ff'; color = '#1d4ed8'; border = '#bfdbfe'; } // Stahl (Blau)
    else if (group.includes('M')) { bg = '#fffbeb'; color = '#b45309'; border = '#fde68a'; } // Edelstahl (Gelb)
    else if (group.includes('K')) { bg = '#fef2f2'; color = '#b91c1c'; border = '#fecaca'; } // Guss (Rot)
    else if (group.includes('N')) { bg = '#ecfdf5'; color = '#047857'; border = '#a7f3d0'; } // NE-Metalle (Grün)
    else if (group.includes('S')) { bg = '#f8fafc'; color = '#334155'; border = '#cbd5e1'; } // Superlegierungen
    else if (group.includes('H')) { bg = '#f5f3ff'; color = '#6d28d9'; border = '#ddd6fe'; } // Gehärtet (Violett)

    return `<span style="background: ${bg}; color: ${color}; border: 1px solid ${border}; padding: 2px 8px; border-radius: 6px; font-weight: 700; font-size: 0.75rem;">ISO ${group || '—'}</span>`;
}

// --- TAB: TOOLS ---
function renderToolsTab(contentArea, db, container, onUpdateCallback) {
    contentArea.innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr; gap: 20px;">
            <!-- Sektion 1: Manuelles Hinzufügen & Massenimport -->
            <div style="background: #f8fafc; padding: 20px; border-radius: 14px; border: 1px solid #e2e8f0;">
                <h4 style="font-size: 1rem; color: #1e293b; margin-top:0; margin-bottom: 14px; font-weight: 700;">➕ Neues Werkzeug anlegen</h4>
                <form id="addSingleToolForm" style="display: grid; grid-template-columns: 2fr 1fr 1fr 1fr auto; gap: 12px; align-items: end;">
                    <div>
                        <label style="display:block; font-size: 0.75rem; color: #64748b; font-weight: 600; margin-bottom: 4px;">Werkzeugbezeichnung</label>
                        <input type="text" name="name" placeholder="z.B. VHM Schruppfräser 12" required style="width: 100%; padding: 8px 10px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.85rem; box-sizing: border-box; background: #fff;">
                    </div>
                    <div>
                        <label style="display:block; font-size: 0.75rem; color: #64748b; font-weight: 600; margin-bottom: 4px;">Durchmesser D</label>
                        <input type="number" name="d" placeholder="mm" step="0.1" required style="width: 100%; padding: 8px 10px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.85rem; box-sizing: border-box; background: #fff;">
                    </div>
                    <div>
                        <label style="display:block; font-size: 0.75rem; color: #64748b; font-weight: 600; margin-bottom: 4px;">Zähne (Z)</label>
                        <input type="number" name="z" placeholder="Anzahl" required style="width: 100%; padding: 8px 10px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.85rem; box-sizing: border-box; background: #fff;">
                    </div>
                    <div>
                        <label style="display:block; font-size: 0.75rem; color: #64748b; font-weight: 600; margin-bottom: 4px;">Länge (L)</label>
                        <input type="number" name="l" placeholder="mm" step="0.1" required style="width: 100%; padding: 8px 10px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.85rem; box-sizing: border-box; background: #fff;">
                    </div>
                    <button type="submit" style="background: #10b981; color: #fff; border: none; padding: 9px 16px; border-radius: 8px; cursor: pointer; font-weight: 700; font-size: 0.85rem; height: 38px; box-shadow: 0 2px 4px rgba(16, 185, 129, 0.2); transition: background 0.2s;" onmouseover="this.style.background='#059669'" onmouseout="this.style.background='#10b981'">Hinzufügen</button>
                </form>

                <div style="margin-top: 18px; padding-top: 16px; border-top: 1px solid #e2e8f0; display: flex; gap: 16px; align-items: center;">
                    <div style="flex: 1;">
                        <span style="font-size: 0.8rem; color: #475569; font-weight: 700;">📂 Massenimport (Excel / CSV):</span>
                        <input type="file" id="excelUploadInput" accept=".xlsx, .xls, .csv" style="margin-top: 6px; display: block; font-size: 0.8rem; color: #475569;">
                    </div>
                    <div style="flex: 1;">
                        <textarea id="bulkDataInput" placeholder="Smart Paste: Name | D | Z | L" style="width: 100%; height: 36px; padding: 6px; font-family: monospace; font-size: 0.75rem; border: 1px solid #cbd5e1; border-radius: 8px; vertical-align: middle; box-sizing: border-box; background: #fff;"></textarea>
                    </div>
                    <button id="parseBulkBtn" style="background: #2563eb; color: #fff; border: none; padding: 8px 14px; border-radius: 8px; cursor: pointer; font-size: 0.8rem; height: 36px; font-weight: 600; box-shadow: 0 2px 4px rgba(37, 99, 235, 0.2);">Analysieren</button>
                </div>
            </div>

            <!-- Staging Area für Import -->
            <div id="stagingArea" style="display: none; background: #f0fdf4; padding: 20px; border: 1px solid #10b981; border-radius: 14px;">
                <h4 style="color: #047857; margin-top: 0; font-size: 1rem; font-weight: 700;">✨ Import-Vorschau</h4>
                <div style="max-height: 160px; overflow-y: auto; margin-bottom: 14px; background: #fff; border: 1px solid #a7f3d0; border-radius: 8px;">
                    <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">
                        <thead>
                            <tr style="background: #f0fdf4; text-align: left; color: #065f46;">
                                <th style="padding: 8px; border-bottom: 1px solid #a7f3d0;">Name</th>
                                <th style="padding: 8px; border-bottom: 1px solid #a7f3d0;">D</th>
                                <th style="padding: 8px; border-bottom: 1px solid #a7f3d0;">Z</th>
                                <th style="padding: 8px; border-bottom: 1px solid #a7f3d0;">L</th>
                                <th style="padding: 8px; border-bottom: 1px solid #a7f3d0; width: 30px;"></th>
                            </tr>
                        </thead>
                        <tbody id="stagingTbody"></tbody>
                    </table>
                </div>
                <button id="confirmImportBtn" style="padding: 8px 16px; background: #10b981; color: #fff; border: none; border-radius: 8px; cursor: pointer; font-weight: 700; font-size: 0.85rem; box-shadow: 0 2px 4px rgba(16, 185, 129, 0.2);">Verbindlich speichern</button>
                <button id="cancelImportBtn" style="padding: 8px 16px; background: #ef4444; color: #fff; border: none; border-radius: 8px; cursor: pointer; margin-left: 8px; font-size: 0.85rem; font-weight: 600;">Verwerfen</button>
            </div>

            <!-- vc-Editor Overlay -->
            <div id="vcEditorContainer" style="display: none; background: #f0fdf4; border: 1px solid #3b82f6; border-radius: 14px; padding: 20px; box-shadow: 0 10px 15px -3px rgba(59, 130, 246, 0.1);"></div>

            <!-- Sektion 2: Tabellenübersicht der Werkzeuge -->
            <div>
                <h4 style="font-size: 1rem; color: #1e293b; margin-bottom: 10px; font-weight: 700;">📋 Vorhandene Werkzeuge (${db.tools.length})</h4>
                <div style="max-height: 250px; overflow-y: auto; background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.02);">
                    <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">
                        <thead>
                            <tr style="background: #f8fafc; text-align: left; position: sticky; top: 0; z-index: 1; color: #475569; border-bottom: 2px solid #e2e8f0;">
                                <th style="padding: 10px 12px;">Name</th>
                                <th style="padding: 10px 12px;">D</th>
                                <th style="padding: 10px 12px;">Z</th>
                                <th style="padding: 10px 12px;">L</th>
                                <th style="padding: 10px 12px; text-align: right;">Schnittwerte (vc)</th>
                                <th style="padding: 10px 12px; width: 70px; text-align: right;">Aktion</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${db.tools.length === 0 ? '<tr><td colspan="6" style="padding: 24px; text-align: center; color: #94a3b8; font-style: italic;">Keine Werkzeuge vorhanden</td></tr>' : ''}
                            ${db.tools.map(t => `
                                <tr style="border-bottom: 1px solid #f1f5f9; transition: background 0.15s;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='#fff'">
                                    <td style="padding: 10px 12px; font-weight: 600; color: #0f172a;">${t.name}</td>
                                    <td style="padding: 10px 12px; color: #475569;">${t.d} mm</td>
                                    <td style="padding: 10px 12px; color: #475569;">${t.z}</td>
                                    <td style="padding: 10px 12px; color: #475569;">${t.l} mm</td>
                                    <td style="padding: 10px 12px; text-align: right;">
                                        <button class="edit-vc-btn" data-id="${t.id}" style="background: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe; padding: 5px 10px; border-radius: 6px; cursor: pointer; font-size: 0.75rem; font-weight: 700; transition: all 0.2s;" onmouseover="this.style.background='#dbeafe'" onmouseout="this.style.background='#eff6ff'">vc-Werte verwalten</button>
                                    </td>
                                    <td style="padding: 10px 12px; text-align: right;">
                                        <button class="delete-tool-btn" data-id="${t.id}" style="background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; padding: 5px 10px; border-radius: 6px; cursor: pointer; font-size: 0.75rem; font-weight: 600;" onmouseover="this.style.background='#fee2e2'" onmouseout="this.style.background='#fef2f2'">Löschen</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    // Event Handler
    contentArea.querySelector('#addSingleToolForm').onsubmit = (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        db.tools.push({
            id: 'tool_' + Date.now(),
            name: fd.get('name'),
            d: parseFloat(fd.get('d')),
            z: parseInt(fd.get('z')),
            l: parseFloat(fd.get('l')),
            materialVc: {}
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

function showVcEditor(contentArea, tool, db, container, onUpdateCallback) {
    const editorDiv = contentArea.querySelector('#vcEditorContainer');
    editorDiv.style.display = 'block';

    if (!tool.materialVc) tool.materialVc = {};

    editorDiv.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <h4 style="margin: 0; font-size: 1rem; color: #1e40af; font-weight: 700;">⚙️ Schnittgeschwindigkeiten (vc) für: <b>${tool.name}</b></h4>
            <button id="closeVcEditor" style="background: none; border: none; cursor: pointer; font-size: 1.2rem; color: #1e40af; font-weight: bold;">✕</button>
        </div>
        <p style="font-size: 0.8rem; color: #64748b; margin-top: 0; margin-bottom: 14px;">Definieren Sie individuelle vc-Werte pro Werkstoff. Ohne Angabe greift der Werkstoff-Standardwert.</p>
        
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px; margin-bottom: 16px; max-height: 200px; overflow-y: auto; padding: 2px;">
            ${db.materials.length === 0 ? '<div style="font-size: 0.85rem; color: #64748b; font-style: italic;">Keine Werkstoffe definiert. Bitte zuerst Werkstoffe im Tab "Werkstoffe" anlegen.</div>' : ''}
            ${db.materials.map(mat => {
                const currentVal = tool.materialVc[mat.id] !== undefined ? tool.materialVc[mat.id] : '';
                return `
                    <div style="background: #fff; padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 10px; font-size: 0.85rem; box-shadow: 0 1px 2px rgba(0,0,0,0.02);">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                            <span style="font-weight: 700; color: #1e293b;">${mat.name}</span>
                            ${getIsoBadge(mat.isoGroup)}
                        </div>
                        <div style="font-size: 0.75rem; color: #64748b; margin-bottom: 6px;">Standard: ${mat.vc} m/min</div>
                        <div style="display: flex; align-items: center; gap: 6px;">
                            <input type="number" class="vc-input" data-matid="${mat.id}" value="${currentVal}" placeholder="${mat.vc}" style="width: 100%; padding: 6px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.85rem; box-sizing: border-box; background: #f8fafc;">
                            <span style="font-size: 0.75rem; color: #64748b; font-weight: 600;">m/min</span>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
        <button id="saveVcEditorBtn" style="background: #2563eb; color: #fff; border: none; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-size: 0.85rem; font-weight: 700; box-shadow: 0 2px 4px rgba(37, 99, 235, 0.2);">vc-Werte speichern</button>
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
        alert(`Schnittwerte für ${tool.name} erfolgreich aktualisiert!`);
    };
}

// --- TAB: MACHINES ---
function renderMachinesTab(contentArea, db, container, onUpdateCallback) {
    contentArea.innerHTML = `
        <div style="display: grid; gap: 20px;">
            <div style="background: #f8fafc; padding: 20px; border-radius: 14px; border: 1px solid #e2e8f0;">
                <h4 style="font-size: 1rem; color: #1e293b; margin-top:0; margin-bottom: 14px; font-weight: 700;">➕ Neue Maschine hinzufügen</h4>
                <form id="addMachineForm" style="display: grid; grid-template-columns: 2fr 1fr 1fr 1fr auto; gap: 12px; align-items: end;">
                    <div>
                        <label style="display:block; font-size: 0.75rem; color: #64748b; font-weight: 600; margin-bottom: 4px;">Maschinenname</label>
                        <input type="text" name="name" placeholder="z.B. DMG Mori 3-Achs" required style="width: 100%; padding: 8px 10px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.85rem; box-sizing: border-box; background: #fff;">
                    </div>
                    <div>
                        <label style="display:block; font-size: 0.75rem; color: #64748b; font-weight: 600; margin-bottom: 4px;">Max U/min</label>
                        <input type="number" name="maxRpm" placeholder="U/min" required style="width: 100%; padding: 8px 10px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.85rem; box-sizing: border-box; background: #fff;">
                    </div>
                    <div>
                        <label style="display:block; font-size: 0.75rem; color: #64748b; font-weight: 600; margin-bottom: 4px;">Max Vorschub</label>
                        <input type="number" name="maxFeed" placeholder="mm/min" required style="width: 100%; padding: 8px 10px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.85rem; box-sizing: border-box; background: #fff;">
                    </div>
                    <div>
                        <label style="display:block; font-size: 0.75rem; color: #64748b; font-weight: 600; margin-bottom: 4px;">Leistung</label>
                        <input type="number" name="powerKw" placeholder="kW" step="0.1" required style="width: 100%; padding: 8px 10px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.85rem; box-sizing: border-box; background: #fff;">
                    </div>
                    <button type="submit" style="background: #10b981; color: #fff; border: none; padding: 9px 16px; border-radius: 8px; cursor: pointer; font-weight: 700; font-size: 0.85rem; height: 38px; box-shadow: 0 2px 4px rgba(16, 185, 129, 0.2);">Hinzufügen</button>
                </form>
            </div>

            <div>
                <h4 style="font-size: 1rem; color: #1e293b; margin-bottom: 10px; font-weight: 700;">📋 Vorhandene Maschinen (${db.machines.length})</h4>
                <div style="max-height: 250px; overflow-y: auto; background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.02);">
                    <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">
                        <thead>
                            <tr style="background: #f8fafc; text-align: left; position: sticky; top: 0; color: #475569; border-bottom: 2px solid #e2e8f0;">
                                <th style="padding: 10px 12px;">Name</th>
                                <th style="padding: 10px 12px;">Max U/min</th>
                                <th style="padding: 10px 12px;">Max Vorschub</th>
                                <th style="padding: 10px 12px;">Leistung</th>
                                <th style="padding: 10px 12px; width: 70px; text-align: right;">Aktion</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${db.machines.length === 0 ? '<tr><td colspan="5" style="padding: 24px; text-align: center; color: #94a3b8; font-style: italic;">Keine Maschinen vorhanden</td></tr>' : ''}
                            ${db.machines.map(m => `
                                <tr style="border-bottom: 1px solid #f1f5f9;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='#fff'">
                                    <td style="padding: 10px 12px; font-weight: 600; color: #0f172a;">${m.name}</td>
                                    <td style="padding: 10px 12px; color: #475569;">${m.maxRpm} U/min</td>
                                    <td style="padding: 10px 12px; color: #475569;">${m.maxFeed} mm/min</td>
                                    <td style="padding: 10px 12px; color: #475569;">${m.powerKw} kW</td>
                                    <td style="padding: 10px 12px; text-align: right;">
                                        <button class="delete-machine-btn" data-id="${m.id}" style="background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; padding: 5px 10px; border-radius: 6px; cursor: pointer; font-size: 0.75rem; font-weight: 600;">Löschen</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
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
        <div style="display: grid; gap: 20px;">
            <div style="background: #f8fafc; padding: 20px; border-radius: 14px; border: 1px solid #e2e8f0;">
                <h4 style="font-size: 1rem; color: #1e293b; margin-top:0; margin-bottom: 14px; font-weight: 700;">➕ Neuen Werkstoff hinzufügen</h4>
                <form id="addMaterialForm" style="display: grid; grid-template-columns: 2fr 1fr 1fr auto; gap: 12px; align-items: end;">
                    <div>
                        <label style="display:block; font-size: 0.75rem; color: #64748b; font-weight: 600; margin-bottom: 4px;">Werkstoffname</label>
                        <input type="text" name="name" placeholder="z.B. 42CrMo4" required style="width: 100%; padding: 8px 10px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.85rem; box-sizing: border-box; background: #fff;">
                    </div>
                    <div>
                        <label style="display:block; font-size: 0.75rem; color: #64748b; font-weight: 600; margin-bottom: 4px;">ISO-Gruppe</label>
                        <input type="text" name="isoGroup" placeholder="z.B. P, M, K, N" required style="width: 100%; padding: 8px 10px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.85rem; box-sizing: border-box; background: #fff;">
                    </div>
                    <div>
                        <label style="display:block; font-size: 0.75rem; color: #64748b; font-weight: 600; margin-bottom: 4px;">Standard-vc</label>
                        <input type="number" name="vc" placeholder="m/min" required style="width: 100%; padding: 8px 10px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.85rem; box-sizing: border-box; background: #fff;">
                    </div>
                    <button type="submit" style="background: #10b981; color: #fff; border: none; padding: 9px 16px; border-radius: 8px; cursor: pointer; font-weight: 700; font-size: 0.85rem; height: 38px; box-shadow: 0 2px 4px rgba(16, 185, 129, 0.2);">Hinzufügen</button>
                </form>
            </div>

            <div>
                <h4 style="font-size: 1rem; color: #1e293b; margin-bottom: 10px; font-weight: 700;">📋 Vorhandene Werkstoffe (${db.materials.length})</h4>
                <div style="max-height: 250px; overflow-y: auto; background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.02);">
                    <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">
                        <thead>
                            <tr style="background: #f8fafc; text-align: left; position: sticky; top: 0; color: #475569; border-bottom: 2px solid #e2e8f0;">
                                <th style="padding: 10px 12px;">Name</th>
                                <th style="padding: 10px 12px;">ISO-Gruppe</th>
                                <th style="padding: 10px 12px;">Standard-vc</th>
                                <th style="padding: 10px 12px; width: 70px; text-align: right;">Aktion</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${db.materials.length === 0 ? '<tr><td colspan="4" style="padding: 24px; text-align: center; color: #94a3b8; font-style: italic;">Keine Werkstoffe vorhanden</td></tr>' : ''}
                            ${db.materials.map(mat => `
                                <tr style="border-bottom: 1px solid #f1f5f9;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='#fff'">
                                    <td style="padding: 10px 12px; font-weight: 600; color: #0f172a;">${mat.name}</td>
                                    <td style="padding: 10px 12px;">${getIsoBadge(mat.isoGroup)}</td>
                                    <td style="padding: 10px 12px; color: #475569; font-weight: 600;">${mat.vc} m/min</td>
                                    <td style="padding: 10px 12px; text-align: right;">
                                        <button class="delete-material-btn" data-id="${mat.id}" style="background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; padding: 5px 10px; border-radius: 6px; cursor: pointer; font-size: 0.75rem; font-weight: 600;">Löschen</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
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
        <div style="display: grid; gap: 20px;">
            <div style="background: #f8fafc; padding: 20px; border-radius: 14px; border: 1px solid #e2e8f0;">
                <h4 style="font-size: 1rem; color: #1e293b; margin-top:0; margin-bottom: 14px; font-weight: 700;">➕ Neues Profil hinzufügen</h4>
                <form id="addProfileForm" style="display: grid; grid-template-columns: 2fr 1fr 1fr 1fr auto; gap: 12px; align-items: end;">
                    <div>
                        <label style="display:block; font-size: 0.75rem; color: #64748b; font-weight: 600; margin-bottom: 4px;">Profilname</label>
                        <input type="text" name="name" placeholder="z.B. Schruppen HPC" required style="width: 100%; padding: 8px 10px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.85rem; box-sizing: border-box; background: #fff;">
                    </div>
                    <div>
                        <label style="display:block; font-size: 0.75rem; color: #64748b; font-weight: 600; margin-bottom: 4px;">a_e Wert</label>
                        <input type="number" name="aeValue" placeholder="Wert" step="0.1" required style="width: 100%; padding: 8px 10px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.85rem; box-sizing: border-box; background: #fff;">
                    </div>
                    <div>
                        <label style="display:block; font-size: 0.75rem; color: #64748b; font-weight: 600; margin-bottom: 4px;">Einheit</label>
                        <select name="aeType" style="width: 100%; padding: 8px 10px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.85rem; box-sizing: border-box; background: #fff;">
                            <option value="percent">% vom D</option>
                            <option value="mm">mm</option>
                        </select>
                    </div>
                    <div>
                        <label style="display:block; font-size: 0.75rem; color: #64748b; font-weight: 600; margin-bottom: 4px;">Zahnvorschub f_z</label>
                        <input type="number" name="fz" placeholder="mm" step="0.01" required style="width: 100%; padding: 8px 10px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.85rem; box-sizing: border-box; background: #fff;">
                    </div>
                    <button type="submit" style="background: #10b981; color: #fff; border: none; padding: 9px 16px; border-radius: 8px; cursor: pointer; font-weight: 700; font-size: 0.85rem; height: 38px; box-shadow: 0 2px 4px rgba(16, 185, 129, 0.2);">Hinzufügen</button>
                </form>
            </div>

            <div>
                <h4 style="font-size: 1rem; color: #1e293b; margin-bottom: 10px; font-weight: 700;">📋 Vorhandene Profile (${db.profiles.length})</h4>
                <div style="max-height: 250px; overflow-y: auto; background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.02);">
                    <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">
                        <thead>
                            <tr style="background: #f8fafc; text-align: left; position: sticky; top: 0; color: #475569; border-bottom: 2px solid #e2e8f0;">
                                <th style="padding: 10px 12px;">Name</th>
                                <th style="padding: 10px 12px;">a_e</th>
                                <th style="padding: 10px 12px;">f_z</th>
                                <th style="padding: 10px 12px; width: 70px; text-align: right;">Aktion</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${db.profiles.length === 0 ? '<tr><td colspan="4" style="padding: 24px; text-align: center; color: #94a3b8; font-style: italic;">Keine Profile vorhanden</td></tr>' : ''}
                            ${db.profiles.map(p => `
                                <tr style="border-bottom: 1px solid #f1f5f9;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='#fff'">
                                    <td style="padding: 10px 12px; font-weight: 600; color: #0f172a;">${p.name}</td>
                                    <td style="padding: 10px 12px; color: #475569;">${p.aeValue}${p.aeType === 'percent' ? '% vom D' : ' mm'}</td>
                                    <td style="padding: 10px 12px; color: #475569; font-weight: 600;">${p.fz} mm</td>
                                    <td style="padding: 10px 12px; text-align: right;">
                                        <button class="delete-profile-btn" data-id="${p.id}" style="background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; padding: 5px 10px; border-radius: 6px; cursor: pointer; font-size: 0.75rem; font-weight: 600;">Löschen</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
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
            <td style="padding: 6px; border-bottom: 1px solid #a7f3d0;"><input type="text" value="${row.name}" data-index="${index}" data-field="name" style="width: 100%; border: none; background: transparent; font-size: 0.85rem; font-weight: 500;"></td>
            <td style="padding: 6px; border-bottom: 1px solid #a7f3d0;"><input type="number" value="${row.d}" data-index="${index}" data-field="d" style="width: 100%; border: none; background: transparent; font-size: 0.85rem;"></td>
            <td style="padding: 6px; border-bottom: 1px solid #a7f3d0;"><input type="number" value="${row.z}" data-index="${index}" data-field="z" style="width: 100%; border: none; background: transparent; font-size: 0.85rem;"></td>
            <td style="padding: 6px; border-bottom: 1px solid #a7f3d0;"><input type="number" value="${row.l}" data-index="${index}" data-field="l" style="width: 100%; border: none; background: transparent; font-size: 0.85rem;"></td>
            <td style="padding: 6px; border-bottom: 1px solid #a7f3d0; text-align: center;"><button class="remove-row-btn" data-index="${index}" style="background: #ef4444; color: #fff; border: none; border-radius: 4px; cursor: pointer; padding: 2px 6px; font-size: 0.75rem;">✕</button></td>
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
