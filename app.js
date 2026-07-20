// app.js
import { initDB, getData, addHistory } from './storage.js';
import { initAdmin } from './admin.js';

let currentStep = 1;
let state = {
    machineId: null,
    materialId: null,
    toolId: null,
    profileId: null
};

document.addEventListener('DOMContentLoaded', () => {
    // 1. Gespeicherten Dark-Mode beim Start wiederherstellen
    const savedTheme = localStorage.getItem('cnc_theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark');
    }

    initDB();
    ensureInitialSelections();

    initAdmin(() => {
        ensureInitialSelections();
        renderStep(currentStep);
    });

    initNavigation();
    initDarkModeToggle(); // Dark Mode Schalter verknüpfen
    renderStep(currentStep);
});

function initDarkModeToggle() {
    // Verschiedene gängige IDs für den Dark-Mode-Button abfangen
    const darkBtn = document.getElementById('darkBtn') || document.getElementById('darkModeBtn') || document.getElementById('themeToggle');
    
    if (darkBtn) {
        darkBtn.onclick = () => {
            document.body.classList.toggle('dark');
            const isDark = document.body.classList.contains('dark');
            localStorage.setItem('cnc_theme', isDark ? 'dark' : 'light');
            
            // Sofort aktuellen Schritt neu rendern, damit sich die Farben direkt anpassen
            renderStep(currentStep);
        };
    }
}

function ensureInitialSelections() {
    const db = getData();
    if (!state.machineId && db.machines.length > 0) state.machineId = db.machines[0].id;
    if (!state.materialId && db.materials.length > 0) state.materialId = db.materials[0].id;
    if (!state.toolId && db.tools.length > 0) state.toolId = db.tools[0].id;
    if (!state.profileId && db.profiles.length > 0) state.profileId = db.profiles[0].id;
}

function initNavigation() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');

    if (prevBtn) {
        prevBtn.onclick = () => {
            if (currentStep > 1) {
                currentStep--;
                renderStep(currentStep);
            }
        };
    }

    if (nextBtn) {
        nextBtn.onclick = () => {
            if (validateStep(currentStep)) {
                if (currentStep < 5) {
                    currentStep++;
                    renderStep(currentStep);
                } else {
                    finishWorkflow();
                }
            }
        };
    }
}

function validateStep(step) {
    const db = getData();
    if (step === 1 && !state.machineId) {
        if (db.machines.length > 0) state.machineId = db.machines[0].id;
        else { alert("Bitte legen Sie zuerst eine Maschine an."); return false; }
    }
    if (step === 2 && !state.materialId) {
        if (db.materials.length > 0) state.materialId = db.materials[0].id;
        else { alert("Bitte legen Sie zuerst einen Werkstoff an."); return false; }
    }
    if (step === 3 && !state.toolId) {
        if (db.tools.length > 0) state.toolId = db.tools[0].id;
        else { alert("Bitte legen Sie zuerst ein Werkzeug an."); return false; }
    }
    if (step === 4 && !state.profileId) {
        if (db.profiles.length > 0) state.profileId = db.profiles[0].id;
        else { alert("Bitte legen Sie zuerst ein Bearbeitungsprofil an."); return false; }
    }
    return true;
}

