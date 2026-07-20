// admin.js
import { getData, saveData } from './storage.js';

export function initAdmin(onUpdateCallback) {
    const adminContainer = document.getElementById('adminContainer') || createAdminContainer();
    renderAdminUI(adminContainer, onUpdateCallback);
}

function createAdminContainer() {
    const container = document.createElement('div');
    container.id = 'adminContainer';
    container.style.cssText = 'margin-top: 30px; padding: 20px; border: 1px solid #ccc; border-radius: 8px; background: #f9f9f9;';
    document.body.appendChild(container);
    return container;
}

function renderAdminUI(container, onUpdateCallback) {
    const db = getData();

    container.innerHTML = `
        <h3 style="margin-top:0;">Werkzeug-Verwaltung & Import</h3>
        <p style="font-size: 0.9em; color: #555;">Importieren Sie Werkzeugdaten bequem per Excel-/CSV-Datei oder fügen Sie Rohdaten per Text ein. In der Vorschau können Sie alle Werte vor dem Speichern anpassen.</p>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
            <div style="background: #fff; padding: 15px; border: 1px solid #ddd; border-radius: 6px;">
                <h4>1a. Excel- oder CSV-Datei hochladen</h4>
                <input type="file" id="excelUploadInput" accept=".xlsx, .xls, .csv" style="margin-bottom: 10px; width: 100%;">
                <div style="font-size: 0.8em; color: #666;">Unterstützt Excel-Tabellen (.xlsx/.xls) und CSV-Dateien mit Kopfzeile.</div>
            </div>
            
            <div style="background: #fff; padding: 15px; border: 1px solid #ddd; border-radius: 6px;">
                <h4>1b. Rohdaten einfügen (Smart Paste)</h4>
                <textarea id="bulkDataInput" placeholder="Name | Durchmesser (D) | Zähnezahl (Z) | Auskragung (L)\nFräser 10mm | 10 | 4 | 30" style="width: 100%; height: 80px; padding: 8px; font-family: monospace; font-size: 0.85em; box-sizing: border-box;"></textarea>
                <button id="parseBulkBtn" style="margin-top: 8px; padding: 6px 12px; background: #3498db; color: #fff; border: none; border-radius: 4px; cursor: pointer;">Daten analysieren & Vorschau</button>
            </div>
        </div>

        <div id="stagingArea" style="display: none; background: #fff; padding: 15px; border: 1px solid #2ecc71; border-radius: 6px; margin-bottom: 20px;">
            <h4 style="color: #2ecc71; margin-top: 0;">2. Import-Vorschau & Korrektur</h4>
            <p style="font-size: 0.85em;">Prüfen Sie die Daten. Sie können Werte in der Tabelle direkt anklicken und korrigieren, bevor Sie den Import abschließen.</p>
            <div style="max-height: 250px; overflow-y: auto; margin-bottom: 10px;">
                <table id="stagingTable" style="width: 100%; border-collapse: collapse; font-size: 0.9em;">
                    <thead>
                        <tr style="background: #eee; text-align: left;">
                            <th style="padding: 6px; border: 1px solid #ddd;">Name</th>
                            <th style="padding: 6px; border: 1px solid #ddd;">Durchmesser D (mm)</th>
                            <th style="padding: 6px; border: 1px solid #ddd;">Zähnezahl Z</th>
                            <th style="padding: 6px; border: 1px solid #ddd;">Auskragung L (mm)</th>
                            <th style="padding: 6px; border: 1px solid #ddd; width: 50px;">Aktion</th>
                        </tr>
                    </thead>
                    <tbody id="stagingTbody"></tbody>
                </table>
            </div>
            <button id="confirmImportBtn" style="padding: 8px 16px; background: #2ecc71; color: #fff; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">Daten verbindlich speichern</button>
            <button id="cancelImportBtn" style="padding: 8px 16px; background: #e74c3c; color: #fff; border: none; border-radius: 4px; cursor: pointer; margin-left: 10px;">Verwerfen</button>
        </div>

        <h4>Vorhandene Werkzeuge (${db.tools.length})</h4>
        <div style="max-height: 200px; overflow-y: auto; background: #fff; border: 1px solid #ddd; border-radius: 6px;">
            <table style="width: 100%; border-collapse: collapse; font-size: 0.9em;">
                <thead>
                    <tr style="background: #f1f1f1; text-align: left;">
                        <th style="padding: 8px; border-bottom: 1px solid #ddd;">Name</th>
                        <th style="padding: 8px; border-bottom: 1px solid #ddd;">D (mm)</th>
                        <th style="padding: 8px; border-bottom: 1px solid #ddd;">Z</th>
                        <th style="padding: 8px; border-bottom: 1px solid #ddd;">Aktion</th>
                    </tr>
                </thead>
                <tbody>
                    ${db.tools.map(t => `
                        <tr>
                            <td style="padding: 8px; border-bottom: 1px solid #eee;">${t.name}</td>
                            <td style="padding: 8px; border-bottom: 1px solid #eee;">${t.d}</td>
                            <td style="padding: 8px; border-bottom: 1px solid #eee;">${t.z}</td>
                            <td style="padding: 8px; border-bottom: 1px solid #eee;">
                                <button class="delete-tool-btn" data-id="${t.id}" style="background: #e74c3c; color: #fff; border: none; padding: 4px 8px; border-radius: 3px; cursor: pointer;">Löschen</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;

    document.getElementById('parseBulkBtn').onclick = () => {
        const rawText = document.getElementById('bulkDataInput').value;
        const parsedRows = parseTextData(rawText);
        showStagingArea(parsedRows, onUpdateCallback);
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
                showStagingArea(parsedRows, onUpdateCallback);
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
                        showStagingArea(parsedRows, onUpdateCallback);
                    } else {
                        alert("Für direkte .xlsx-Dateien wird die SheetJS-Bibliothek benötigt. Bitte speichern Sie die Datei als CSV oder nutzen Sie das Text-Einfügen.");
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

function showStagingArea(rows, onUpdateCallback) {
    const stagingArea = document.getElementById('stagingArea');
    const tbody = document.getElementById('stagingTbody');
    
    if (rows.length === 0) {
        alert("Es konnten keine gültigen Werkzeugdaten erkannt werden. Bitte prüfen Sie das Format.");
        return;
    }

    stagingArea.style.display = 'block';
    tbody.innerHTML = '';

    rows.forEach((row, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="padding: 4px; border: 1px solid #ddd;"><input type="text" value="${row.name}" data-index="${index}" data-field="name" style="width: 100%; border: none; background: transparent;"></td>
            <td style="padding: 4px; border: 1px solid #ddd;"><input type="number" value="${row.d}" data-index="${index}" data-field="d" style="width: 100%; border: none; background: transparent;"></td>
            <td style="padding: 4px; border: 1px solid #ddd;"><input type="number" value="${row.z}" data-index="${index}" data-field="z" style="width: 100%; border: none; background: transparent;"></td>
            <td style="padding: 4px; border: 1px solid #ddd;"><input type="number" value="${row.l}" data-index="${index}" data-field="l" style="width: 100%; border: none; background: transparent;"></td>
            <td style="padding: 4px; border: 1px solid #ddd; text-align: center;"><button class="remove-row-btn" data-index="${index}" style="background: #e74c3c; color: #fff; border: none; border-radius: 3px; cursor: pointer; padding: 2px 6px;">X</button></td>
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
            showStagingArea(stagingData, onUpdateCallback);
        };
    });

    document.getElementById('confirmImportBtn').onclick = () => {
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
        renderAdminUI(document.getElementById('adminContainer'), onUpdateCallback);
        if (onUpdateCallback) onUpdateCallback();
        alert(`${stagingData.length} Werkzeuge erfolgreich importiert!`);
    };

    document.getElementById('cancelImportBtn').onclick = () => {
        stagingArea.style.display = 'none';
    };
}
