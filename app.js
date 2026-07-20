// app.js
import { getData, saveData } from './storage.js';
import { initAdmin } from './admin.js';

let currentStep = 1;
let wizardState = {
    machineId: null,
    materialId: null,
    toolId: null,
    profileId: null
};

document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

export function initApp() {
    renderWizardShell();
    initAdmin(() => {
        renderWizardStep();
    });
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

function renderWizardShell() {
    const appContainer = document.getElementById('app') || document.body;
    
    appContainer.innerHTML = `
        <div style="max-width: 980px; margin: 30px auto; padding: 28px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 20px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.02); font-family: system-ui, -apple-system, sans-serif;">
            
            <!-- Header -->
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; border-bottom: 2px solid #f1f5f9; padding-bottom: 16px;">
                <div>
                    <h2 style="margin: 0; color: #0f172a; font-size: 1.5rem; font-weight: 800; letter-spacing: -0.02em;">Shopfloor Schnittwertrechner</h2>
                    <p style="margin: 6px 0 0 0; color: #64748b; font-size: 0.9rem;">Präzise geführte Berechnung von Drehzahl, Vorschub und Schnittparametern</p>
                </div>
                <button id="openAdminBtn" style="background: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe; padding: 8px 16px; border-radius: 10px; cursor: pointer; font-weight: 700; font-size: 0.85rem; box-shadow: 0 2px 4px rgba(37, 99, 235, 0.1); transition: all 0.2s;" onmouseover="this.style.background='#dbeafe'" onmouseout="this.style.background='#eff6ff'">⚙️ Admin & Stammdaten</button>
            </div>

            <!-- Wizard Stepper Indicator -->
            <div id="wizardStepper" style="display: flex; justify-content: space-between; margin-bottom: 28px; position: relative;"></div>

            <!-- Wizard Step Content Area -->
            <div id="stepContentArea"></div>
        </div>
    `;

    renderWizardStep();
}

export function renderWizardStep() {
    const db = getData();
    const stepperContainer = document.getElementById('wizardStepper');
    const contentArea = document.getElementById('stepContentArea');
    if (!stepperContainer || !contentArea) return;

    const steps = [
        { num: 1, label: 'Maschine' },
        { num: 2, label: 'Werkstoff' },
        { num: 3, label: 'Werkzeug' },
        { num: 4, label: 'Profil' },
        { num: 5, label: 'Ergebnis' }
    ];

    stepperContainer.innerHTML = steps.map(s => {
        const isActive = s.num === currentStep;
        const isCompleted = s.num < currentStep;
        let bg = '#f1f5f9', color = '#64748b', border = '#e2e8f0';
        if (isActive) { bg = '#2563eb'; color = '#fff'; border = '#2563eb'; }
        else if (isCompleted) { bg = '#10b981'; color = '#fff'; border = '#10b981'; }

        return `
            <div style="display: flex; align-items: center; gap: 8px; flex: 1; justify-content: ${s.num === 1 ? 'flex-start' : s.num === 5 ? 'flex-end' : 'center'};">
                <div style="width: 30px; height: 30px; border-radius: 50%; background: ${bg}; color: ${color}; border: 1px solid ${border}; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.85rem; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">${isCompleted ? '✓' : s.num}</div>
                <span style="font-size: 0.85rem; font-weight: ${isActive ? '700' : '500'}; color: ${isActive ? '#0f172a' : '#64748b'};">${s.label}</span>
            </div>
        `;
    }).join('');

    // Gemeinsame Handler-Funktion für die automatische Weiterleitung mit grünem Feedback
    const handleSelection = (cardElement, stateKey, nextStepNum, valueId) => {
        wizardState[stateKey] = valueId;
        
        // Optisches Feedback: Ausgewählte Karte leuchtet grün auf
        cardElement.style.background = '#f0fdf4';
        cardElement.style.borderColor = '#10b981';
        cardElement.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.2)';

        // Kurze Verzögerung für den visuellen Effekt, dann automatisch weiter
        setTimeout(() => {
            currentStep = nextStepNum;
            renderWizardStep();
        }, 200);
    };

    if (currentStep === 1) {
        contentArea.innerHTML = `
            <div style="background: #f8fafc; padding: 24px; border-radius: 16px; border: 1px solid #e2e8f0;">
                <h3 style="margin-top: 0; color: #0f172a; font-size: 1.2rem; font-weight: 700;">Schritt 1: Wählen Sie die CNC-Maschine</h3>
                <p style="color: #64748b; font-size: 0.9rem; margin-bottom: 20px;">Klicken Sie auf das gewünschte Bearbeitungszentrum.</p>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 14px;">
                    ${db.machines.length === 0 ? '<div style="color: #94a3b8; font-style: italic; padding: 20px;">Keine Maschinen hinterlegt. Bitte im Admin-Bereich hinzufügen.</div>' : ''}
                    ${db.machines.map(m => `
                        <div class="selection-card" data-id="${m.id}" style="background: ${wizardState.machineId === m.id ? '#f0fdf4' : '#fff'}; border: 2px solid ${wizardState.machineId === m.id ? '#10b981' : '#cbd5e1'}; border-radius: 12px; padding: 16px; cursor: pointer; transition: all 0.2s;" onmouseover="if(this.style.borderColor!=='rgb(16, 185, 129)') this.style.borderColor='#2563eb'" onmouseout="if(this.style.borderColor!=='rgb(16, 185, 129)') this.style.borderColor='${wizardState.machineId === m.id ? '#10b981' : '#cbd5e1'}';">
                            <div style="font-weight: 700; color: #0f172a; font-size: 1rem; margin-bottom: 6px;">${m.name}</div>
                            <div style="font-size: 0.8rem; color: #64748b;">Max. Drehzahl: <b>${m.maxRpm} U/min</b></div>
                            <div style="font-size: 0.8rem; color: #64748b;">Max. Vorschub: <b>${m.maxFeed} mm/min</b></div>
                            <div style="font-size: 0.8rem; color: #64748b;">Leistung: <b>${m.powerKw} kW</b></div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        contentArea.querySelectorAll('.selection-card').forEach(card => {
            card.onclick = () => handleSelection(card, 'machineId', 2, card.dataset.id);
        });
    } 
    else if (currentStep === 2) {
        contentArea.innerHTML = `
            <div style="background: #f8fafc; padding: 24px; border-radius: 16px; border: 1px solid #e2e8f0;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <div>
                        <h3 style="margin-top: 0; margin-bottom: 4px; color: #0f172a; font-size: 1.2rem; font-weight: 700;">Schritt 2: Wählen Sie den Werkstoff</h3>
                        <p style="color: #64748b; font-size: 0.9rem; margin: 0;">Bestimmen Sie das zu zerspanende Material inkl. ISO-Farbgruppe.</p>
                    </div>
                    <button id="prevBtn" style="background: #fff; color: #475569; border: 1px solid #cbd5e1; padding: 6px 14px; border-radius: 8px; font-weight: 700; cursor: pointer; font-size: 0.8rem;">⬅ Zurück</button>
                </div>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 14px;">
                    ${db.materials.length === 0 ? '<div style="color: #94a3b8; font-style: italic; padding: 20px;">Keine Werkstoffe hinterlegt. Bitte im Admin-Bereich hinzufügen.</div>' : ''}
                    ${db.materials.map(mat => `
                        <div class="selection-card" data-id="${mat.id}" style="background: ${wizardState.materialId === mat.id ? '#f0fdf4' : '#fff'}; border: 2px solid ${wizardState.materialId === mat.id ? '#10b981' : '#cbd5e1'}; border-radius: 12px; padding: 16px; cursor: pointer; transition: all 0.2s;" onmouseover="if(this.style.borderColor!=='rgb(16, 185, 129)') this.style.borderColor='#2563eb'" onmouseout="if(this.style.borderColor!=='rgb(16, 185, 129)') this.style.borderColor='${wizardState.materialId === mat.id ? '#10b981' : '#cbd5e1'}';">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                                <span style="font-weight: 700; color: #0f172a; font-size: 1rem;">${mat.name}</span>
                                ${getIsoBadge(mat.isoGroup)}
                            </div>
                            <div style="font-size: 0.85rem; color: #64748b;">Standard-vc: <b>${mat.vc} m/min</b></div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        contentArea.querySelectorAll('.selection-card').forEach(card => {
            card.onclick = () => handleSelection(card, 'materialId', 3, card.dataset.id);
        });

        contentArea.querySelector('#prevBtn').onclick = () => {
            currentStep = 1;
            renderWizardStep();
        };
    }
    else if (currentStep === 3) {
        contentArea.innerHTML = `
            <div style="background: #f8fafc; padding: 24px; border-radius: 16px; border: 1px solid #e2e8f0;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <div>
                        <h3 style="margin-top: 0; margin-bottom: 4px; color: #0f172a; font-size: 1.2rem; font-weight: 700;">Schritt 3: Wählen Sie das Werkzeug</h3>
                        <p style="color: #64748b; font-size: 0.9rem; margin: 0;">Wählen Sie das passende Werkzeug mit Durchmesser und Zähnezahl.</p>
                    </div>
                    <button id="prevBtn" style="background: #fff; color: #475569; border: 1px solid #cbd5e1; padding: 6px 14px; border-radius: 8px; font-weight: 700; cursor: pointer; font-size: 0.8rem;">⬅ Zurück</button>
                </div>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 14px;">
                    ${db.tools.length === 0 ? '<div style="color: #94a3b8; font-style: italic; padding: 20px;">Keine Werkzeuge hinterlegt. Bitte im Admin-Bereich hinzufügen.</div>' : ''}
                    ${db.tools.map(t => `
                        <div class="selection-card" data-id="${t.id}" style="background: ${wizardState.toolId === t.id ? '#f0fdf4' : '#fff'}; border: 2px solid ${wizardState.toolId === t.id ? '#10b981' : '#cbd5e1'}; border-radius: 12px; padding: 16px; cursor: pointer; transition: all 0.2s;" onmouseover="if(this.style.borderColor!=='rgb(16, 185, 129)') this.style.borderColor='#2563eb'" onmouseout="if(this.style.borderColor!=='rgb(16, 185, 129)') this.style.borderColor='${wizardState.toolId === t.id ? '#10b981' : '#cbd5e1'}';">
                            <div style="font-weight: 700; color: #0f172a; font-size: 1rem; margin-bottom: 6px;">${t.name}</div>
                            <div style="font-size: 0.8rem; color: #64748b;">Durchmesser D: <b>${t.d} mm</b></div>
                            <div style="font-size: 0.8rem; color: #64748b;">Zähnezahl Z: <b>${t.z}</b></div>
                            <div style="font-size: 0.8rem; color: #64748b;">Länge L: <b>${t.l} mm</b></div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        contentArea.querySelectorAll('.selection-card').forEach(card => {
            card.onclick = () => handleSelection(card, 'toolId', 4, card.dataset.id);
        });

        contentArea.querySelector('#prevBtn').onclick = () => {
            currentStep = 2;
            renderWizardStep();
        };
    }
    else if (currentStep === 4) {
        contentArea.innerHTML = `
            <div style="background: #f8fafc; padding: 24px; border-radius: 16px; border: 1px solid #e2e8f0;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <div>
                        <h3 style="margin-top: 0; margin-bottom: 4px; color: #0f172a; font-size: 1.2rem; font-weight: 700;">Schritt 4: Wählen Sie das Bearbeitungsprofil</h3>
                        <p style="color: #64748b; font-size: 0.9rem; margin: 0;">Legen Sie Zahnvorschub und Schnittbreite fest.</p>
                    </div>
                    <button id="prevBtn" style="background: #fff; color: #475569; border: 1px solid #cbd5e1; padding: 6px 14px; border-radius: 8px; font-weight: 700; cursor: pointer; font-size: 0.8rem;">⬅ Zurück</button>
                </div>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 14px;">
                    ${db.profiles.length === 0 ? '<div style="color: #94a3b8; font-style: italic; padding: 20px;">Keine Profile hinterlegt. Bitte im Admin-Bereich hinzufügen.</div>' : ''}
                    ${db.profiles.map(p => `
                        <div class="selection-card" data-id="${p.id}" style="background: ${wizardState.profileId === p.id ? '#f0fdf4' : '#fff'}; border: 2px solid ${wizardState.profileId === p.id ? '#10b981' : '#cbd5e1'}; border-radius: 12px; padding: 16px; cursor: pointer; transition: all 0.2s;" onmouseover="if(this.style.borderColor!=='rgb(16, 185, 129)') this.style.borderColor='#2563eb'" onmouseout="if(this.style.borderColor!=='rgb(16, 185, 129)') this.style.borderColor='${wizardState.profileId === p.id ? '#10b981' : '#cbd5e1'}';">
                            <div style="font-weight: 700; color: #0f172a; font-size: 1rem; margin-bottom: 6px;">${p.name}</div>
                            <div style="font-size: 0.8rem; color: #64748b;">Zahnvorschub fz: <b>${p.fz} mm</b></div>
                            <div style="font-size: 0.8rem; color: #64748b;">Eingriff ae: <b>${p.aeValue}${p.aeType === 'percent' ? '% vom D' : ' mm'}</b></div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        contentArea.querySelectorAll('.selection-card').forEach(card => {
            card.onclick = () => handleSelection(card, 'profileId', 5, card.dataset.id);
        });

        contentArea.querySelector('#prevBtn').onclick = () => {
            currentStep = 3;
            renderWizardStep();
        };
    }
    else if (currentStep === 5) {
        const machine = db.machines.find(m => m.id === wizardState.machineId);
        const material = db.materials.find(m => m.id === wizardState.materialId);
        const tool = db.tools.find(t => t.id === wizardState.toolId);
        const profile = db.profiles.find(p => p.id === wizardState.profileId);

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

        contentArea.innerHTML = `
            <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border: 1px solid #bbf7d0; border-radius: 16px; padding: 24px; box-shadow: 0 10px 15px -3px rgba(16, 185, 129, 0.1);">
                <h3 style="margin-top: 0; color: #065f46; font-size: 1.2rem; font-weight: 800; display: flex; align-items: center; gap: 8px;">
                    <span>⚡ Berechnete Schnittwerte im Wizard</span>
                </h3>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-top: 16px; margin-bottom: 24px;">
                    <div style="background: #fff; padding: 16px; border-radius: 12px; border: 1px solid #a7f3d0; box-shadow: 0 1px 2px rgba(0,0,0,0.02);">
                        <div style="font-size: 0.75rem; color: #047857; font-weight: 700; margin-bottom: 4px;">DREHZAHL (n)</div>
                        <div style="font-size: 1.5rem; font-weight: 800; color: #065f46;">${Math.round(n)} <span style="font-size: 0.85rem; font-weight: 600;">U/min</span></div>
                        ${isRpmLimited ? '<div style="font-size: 0.7rem; color: #dc2626; margin-top: 4px; font-weight: 600;">⚠️ Auf Maschinenlimit gedrosselt</div>' : '<div style="font-size: 0.7rem; color: #047857; margin-top: 4px;">vc = ' + vc + ' m/min</div>'}
                    </div>

                    <div style="background: #fff; padding: 16px; border-radius: 12px; border: 1px solid #a7f3d0; box-shadow: 0 1px 2px rgba(0,0,0,0.02);">
                        <div style="font-size: 0.75rem; color: #047857; font-weight: 700; margin-bottom: 4px;">VORSCHUB (v_f)</div>
                        <div style="font-size: 1.5rem; font-weight: 800; color: #065f46;">${Math.round(vf)} <span style="font-size: 0.85rem; font-weight: 600;">mm/min</span></div>
                        <div style="font-size: 0.7rem; color: #047857; margin-top: 4px;">Zahnvorschub fz = ${fz} mm</div>
                    </div>

                    <div style="background: #fff; padding: 16px; border-radius: 12px; border: 1px solid #a7f3d0; box-shadow: 0 1px 2px rgba(0,0,0,0.02);">
                        <div style="font-size: 0.75rem; color: #047857; font-weight: 700; margin-bottom: 4px;">EINGRIFF & MATERIAL</div>
                        <div style="font-size: 1.05rem; font-weight: 800; color: #065f46; margin-top: 2px;">${aeText}</div>
                        <div style="font-size: 0.75rem; color: #047857; margin-top: 6px;">Werkstoff: ${material.name} ${getIsoBadge(material.isoGroup)}</div>
                    </div>
                </div>

                <div style="display: flex; justify-content: space-between;">
                    <button id="restartWizardBtn" style="background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; padding: 10px 20px; border-radius: 10px; font-weight: 700; cursor: pointer;">🔄 Neu starten</button>
                    <button id="editSelectionBtn" style="background: #2563eb; color: #fff; border: none; padding: 10px 20px; border-radius: 10px; font-weight: 700; cursor: pointer; box-shadow: 0 2px 4px rgba(37, 99, 235, 0.2);">Auswahl anpassen</button>
                </div>
            </div>
        `;

        contentArea.querySelector('#restartWizardBtn').onclick = () => {
            currentStep = 1;
            wizardState = { machineId: null, materialId: null, toolId: null, profileId: null };
            renderWizardStep();
        };

        contentArea.querySelector('#editSelectionBtn').onclick = () => {
            currentStep = 1;
            renderWizardStep();
        };
    }
}
