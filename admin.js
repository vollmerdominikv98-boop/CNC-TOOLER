// admin.js
import { getData, saveData } from './storage.js';

export function initAdmin(onUpdateCallback) {
    setupAdminToggle(onUpdateCallback);
}

function setupAdminToggle(onUpdateCallback) {
    // Verschiedene mögliche IDs für den Admin-Button im Header abfangen
    const adminBtn = document.getElementById('adminBtn') || document.querySelector('button'); 
    // Falls kein spezifischer Button gefunden wird, suchen wir nach einem Button mit "Admin" im Text
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
        // Wenn es bereits da ist, umschalten (Ein/Aus)
        adminContainer.style.display = adminContainer.style.display === 'none' ? 'block' : 'none';
    } else {
        // Erstellen im exakten Look der Haupt-Card
        const mainCard = document.querySelector('.card, [style*="border"]') || document.body.children[0];
        
        adminContainer = document.createElement('div');
        adminContainer.id = 'adminContainer';
        // Exaktes Styling angepasst an den Haupt-Look der App
        adminContainer.style.cssText = 'max-width: 700px; margin: 20px auto; padding: 25px; background: #ffffff; border: 1px solid #d1d5db; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); font-family: inherit;';
        
        // Versuchen, es unterhalb des Haupt-Steppers einzufügen
        const stepArea = document.getElementById('stepContentArea') || mainCard;
        stepArea.parentNode.insertBefore(adminContainer, stepArea.nextSibling);

        renderAdminUI(adminContainer, onUpdateCallback);
    }
}

