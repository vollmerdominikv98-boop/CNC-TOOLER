// app.js
import { getData, saveData } from './storage.js';
import { initAdmin } from './admin.js';

document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

export function initApp() {
    const appContainer = document.getElementById('app') || document.body;
    
    appContainer.innerHTML = `
        <div style="max-width: 980px; margin: 30px auto; padding: 28px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 20px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.02); font-family: system-ui, -apple-system, sans-serif;">
            
            <!-- Header -->
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; border-bottom: 2px solid #f1f5f9; padding-bottom: 16px;">
                <div>
                    <h2 style="margin: 0; color: #0f172a; font-size: 1.5rem; font-weight: 800; letter-spacing: -0.02em;">Shopfloor Schnittwertrechner</h2>
                    <p style="margin: 6px 0 0 0; color: #64748b; font-size: 0.9rem;">Präzise Berechnung von Drehzahl, Vorschub und Schnittparametern</p>
                </div>
                <button id="openAdminBtn" style="background: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe; padding: 8px 16px; border-radius: 10px; cursor: pointer; font-weight: 700; font-size: 0.85rem; box-shadow: 0 2px 4px rgba(37, 99, 235, 0.1); transition: all 0.2s;" onmouseover="this.style.background='#dbeafe'" onmouseout="this.style.background='#eff6ff'">⚙️ Admin & Stammdaten</button>
            </div>

            <div id="stepContentArea"></div>
        </div>
    `;

    initAdmin(() => {
        renderMainCalculator();
    });

    renderMainCalculator();
}

function getIsoBadge(iso) {
    const group = (iso || '').toUpperCase().trim();
    let bg = '#f1f5f9', color = '#475569', border = '#cbd5e1';
    
    if (group.includes('P')) { bg = '#eff6ff'; color = '#1d4ed8'; border = '#bfdbfe'; }
    else if (group.includes('M')) { bg = '#fffbeb'; color = '#b45309'; border = '#fde68a'; }
    else if (group.includes('K')) { bg = '#fef2f2'; color = '#b91c1c'; border = '#fecaca'; }
    else if (group.includes('N')) { bg = '#ecfdf5'; color = '#047857'; border = '#a7f3d0'; }
    else if (group.includes('S')) { bg = '#f8fafc'; color = '#334155'; border = '#cbd5e1'; }
    else if (group.includes('H')) { bg = '#f5f3ff'; color = '#6d28d9'; border = '#ddd6fe'; }

    return `<span style="background: ${bg}; color: ${color}; border: 1px solid ${border}; padding: 2px 8px; border-radius: 6px; font-weight: 700; font-size: 0.75rem;">ISO ${group || '—'}</span>`;
}

