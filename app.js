// app.js
// Hauptcontroller: Verbindet UI, Datenbank und Logik

import { initDB, getData, addHistory, getHistory } from './storage.js';
import { renderMachines } from './machine.js';
import { renderMaterials } from './materials.js';
import { renderTools } from './tools.js';
import { calculate } from './calculator.js';
import { validateParameters } from './validator.js';
import { initAdmin } from './admin.js';

let appState = {
    step: 1,
    db: null,
    selections: {
        machine: null,
        material: null,
        category: null,
        tool: null,
        parameters: { ae: 0, ap: 0, fz: 0, vc: 0 }
    }
};

const contentArea = document.getElementById('step-content');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');

document.addEventListener('DOMContentLoaded', () => {
    initDB();
    appState.db = getData();
    
    if(localStorage.getItem('theme') === 'dark') {
        document.body.setAttribute('data-theme', 'dark');
    }

    document.getElementById('themeToggleBtn').addEventListener('click', toggleTheme);
    document.getElementById('historyBtn').addEventListener('click', showHistory);
    document.getElementById('closeHistoryBtn').addEventListener('click', () => document.getElementById('historyModal').style.display='none');
    
    prevBtn.addEventListener('click', () => changeStep(-1));
    
    // Zentraler Klick-Handler für den Weiter-Button (verhindert Doppelklicks)
    nextBtn.addEventListener('click', handleNextStep);

    initAdmin(() => {
        appState.db = getData();
        renderStep();
    });

    renderStep();
});

function toggleTheme() {
    if(document.body.getAttribute('data-theme') === 'dark') {
        document.body.removeAttribute('data-theme');
        localStorage.setItem('theme', 'light');
    } else {
        document.body.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
    }
}

function changeStep(direction) {
    appState.step += direction;
    if (appState.step < 1) appState.step = 1;
    if (appState.step > 5) appState.step = 5;
    renderStep();
}

// Logik beim Klick auf "Weiter"
function handleNextStep() {
    // Wenn wir in Schritt 4 sind, müssen wir die Parameter aus den Input-Feldern auslesen und speichern
    if (appState.step === 4) {
        const vcInput = parseFloat(document.getElementById('inp_vc').value);
        const fzInput = parseFloat(document.getElementById('inp_fz').value);
        const aeInput = parseFloat(document.getElementById('inp_ae').value);
        const apInput = parseFloat(document.getElementById('inp_ap').value);

        if (isNaN(vcInput) || isNaN(fzInput) || isNaN(aeInput) || isNaN(apInput)) {
            alert("Bitte füllen Sie alle Parameterfelder mit gültigen Zahlen aus.");
            return;
        }

        appState.selections.parameters = {
            vc: vcInput,
            fz: fzInput,
            ae: aeInput,
            ap: apInput
        };
    }

    changeStep(1);
}

function updateStepperUI() {
    for (let i = 1; i <= 5; i++) {
        const ind = document.getElementById(`ind${i}`);
        ind.className = 'step-indicator';
        if (i < appState.step) ind.classList.add('completed');
        if (i === appState.step) ind.classList.add('active');
    }
    
    prevBtn.disabled = (appState.step === 1);
    
    // Next-Button Sperren/Entsperren je nach Auswahl
    nextBtn.disabled = true;
    if(appState.step === 1 && appState.selections.machine) nextBtn.disabled = false;
    if(appState.step === 2 && appState.selections.material) nextBtn.disabled = false;
    if(appState.step === 3 && appState.selections.tool) nextBtn.disabled = false;
    if(appState.step === 4) nextBtn.disabled = false; 
    
    if(appState.step === 5) {
        nextBtn.style.display = 'none';
    } else {
        nextBtn.style.display = 'block';
    }
}

function renderStep() {
    updateStepperUI();
    
    switch (appState.step) {
        case 1:
            renderMachines('step-content', appState.db.machines, appState.selections.machine?.id, (mach) => {
                appState.selections.machine = mach;
                renderStep();
            });
            break;
            
        case 2:
            renderMaterials('step-content', appState.db.materials, appState.selections.material?.id, (mat) => {
                appState.selections.material = mat;
                renderStep();
            });
            break;
            
        case 3:
            renderTools('step-content', appState.db.tools, appState.db.categories, 
                        appState.selections.category?.id, appState.selections.tool?.id, 
                        (catId) => {
                            appState.selections.category = appState.db.categories.find(c => c.id === catId);
                            appState.selections.tool = null;
                            renderStep();
                        },
                        (tool) => {
                            appState.selections.tool = tool;
                            renderStep();
                        }
            );
            break;
            
        case 4:
            renderParameterInput();
            break;
            
        case 5:
            renderResult();
            break;
    }
}