function renderAdminUI(container, onUpdateCallback) {
    const db = getData();

    container.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
            <h3 style="margin: 0; color: #1f2937;">Werkzeug-Verwaltung & Import</h3>
            <button id="closeAdminBtn" style="background: none; border: none; font-size: 1.2em; cursor: pointer; color: #6b7280;">✕</button>
        </div>
        <p style="font-size: 0.9em; color: #4b5563; margin-bottom: 20px;">Importieren Sie Werkzeugdaten per Excel-/CSV-Datei oder fügen Sie Rohdaten als Text ein. In der Vorschau können Sie alle Werte vor dem Speichern anpassen.</p>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
            <div style="background: #f9fafb; padding: 15px; border: 1px solid #e5e7eb; border-radius: 8px;">
                <h4 style="margin-top: 0; font-size: 0.95em; color: #374151;">1a. Excel- oder CSV-Datei</h4>
                <input type="file" id="excelUploadInput" accept=".xlsx, .xls, .csv" style="margin-bottom: 8px; width: 100%; font-size: 0.85em;">
                <div style="font-size: 0.75em; color: #6b7280;">Unterstützt .xlsx, .xls und .csv mit Kopfzeile.</div>
            </div>
            
            <div style="background: #f9fafb; padding: 15px; border: 1px solid #e5e7eb; border-radius: 8px;">
                <h4 style="margin-top: 0; font-size: 0.95em; color: #374151;">1b. Rohdaten einfügen (Smart Paste)</h4>
                <textarea id="bulkDataInput" placeholder="Name | D | Z | L&#10;Fräser 10 | 10 | 4 | 30" style="width: 100%; height: 60px; padding: 6px; font-family: monospace; font-size: 0.8em; box-sizing: border-box; border: 1px solid #d1d5db; border-radius: 4px;"></textarea>
                <button id="parseBulkBtn" style="margin-top: 6px; padding: 6px 10px; background: #3b82f6; color: #fff; border: none; border-radius: 4px; cursor: pointer; font-size: 0.85em;">Analysieren & Vorschau</button>
            </div>
        </div>

        <div id="stagingArea" style="display: none; background: #f0fdf4; padding: 15px; border: 1px solid #22c55e; border-radius: 8px; margin-bottom: 20px;">
            <h4 style="color: #15803d; margin-top: 0; font-size: 0.95em;">2. Import-Vorschau & Korrektur</h4>
            <p style="font-size: 0.8em; color: #166534;">Prüfen Sie die Werte. Sie können direkt in die Felder klicken, um Korrekturen vorzunehmen.</p>
            <div style="max-height: 200px; overflow-y: auto; margin-bottom: 10px; background: #fff; border: 1px solid #d1d5db; border-radius: 4px;">
                <table style="width: 100%; border-collapse: collapse; font-size: 0.85em;">
                    <thead>
                        <tr style="background: #f3f4f6; text-align: left;">
                            <th style="padding: 6px; border-bottom: 1px solid #d1d5db;">Name</th>
                            <th style="padding: 6px; border-bottom: 1px solid #d1d5db;">D (mm)</th>
                            <th style="padding: 6px; border-bottom: 1px solid #d1d5db;">Z</th>
                            <th style="padding: 6px; border-bottom: 1px solid #d1d5db;">L (mm)</th>
                            <th style="padding: 6px; border-bottom: 1px solid #d1d5db; width: 40px;"></th>
                        </tr>
                    </thead>
                    <tbody id="stagingTbody"></tbody>
                </table>
            </div>
            <button id="confirmImportBtn" style="padding: 6px 12px; background: #22c55e; color: #fff; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 0.85em;">Verbindlich speichern</button>
            <button id="cancelImportBtn" style="padding: 6px 12px; background: #ef4444; color: #fff; border: none; border-radius: 4px; cursor: pointer; margin-left: 8px; font-size: 0.85em;">Verwerfen</button>
        </div>

        <h4 style="font-size: 0.95em; color: #374151; margin-bottom: 8px;">Vorhandene Werkzeuge (${db.tools.length})</h4>
        <div style="max-height: 180px; overflow-y: auto; background: #fff; border: 1px solid #e5e7eb; border-radius: 6px;">
            <table style="width: 100%; border-collapse: collapse; font-size: 0.85em;">
                <thead>
                    <tr style="background: #f9fafb; text-align: left;">
                        <th style="padding: 6px; border-bottom: 1px solid #e5e7eb;">Name</th>
                        <th style="padding: 6px; border-bottom: 1px solid #e5e7eb;">D</th>
                        <th style="padding: 6px; border-bottom: 1px solid #e5e7eb;">Z</th>
                        <th style="padding: 6px; border-bottom: 1px solid #e5e7eb; width: 60px;"></th>
                    </tr>
                </thead>
                <tbody>
                    ${db.tools.length === 0 ? '<tr><td colspan="4" style="padding: 10px; text-align: center; color: #6b7280;">Keine Werkzeuge vorhanden</td></tr>' : ''}
                    ${db.tools.map(t => `
                        <tr>
                            <td style="padding: 6px; border-bottom: 1px solid #f3f4f6;">${t.name}</td>
                            <td style="padding: 6px; border-bottom: 1px solid #f3f4f6;">${t.d}</td>
                            <td style="padding: 6px; border-bottom: 1px solid #f3f4f6;">${t.z}</td>
                            <td style="padding: 6px; border-bottom: 1px solid #f3f4f6; text-align: right;">
                                <button class="delete-tool-btn" data-id="${t.id}" style="background: #ef4444; color: #fff; border: none; padding: 2px 6px; border-radius: 3px; cursor: pointer; font-size: 0.8em;">Löschen</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;

    document.getElementById('closeAdminBtn').onclick = () => {
        container.style.display = 'none';
    };

    document.getElementById('parseBulkBtn').onclick = () => {
        const rawText = document.getElementById('bulkDataInput').value;
        const parsedRows = parseTextData(rawText);
        showStagingArea(container, parsedRows, onUpdateCallback);
    };

    const fileInput = document.getElementById('excelUploadInput');
    fileInput.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        const fileName = file.name.toLowerCase();

        if (fileName.endsWith('.csv') || fileName.endsWith('.txt')) {
            reader.onload = (event) => {
                const parsedRows = parseTextData(event.target.result);
                showStagingArea(container, parsedRows, onUpdateCallback);
            };
            reader.readAsText(file);
        } else {
            reader.onload = (event) => {
                try {
                    if (window.XLSX) {
                        const data = new Uint8Array(event.target.result);
                        const workbook = window.XLSX.read(data, { type: 'array' });
                        const firstSheetName = workbook.SheetNames[0];
                        const worksheet = workbook.Sheets[firstSheetName];
                        const json = window.XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                        
                        const parsedRows = parseArrayData(json);
                        showStagingArea(container, parsedRows, onUpdateCallback);
                    } else {
                        alert("Für direkte .xlsx-Dateien wird die SheetJS-Bibliothek benötigt. Bitte speichern Sie die Datei als CSV.");
                    }
                } catch (err) {
                    alert("Fehler beim Lesen der Excel-Datei: " + err.message);
                }
            };
            reader.readAsArrayBuffer(file);
        }
    };

    container.querySelectorAll('.delete-tool-btn').forEach(btn => {
        btn.onclick = () => {
            const id = btn.dataset.id;
            db.tools = db.tools.filter(t => t.id !== id);
            saveData(db);
            renderAdminUI(container, onUpdateCallback);
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
            <td style="padding: 4px; border-bottom: 1px solid #e5e7eb;"><input type="text" value="${row.name}" data-index="${index}" data-field="name" style="width: 100%; border: none; background: transparent; font-size: 0.85em;"></td>
            <td style="padding: 4px; border-bottom: 1px solid #e5e7eb;"><input type="number" value="${row.d}" data-index="${index}" data-field="d" style="width: 100%; border: none; background: transparent; font-size: 0.85em;"></td>
            <td style="padding: 4px; border-bottom: 1px solid #e5e7eb;"><input type="number" value="${row.z}" data-index="${index}" data-field="z" style="width: 100%; border: none; background: transparent; font-size: 0.85em;"></td>
            <td style="padding: 4px; border-bottom: 1px solid #e5e7eb;"><input type="number" value="${row.l}" data-index="${index}" data-field="l" style="width: 100%; border: none; background: transparent; font-size: 0.85em;"></td>
            <td style="padding: 4px; border-bottom: 1px solid #e5e7eb; text-align: center;"><button class="remove-row-btn" data-index="${index}" style="background: #ef4444; color: #fff; border: none; border-radius: 3px; cursor: pointer; padding: 2px 5px; font-size: 0.75em;">✕</button></td>
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
                l: item.l
            });
        });
        saveData(db);
        stagingArea.style.display = 'none';
        renderAdminUI(container, onUpdateCallback);
        if (onUpdateCallback) onUpdateCallback();
        alert(`${stagingData.length} Werkzeuge erfolgreich importiert!`);
    };

    container.querySelector('#cancelImportBtn').onclick = () => {
        stagingArea.style.display = 'none';
    };
}
