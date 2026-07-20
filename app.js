document.addEventListener("DOMContentLoaded", () => {
    let currentStep = 1;
    const totalSteps = 5;

    const steps = document.querySelectorAll(".wizard-step");
    const panels = document.querySelectorAll(".wizard-panel");
    const btnBack = document.getElementById("btn-back");
    const btnNext = document.getElementById("btn-next");
    const btnHeaderNew = document.getElementById("btn-header-new");
    const btnHeaderAdmin = document.getElementById("btn-header-admin");

    function updateWizard() {
        steps.forEach((step, idx) => {
            const stepNum = idx + 1;
            const icon = step.querySelector(".step-icon");
            step.classList.remove("active", "completed");
            
            if (stepNum === currentStep) {
                step.classList.add("active");
                icon.textContent = stepNum;
            } else if (stepNum < currentStep) {
                step.classList.add("completed");
                icon.textContent = "✓"; // Zeigt das Häkchen wie im Bild für erledigte Schritte
            } else {
                icon.textContent = stepNum;
            }
        });

        panels.forEach((panel) => {
            panel.classList.remove("active");
        });

        if (currentStep <= totalSteps) {
            document.getElementById(`panel-${currentStep}`).classList.add("active");
            btnBack.style.display = currentStep === 1 ? "none" : "block";
            btnNext.textContent = currentStep === totalSteps ? "Berechnen / Fertig" : "Weiter";
            btnNext.style.display = "block";
        } else if (currentStep === 99) { // Admin Panel
            document.getElementById("panel-admin").classList.add("active");
            btnBack.style.display = "block";
            btnNext.style.display = "none";
        }
    }

    btnNext.addEventListener("click", () => {
        if (currentStep < totalSteps) {
            currentStep++;
            if (currentStep === totalSteps) {
                runCalculation();
            }
            updateWizard();
        } else if (currentStep === totalSteps) {
            runCalculation();
        }
    });

    btnBack.addEventListener("click", () => {
        if (currentStep === 99) {
            currentStep = 1;
        } else if (currentStep > 1) {
            currentStep--;
        }
        updateWizard();
    });

    btnHeaderNew.addEventListener("click", () => {
        currentStep = 1;
        updateWizard();
    });

    btnHeaderAdmin.addEventListener("click", () => {
        currentStep = 99;
        renderAdminTables("adm-tools");
        updateWizard();
    });

    // Dropdowns füllen
    const matSelect = document.getElementById("wizard-material");
    const toolSelect = document.getElementById("wizard-tool");
    const machSelect = document.getElementById("wizard-machine");
    const machineInfoDisplay = document.getElementById("machine-info-display");

    function populateDropdowns() {
        if (matSelect) {
            matSelect.innerHTML = db.materials.getAll().map(m => `<option value="${m.id}" data-vc="${m.defaultVc}" data-kc="${m.kc11}">${m.name} (ISO ${m.iso})</option>`).join("");
            matSelect.dispatchEvent(new Event("change"));
        }
        if (toolSelect) {
            toolSelect.innerHTML = db.tools.getAll().map(t => `<option value="${t.id}" data-dia="${t.diameter}" data-teeth="${t.teeth}">${t.name} (Ø${t.diameter}mm)</option>`).join("");
        }
        if (machSelect) {
            machSelect.innerHTML = db.machines.getAll().map(m => `<option value="${m.id}" data-rpm="${m.maxRpm}" data-feed="${m.maxFeed}" data-power="${m.power}">${m.name}</option>`).join("");
            machSelect.dispatchEvent(new Event("change"));
        }
    }

    matSelect?.addEventListener("change", () => {
        const opt = matSelect.selectedOptions[0];
        if (opt) {
            document.getElementById("wizard-vc").value = opt.dataset.vc || 200;
        }
    });

    machSelect?.addEventListener("change", () => {
        const opt = machSelect.selectedOptions[0];
        if (opt && machineInfoDisplay) {
            machineInfoDisplay.innerHTML = `Max. Drehzahl: <strong>${opt.dataset.rpm} U/min</strong> | Max. Vorschub: <strong>${opt.dataset.feed} mm/min</strong> | Leistung: <strong>${opt.dataset.power} kW</strong>`;
        }
    });

    function runCalculation() {
        const vc = parseFloat(document.getElementById("wizard-vc").value) || 200;
        const fz = parseFloat(document.getElementById("wizard-fz").value) || 0.1;
        const ap = parseFloat(document.getElementById("wizard-ap").value) || 2.0;
        const ae = parseFloat(document.getElementById("wizard-ae").value) || 5.0;
        const length = parseFloat(document.getElementById("wizard-length").value) || 100;

        const toolOpt = toolSelect.selectedOptions[0];
        const matOpt = matSelect.selectedOptions[0];

        if (!toolOpt || !matOpt) return;

        const diameter = parseFloat(toolOpt.dataset.dia);
        const teeth = parseInt(toolOpt.dataset.teeth);
        const kc11 = parseFloat(matOpt.dataset.kc);

        const res = Calculator.calculate(vc, diameter, fz, teeth, ap, ae, kc11, length);

        document.getElementById("res-n").textContent = res.n;
        document.getElementById("res-vf").textContent = res.vf;
        document.getElementById("res-q").textContent = res.q;
        document.getElementById("res-pc").textContent = res.pc;
        document.getElementById("res-m").textContent = res.m;
        document.getElementById("res-t").textContent = res.t;
        document.getElementById("result-meta-info").textContent = `${diameter} mm · ${teeth} Schneiden · vc ${vc} m/min`;
    }

    // Admin Verwaltungstabellen render mit Tabs
    const adminTabs = document.querySelectorAll(".admin-tab-btn");
    adminTabs.forEach(tab => {
        tab.addEventListener("click", () => {
            adminTabs.forEach(t => t.classList.remove("active"));
            tab.classList.add("active");
            renderAdminTables(tab.dataset.tab);
        });
    });

    function renderAdminTables(type) {
        const container = document.getElementById("admin-content-body");
        if (type === "adm-tools" || !type) {
            container.innerHTML = `
                <div style="margin-bottom:1rem; display:flex; justify-content:space-between; align-items:center;">
                    <h3>Werkzeug-Bestand</h3>
                    <button class="btn primary small" onclick="openAddToolModal()">+ Neues Werkzeug</button>
                </div>
                <div class="table-container">
                    <table>
                        <thead><tr><th>Name</th><th>Durchmesser</th><th>Zähne</th><th>Aktionen</th></tr></thead>
                        <tbody>
                            ${db.tools.getAll().map(t => `
                                <tr>
                                    <td>${t.name}</td>
                                    <td>${t.diameter} mm</td>
                                    <td>${t.teeth}</td>
                                    <td><button class="btn danger small" onclick="removeTool(${t.id})">Löschen</button></td>
                                </tr>
                            `).join("")}
                        </tbody>
                    </table>
                </div>
            `;
        } else if (type === "adm-materials") {
            container.innerHTML = `
                <div style="margin-bottom:1rem; display:flex; justify-content:space-between; align-items:center;">
                    <h3>Werkstoff-Bestand</h3>
                    <button class="btn primary small" onclick="openAddMaterialModal()">+ Neuer Werkstoff</button>
                </div>
                <div class="table-container">
                    <table>
                        <thead><tr><th>Bezeichnung</th><th>ISO</th><th>kc1.1</th><th>Std. Vc</th><th>Aktionen</th></tr></thead>
                        <tbody>
                            ${db.materials.getAll().map(m => `
                                <tr>
                                    <td>${m.name}</td>
                                    <td>${m.iso}</td>
                                    <td>${m.kc11}</td>
                                    <td>${m.defaultVc}</td>
                                    <td><button class="btn danger small" onclick="removeMaterial(${m.id})">Löschen</button></td>
                                </tr>
                            `).join("")}
                        </tbody>
                    </table>
                </div>
            `;
        } else if (type === "adm-machines") {
            container.innerHTML = `
                <div style="margin-bottom:1rem; display:flex; justify-content:space-between; align-items:center;">
                    <h3>Maschinenpark</h3>
                    <button class="btn primary small" onclick="openAddMachineModal()">+ Neue Maschine</button>
                </div>
                <div class="table-container">
                    <table>
                        <thead><tr><th>Name</th><th>Max RPM</th><th>Max Feed</th><th>Leistung</th><th>Aktionen</th></tr></thead>
                        <tbody>
                            ${db.machines.getAll().map(m => `
                                <tr>
                                    <td>${m.name}</td>
                                    <td>${m.maxRpm}</td>
                                    <td>${m.maxFeed}</td>
                                    <td>${m.power} kW</td>
                                    <td><button class="btn danger small" onclick="removeMachine(${m.id})">Löschen</button></td>
                                </tr>
                            `).join("")}
                        </tbody>
                    </table>
                </div>
            `;
        }
    }

    window.removeTool = (id) => { db.tools.remove(id); populateDropdowns(); renderAdminTables("adm-tools"); };
    window.removeMaterial = (id) => { db.materials.remove(id); populateDropdowns(); renderAdminTables("adm-materials"); };
    window.removeMachine = (id) => { db.machines.remove(id); populateDropdowns(); renderAdminTables("adm-machines"); };

    window.openAddToolModal = () => {
        const modal = document.getElementById("modal");
        const modalBody = document.getElementById("modal-body");
        modalBody.innerHTML = `
            <h3>Neues Werkzeug</h3>
            <div class="form-group"><label>Name</label><input type="text" id="adm-tool-name"></div>
            <div class="form-group"><label>Durchmesser (mm)</label><input type="number" id="adm-tool-dia" value="10"></div>
            <div class="form-group"><label>Zähne</label><input type="number" id="adm-tool-teeth" value="4"></div>
            <button class="btn primary" id="save-adm-tool" style="width:100%; margin-top:1rem;">Speichern</button>
        `;
        modal.classList.remove("hidden");
        document.getElementById("save-adm-tool").addEventListener("click", () => {
            const name = document.getElementById("adm-tool-name").value;
            const diameter = parseFloat(document.getElementById("adm-tool-dia").value);
            const teeth = parseInt(document.getElementById("adm-tool-teeth").value);
            if (name) {
                db.tools.add({ name, type: "Fräser", diameter, teeth });
                modal.classList.add("hidden");
                populateDropdowns();
                renderAdminTables("adm-tools");
            }
        });
    };

    window.openAddMaterialModal = () => {
        const modal = document.getElementById("modal");
        const modalBody = document.getElementById("modal-body");
        modalBody.innerHTML = `
            <h3>Neuer Werkstoff</h3>
            <div class="form-group"><label>Bezeichnung</label><input type="text" id="adm-mat-name"></div>
            <div class="form-group"><label>ISO-Gruppe</label><input type="text" id="adm-mat-iso" value="P"></div>
            <div class="form-group"><label>kc1.1</label><input type="number" id="adm-mat-kc" value="1500"></div>
            <div class="form-group"><label>Std. Vc</label><input type="number" id="adm-mat-vc" value="200"></div>
            <button class="btn primary" id="save-adm-mat" style="width:100%; margin-top:1rem;">Speichern</button>
        `;
        modal.classList.remove("hidden");
        document.getElementById("save-adm-mat").addEventListener("click", () => {
            const name = document.getElementById("adm-mat-name").value;
            const iso = document.getElementById("adm-mat-iso").value;
            const kc11 = parseFloat(document.getElementById("adm-mat-kc").value);
            const defaultVc = parseFloat(document.getElementById("adm-mat-vc").value);
            if (name) {
                db.materials.add({ name, iso, kc11, defaultVc });
                modal.classList.add("hidden");
                populateDropdowns();
                renderAdminTables("adm-materials");
            }
        });
    };

    window.openAddMachineModal = () => {
        const modal = document.getElementById("modal");
        const modalBody = document.getElementById("modal-body");
        modalBody.innerHTML = `
            <h3>Neue Maschine</h3>
            <div class="form-group"><label>Name</label><input type="text" id="adm-mach-name"></div>
            <div class="form-group"><label>Max RPM</label><input type="number" id="adm-mach-rpm" value="10000"></div>
            <div class="form-group"><label>Max Feed</label><input type="number" id="adm-mach-feed" value="20000"></div>
            <div class="form-group"><label>Leistung (kW)</label><input type="number" id="adm-mach-power" value="15"></div>
            <button class="btn primary" id="save-adm-mach" style="width:100%; margin-top:1rem;">Speichern</button>
        `;
        modal.classList.remove("hidden");
        document.getElementById("save-adm-mach").addEventListener("click", () => {
            const name = document.getElementById("adm-mach-name").value;
            const maxRpm = parseFloat(document.getElementById("adm-mach-rpm").value);
            const maxFeed = parseFloat(document.getElementById("adm-mach-feed").value);
            const power = parseFloat(document.getElementById("adm-mach-power").value);
            if (name) {
                db.machines.add({ name, maxRpm, maxFeed, power });
                modal.classList.add("hidden");
                populateDropdowns();
                renderAdminTables("adm-machines");
            }
        });
    };

    document.querySelector(".close-modal")?.addEventListener("click", () => {
        document.getElementById("modal").classList.add("hidden");
    });

    populateDropdowns();
    updateWizard();
});