function renderMainCalculator() {
    const db = getData();
    const area = document.getElementById('stepContentArea');
    if (!area) return;

    area.innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px;">
            <!-- Auswahl: Maschine -->
            <div style="background: #f8fafc; padding: 18px; border-radius: 14px; border: 1px solid #e2e8f0;">
                <label style="display: block; font-size: 0.8rem; color: #475569; font-weight: 700; margin-bottom: 8px;">1. Maschine wählen</label>
                <select id="selectMachine" style="width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.9rem; background: #fff; font-weight: 500; color: #0f172a;">
                    <option value="">-- Bitte Maschine wählen --</option>
                    ${db.machines.map(m => `<option value="${m.id}">${m.name} (max. ${m.maxRpm} U/min)</option>`).join('')}
                </select>
            </div>

            <!-- Auswahl: Werkstoff -->
            <div style="background: #f8fafc; padding: 18px; border-radius: 14px; border: 1px solid #e2e8f0;">
                <label style="display: block; font-size: 0.8rem; color: #475569; font-weight: 700; margin-bottom: 8px;">2. Werkstoff wählen</label>
                <select id="selectMaterial" style="width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.9rem; background: #fff; font-weight: 500; color: #0f172a;">
                    <option value="">-- Bitte Werkstoff wählen --</option>
                    ${db.materials.map(mat => `<option value="${mat.id}">[ISO ${mat.isoGroup}] ${mat.name} (${mat.vc} m/min)</option>`).join('')}
                </select>
            </div>

            <!-- Auswahl: Werkzeug -->
            <div style="background: #f8fafc; padding: 18px; border-radius: 14px; border: 1px solid #e2e8f0;">
                <label style="display: block; font-size: 0.8rem; color: #475569; font-weight: 700; margin-bottom: 8px;">3. Werkzeug wählen</label>
                <select id="selectTool" style="width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.9rem; background: #fff; font-weight: 500; color: #0f172a;">
                    <option value="">-- Bitte Werkzeug wählen --</option>
                    ${db.tools.map(t => `<option value="${t.id}">${t.name} (D=${t.d}mm, Z=${t.z})</option>`).join('')}
                </select>
            </div>

            <!-- Auswahl: Profil -->
            <div style="background: #f8fafc; padding: 18px; border-radius: 14px; border: 1px solid #e2e8f0;">
                <label style="display: block; font-size: 0.8rem; color: #475569; font-weight: 700; margin-bottom: 8px;">4. Bearbeitungsprofil wählen</label>
                <select id="selectProfile" style="width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.9rem; background: #fff; font-weight: 500; color: #0f172a;">
                    <option value="">-- Bitte Profil wählen --</option>
                    ${db.profiles.map(p => `<option value="${p.id}">${p.name} (fz=${p.fz}mm)</option>`).join('')}
                </select>
            </div>
        </div>

        <!-- Ergebnis-Bereich -->
        <div id="resultCard" style="display: none; background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border: 1px solid #bbf7d0; border-radius: 16px; padding: 24px; box-shadow: 0 10px 15px -3px rgba(16, 185, 129, 0.1);">
            <h3 style="margin-top: 0; color: #065f46; font-size: 1.1rem; font-weight: 800; display: flex; align-items: center; gap: 8px;">
                <span>⚡ Berechnete Schnittwerte</span>
            </h3>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-top: 16px;" id="resultGrid"></div>
        </div>

        <div id="noSelectionHint" style="text-align: center; padding: 30px; color: #94a3b8; font-style: italic; background: #f8fafc; border-radius: 14px; border: 1px dashed #cbd5e1;">
            Bitte wählen Sie Maschine, Werkstoff, Werkzeug und Profil aus, um die Schnittwerte zu berechnen.
        </div>
    `;

    const triggerCalc = () => {
        const machineId = area.querySelector('#selectMachine').value;
        const materialId = area.querySelector('#selectMaterial').value;
        const toolId = area.querySelector('#selectTool').value;
        const profileId = area.querySelector('#selectProfile').value;

        if (machineId && materialId && toolId && profileId) {
            calculateAndDisplay(db, machineId, materialId, toolId, profileId);
        } else {
            area.querySelector('#resultCard').style.display = 'none';
            area.querySelector('#noSelectionHint').style.display = 'block';
        }
    };

    ['#selectMachine', '#selectMaterial', '#selectTool', '#selectProfile'].forEach(sel => {
        area.querySelector(sel).onchange = triggerCalc;
    });
}

function calculateAndDisplay(db, machineId, materialId, toolId, profileId) {
    const machine = db.machines.find(m => m.id === machineId);
    const material = db.materials.find(m => m.id === materialId);
    const tool = db.tools.find(t => t.id === toolId);
    const profile = db.profiles.find(p => p.id === profileId);

    if (!machine || !material || !tool || !profile) return;

    let vc = material.vc;
    if (tool.materialVc && tool.materialVc[material.id] !== undefined) {
        vc = tool.materialVc[material.id];
    }

    const d = tool.d;
    const z = tool.z;
    const fz = profile.fz;

    let n = (vc * 1000) / (Math.PI * d);
    let isRpmLimited = false;
    if (n > machine.maxRpm) {
        n = machine.maxRpm;
        isRpmLimited = true;
    }

    let vf = n * z * fz;

    let aeVal = profile.aeValue;
    let aeText = aeVal + ' mm';
    if (profile.aeType === 'percent') {
        let aeMm = (d * aeVal) / 100;
        aeText = `${aeVal}% vom D (${aeMm.toFixed(2)} mm)`;
    }

    const resultCard = document.getElementById('resultCard');
    const noHint = document.getElementById('noSelectionHint');
    const resultGrid = document.getElementById('resultGrid');

    noHint.style.display = 'none';
    resultCard.style.display = 'block';

    resultGrid.innerHTML = `
        <div style="background: #fff; padding: 14px; border-radius: 10px; border: 1px solid #a7f3d0; box-shadow: 0 1px 2px rgba(0,0,0,0.02);">
            <div style="font-size: 0.75rem; color: #047857; font-weight: 700; margin-bottom: 4px;">DREHZAHL (n)</div>
            <div style="font-size: 1.4rem; font-weight: 800; color: #065f46;">${Math.round(n)} <span style="font-size: 0.85rem; font-weight: 600;">U/min</span></div>
            ${isRpmLimited ? '<div style="font-size: 0.7rem; color: #dc2626; margin-top: 4px; font-weight: 600;">⚠️ Auf Maschinenlimit gedrosselt</div>' : '<div style="font-size: 0.7rem; color: #047857; margin-top: 4px;">vc = ' + vc + ' m/min</div>'}
        </div>

        <div style="background: #fff; padding: 14px; border-radius: 10px; border: 1px solid #a7f3d0; box-shadow: 0 1px 2px rgba(0,0,0,0.02);">
            <div style="font-size: 0.75rem; color: #047857; font-weight: 700; margin-bottom: 4px;">VORSCHUB (v_f)</div>
            <div style="font-size: 1.4rem; font-weight: 800; color: #065f46;">${Math.round(vf)} <span style="font-size: 0.85rem; font-weight: 600;">mm/min</span></div>
            <div style="font-size: 0.7rem; color: #047857; margin-top: 4px;">Zahnvorschub fz = ${fz} mm</div>
        </div>

        <div style="background: #fff; padding: 14px; border-radius: 10px; border: 1px solid #a7f3d0; box-shadow: 0 1px 2px rgba(0,0,0,0.02);">
            <div style="font-size: 0.75rem; color: #047857; font-weight: 700; margin-bottom: 4px;">EINGRIFF (a_e)</div>
            <div style="font-size: 1.1rem; font-weight: 800; color: #065f46; margin-top: 4px;">${aeText}</div>
            <div style="font-size: 0.7rem; color: #047857; margin-top: 4px;">Werkstoff: ${material.name} ${getIsoBadge(material.isoGroup)}</div>
        </div>
    `;
}