function renderParameterInput() {
    const mat = appState.selections.material;
    const tool = appState.selections.tool;
    
    // Sinnvolle Standardwerte vorbelegen falls noch nicht geschehen
    const defaultAe = appState.selections.parameters.ae || tool.d;
    const defaultAp = appState.selections.parameters.ap || (tool.d / 2);
    const defaultFz = appState.selections.parameters.fz || 0.10;
    const defaultVc = appState.selections.parameters.vc || mat.vc;

    contentArea.innerHTML = `
        <h2>4. Parameter & Schnittdaten</h2>
        
        <div class="card" style="margin-bottom: 20px; background: rgba(9, 132, 227, 0.05);">
            <h3 style="margin-top:0;">Werkstoff-Empfehlung</h3>
            Richtwert Schnittgeschwindigkeit (vc): <strong>${mat.vc} m/min</strong>
        </div>

        <div class="grid">
            <div class="input-group">
                <label>Schnittgeschwindigkeit vc (m/min)</label>
                <input type="number" id="inp_vc" value="${defaultVc}">
            </div>
            <div class="input-group">
                <label>Vorschub pro Zahn fz (mm)</label>
                <input type="number" id="inp_fz" step="0.01" value="${defaultFz}">
            </div>
            <div class="input-group">
                <label>Schnittbreite ae (mm)</label>
                <input type="number" id="inp_ae" step="0.1" value="${defaultAe}">
            </div>
            <div class="input-group">
                <label>Schnitttiefe ap (mm)</label>
                <input type="number" id="inp_ap" step="0.1" value="${defaultAp}">
            </div>
        </div>
    `;
}

function renderResult() {
    const p = appState.selections.parameters;
    const t = appState.selections.tool;
    const m = appState.selections.machine;

    const rawCalc = calculate(p.vc, t.d, t.z, p.fz, p.ae, p.ap);
    const validation = validateParameters(rawCalc, m, t, p.ae, p.ap);

    let html = `<h2>5. Berechnungsergebnis</h2>`;

    if (!validation.isValid) {
        validation.errors.forEach(err => {
            html += `<div class="alert alert-danger">❌ ${err}</div>`;
        });
        html += `<p style="margin-top: 15px;">Bitte gehen Sie mit dem Zurück-Button einen Schritt zurück und korrigieren Sie die Werte.</p>`;
        contentArea.innerHTML = html;
        return;
    }

    validation.warnings.forEach(warn => {
        html += `<div class="alert alert-warning">⚠️ ${warn}</div>`;
    });

    const res = validation.result;

    html += `
        <div class="grid">
            <div class="card" style="text-align:center; background: var(--success); color: white; border: none;">
                <h3 style="margin:0; font-size: 1em;">Spindeldrehzahl (n)</h3>
                <div style="font-size: 2em; font-weight: bold; margin: 10px 0;">${res.n}</div>
                <div>U/min</div>
            </div>
            <div class="card" style="text-align:center; background: var(--accent); color: white; border: none;">
                <h3 style="margin:0; font-size: 1em;">Vorschub (vf)</h3>
                <div style="font-size: 2em; font-weight: bold; margin: 10px 0;">${res.vf}</div>
                <div>mm/min</div>
            </div>
            <div class="card" style="text-align:center;">
                <h3 style="margin:0; font-size: 1em;">Zeitspanvolumen (Q)</h3>
                <div style="font-size: 2em; font-weight: bold; margin: 10px 0; color: var(--accent);">${res.q}</div>
                <div>cm³/min</div>
            </div>
        </div>
    `;

    if (res.chipThinningActive) {
        html += `
            <div class="alert alert-warning" style="margin-top:20px;">
                <strong>💡 Spanausdünnung aktiv!</strong><br>
                Weil ae (${p.ae} mm) kleiner als der halbe Fräserdurchmesser ist, wurde der Vorschub fz_effektiv auf <strong>${res.fz_eff} mm</strong> (Faktor ${res.chipThinningFactor}x) erhöht.
            </div>
        `;
    }

    html += `
        <div style="margin-top: 30px; text-align: center;">
            <button id="saveHistoryBtn" style="background: var(--success); font-size: 1.1em; padding: 15px 30px;">💾 In Verlauf speichern</button>
        </div>
    `;

    contentArea.innerHTML = html;

    document.getElementById('saveHistoryBtn').onclick = () => {
        addHistory({
            machineName: m.name,
            materialName: appState.selections.material.name,
            toolName: t.name,
            results: res,
            parameters: p
        });
        alert("Erfolgreich im Verlauf gespeichert!");
        document.getElementById('saveHistoryBtn').disabled = true;
        document.getElementById('saveHistoryBtn').innerText = "Gespeichert ✔";
    };
}

function showHistory() {
    const historyModal = document.getElementById('historyModal');
    const listContainer = document.getElementById('history-list');
    const history = getHistory();

    listContainer.innerHTML = '';

    if (history.length === 0) {
        listContainer.innerHTML = '<p>Noch keine Berechnungen gespeichert.</p>';
    } else {
        history.forEach(item => {
            const date = new Date(item.timestamp).toLocaleString('de-DE', {day: '2-digit', month: '2-digit', hour: '2-digit', minute:'2-digit'});
            listContainer.innerHTML += `
                <div class="history-item">
                    <div>
                        <strong>${item.toolName}</strong> in <strong>${item.materialName}</strong>
                        <div class="history-details">${date} | Maschine: ${item.machineName}</div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-weight:bold; color:var(--accent);">${item.results.n} U/min</div>
                        <div>${item.results.vf} mm/min</div>
                    </div>
                </div>
            `;
        });
    }

    historyModal.style.display = 'block';
}