function renderStep(step) {
    const db = getData();
    
    // Dynamische Farbweiche je nach Dark-Mode-Status
    const isDark = document.body.classList.contains('dark') || document.body.classList.contains('dark-mode');
    const defaultBg = isDark ? '#2a2a2a' : '#fff';
    const defaultBorder = isDark ? '#444' : '#ccc';
    const textColor = isDark ? '#f0f0f0' : '#333';
    const selectedBg = isDark ? 'rgba(46, 204, 113, 0.2)' : 'rgba(46, 204, 113, 0.08)';

    let contentDiv = document.getElementById('stepContentArea');
    if (!contentDiv) {
        contentDiv = document.createElement('div');
        contentDiv.id = 'stepContentArea';
        contentDiv.style.margin = '20px 0';
        
        const prevBtn = document.getElementById('prevBtn');
        if (prevBtn && prevBtn.parentElement && prevBtn.parentElement.parentElement) {
            prevBtn.parentElement.parentElement.insertBefore(contentDiv, prevBtn.parentElement);
        } else {
            document.body.appendChild(contentDiv);
        }
    }

    let html = '';

    if (step === 1) {
        html = `
            <h3>1. Maschine auswählen</h3>
            <p>Wählen Sie die Bearbeitungsmaschine für die Schnittdatenberechnung:</p>
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 15px; margin-top: 15px;">
                ${db.machines.map(m => {
                    const isSel = (state.machineId === m.id);
                    return `
                        <div class="selection-card" data-id="${m.id}" style="color: ${textColor}; padding: 15px; border: 2px solid ${isSel ? '#2ecc71' : defaultBorder}; border-radius: 8px; cursor: pointer; background: ${isSel ? selectedBg : defaultBg}; transition: all 0.2s ease;">
                            <strong>${m.name}</strong>
                            <div style="font-size: 0.85em; margin-top: 5px; opacity: 0.85;">
                                Max. ${m.maxRpm} U/min<br>
                                Max. Vorschub: ${m.maxFeed} mm/min<br>
                                Leistung: ${m.powerKw} kW
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    } 
    else if (step === 2) {
        html = `
            <h3>2. Werkstoff & ISO-Gruppe</h3>
            <p>Wählen Sie das zu bearbeitende Material:</p>
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 15px; margin-top: 15px;">
                ${db.materials.map(mat => {
                    const isSel = (state.materialId === mat.id);
                    return `
                        <div class="selection-card" data-id="${mat.id}" style="color: ${textColor}; padding: 15px; border: 2px solid ${isSel ? '#2ecc71' : defaultBorder}; border-radius: 8px; cursor: pointer; background: ${isSel ? selectedBg : defaultBg}; transition: all 0.2s ease;">
                            <span style="padding: 2px 6px; border-radius: 4px; font-weight: bold; background: ${isDark ? '#444' : '#eee'}; color: ${textColor};">ISO ${mat.isoGroup}</span>
                            <strong style="margin-left: 8px;">${mat.name}</strong>
                            <div style="font-size: 0.85em; margin-top: 5px; opacity: 0.85;">Basis v<sub>c</sub>: ${mat.vc} m/min</div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    } 
    else if (step === 3) {
        html = `
            <h3>3. Werkzeug & Auskragung</h3>
            <p>Wählen Sie das eingesetzte Fräswerkzeug:</p>
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 15px; margin-top: 15px;">
                ${db.tools.length === 0 ? '<p style="color:#e74c3c;">Keine Werkzeuge vorhanden. Nutzen Sie den Admin-Bereich.</p>' : ''}
                ${db.tools.map(t => {
                    const isSel = (state.toolId === t.id);
                    return `
                        <div class="selection-card" data-id="${t.id}" style="color: ${textColor}; padding: 15px; border: 2px solid ${isSel ? '#2ecc71' : defaultBorder}; border-radius: 8px; cursor: pointer; background: ${isSel ? selectedBg : defaultBg}; transition: all 0.2s ease;">
                            <strong>${t.name}</strong>
                            <div style="font-size: 0.85em; margin-top: 5px; opacity: 0.85;">
                                Durchmesser D: ${t.d} mm<br>
                                Zähnezahl Z: ${t.z}<br>
                                Auskraglänge L: ${t.l || (t.d * 3)} mm
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    } 
    else if (step === 4) {
        html = `
            <h3>4. Bearbeitungsstrategie & Profil</h3>
            <p>Wählen Sie ein Bearbeitungsprofil:</p>
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 15px; margin-top: 15px;">
                ${db.profiles.map(p => {
                    const isSel = (state.profileId === p.id);
                    return `
                        <div class="selection-card" data-id="${p.id}" style="color: ${textColor}; padding: 15px; border: 2px solid ${isSel ? '#2ecc71' : defaultBorder}; border-radius: 8px; cursor: pointer; background: ${isSel ? selectedBg : defaultBg}; transition: all 0.2s ease;">
                            <strong>${p.name}</strong>
                            <div style="font-size: 0.85em; margin-top: 5px; opacity: 0.85;">
                                a<sub>e</sub>: ${p.aeValue}${p.aeType === 'percent' ? '% vom D' : 'mm'}<br>
                                f<sub>z</sub>: ${p.fz} mm
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    } 
    else if (step === 5) {
        const mach = db.machines.find(m => m.id === state.machineId) || db.machines[0];
        const mat = db.materials.find(m => m.id === state.materialId) || db.materials[0];
        const tool = db.tools.find(t => t.id === state.toolId) || db.tools[0];
        const prof = db.profiles.find(p => p.id === state.profileId) || db.profiles[0];

        if (mach && mat && tool && prof) {
            const vc = mat.vc;
            const d = tool.d;
            const z = tool.z;
            const fz = prof.fz;

            let n = Math.round((vc * 1000) / (Math.PI * d));
            if (n > mach.maxRpm) n = mach.maxRpm;

            let vf = Math.round(n * z * fz);
            if (vf > mach.maxFeed) vf = mach.maxFeed;

            html = `
                <h3>5. Ergebnis & Plausibilitätsprüfung</h3>
                <div style="background: ${isDark ? 'rgba(46, 204, 113, 0.15)' : 'rgba(46, 204, 113, 0.1)'}; color: ${textColor}; padding: 20px; border-radius: 8px; border: 1px solid #2ecc71; margin-top: 15px;">
                    <h4 style="color: #2ecc71; margin-top:0;">Empfohlene Schnittparameter</h4>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 1.1em; margin-top: 10px;">
                        <div>Drehzahl (n): <strong>${n} U/min</strong></div>
                        <div>Vorschub (v<sub>f</sub>): <strong>${vf} mm/min</strong></div>
                        <div>Schnittgeschwindigkeit (v<sub>c</sub>): <strong>${vc} m/min</strong></div>
                        <div>Zahnvorschub (f<sub>z</sub>): <strong>${fz} mm</strong></div>
                    </div>
                    <hr style="margin: 15px 0; border:0; border-top:1px solid ${defaultBorder};">
                    <div style="font-size: 0.9em; opacity: 0.9;">
                        ✅ Maschine: ${mach.name}<br>
                        ✅ Werkzeug: ${tool.name} (D=${d}mm, Z=${z})<br>
                        ✅ Werkstoff: ${mat.name} (ISO ${mat.isoGroup})<br>
                        ✅ Profil: ${prof.name}
                    </div>
                </div>
            `;
        } else {
            html = `<p style="color: ${textColor};">Bitte vervollständigen Sie alle Auswahlen.</p>`;
        }
    }

    contentDiv.innerHTML = html;

    // Klick-Logik mit sofortigem grünem Feedback & Auto-Advance nach 450ms
    contentDiv.querySelectorAll('.selection-card').forEach(card => {
        card.onclick = () => {
            const id = card.dataset.id;
            if (step === 1) state.machineId = id;
            if (step === 2) state.materialId = id;
            if (step === 3) state.toolId = id;
            if (step === 4) state.profileId = id;

            // Sofort alle Karten im Grid anpassen: Geklickte grün, andere neutral zurücksetzen
            contentDiv.querySelectorAll('.selection-card').forEach(c => {
                if (c === card) {
                    c.style.borderColor = '#2ecc71';
                    c.style.backgroundColor = selectedBg;
                } else {
                    c.style.borderColor = defaultBorder;
                    c.style.backgroundColor = defaultBg;
                }
            });
            
            contentDiv.style.pointerEvents = 'none';

            setTimeout(() => {
                contentDiv.style.pointerEvents = 'auto';
                if (step < 5) {
                    currentStep++;
                    renderStep(currentStep);
                }
            }, 450);
        };
    });

    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    if (prevBtn) prevBtn.disabled = (step === 1);
    if (nextBtn) {
        nextBtn.disabled = false;
        nextBtn.textContent = (step === 5) ? 'Abschließen' : 'Weiter';
    }
}

function finishWorkflow() {
    alert("Schnittparameter erfolgreich berechnet und übernommen!");
    addHistory({ state });
    currentStep = 1;
    ensureInitialSelections();
    renderStep(currentStep);
}
