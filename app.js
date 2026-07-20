document.addEventListener("DOMContentLoaded", () => {
    const navBtns = document.querySelectorAll(".nav-btn");
    const sections = document.querySelectorAll(".app-section");

    navBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            navBtns.forEach(b => b.classList.remove("active"));
            sections.forEach(s => s.classList.remove("active"));

            btn.classList.add("active");
            const target = document.getElementById(btn.dataset.target);
            if (target) target.classList.add("active");
        });
    });

    const machineSelect = document.getElementById("calc-machine");
    const materialSelect = document.getElementById("calc-material");
    const toolSelect = document.getElementById("calc-tool");

    function populateDropdowns() {
        if (machineSelect) {
            machineSelect.innerHTML = db.machines.getAll().map(m => `<option value="${m.id}">${m.name} (Max RPM: ${m.maxRpm})</option>`).join("");
        }
        if (materialSelect) {
            materialSelect.innerHTML = db.materials.getAll().map(mat => `<option value="${mat.id}" data-vc="${mat.defaultVc}" data-kc="${mat.kc11}">${mat.name} (ISO ${mat.iso})</option>`).join("");
            materialSelect.dispatchEvent(new Event("change"));
        }
        if (toolSelect) {
            toolSelect.innerHTML = db.tools.getAll().map(t => `<option value="${t.id}" data-diameter="${t.diameter}" data-teeth="${t.teeth}">${t.name} (Ø${t.diameter}mm, Z${t.teeth})</option>`).join("");
            toolSelect.dispatchEvent(new Event("change"));
        }
    }

    if (materialSelect) {
        materialSelect.addEventListener("change", () => {
            const selectedOpt = materialSelect.selectedOptions[0];
            if (selectedOpt) {
                const vcInput = document.getElementById("calc-vc");
                if (vcInput) vcInput.value = selectedOpt.dataset.vc || 200;
            }
        });
    }

    if (toolSelect) {
        toolSelect.addEventListener("change", () => {
            const selectedOpt = toolSelect.selectedOptions[0];
            if (selectedOpt) {
                const fzInput = document.getElementById("calc-fz");
                if (fzInput && !fzInput.value) fzInput.value = 0.1;
            }
        });
    }

    populateDropdowns();

    const btnCalculate = document.getElementById("btn-calculate");
    if (btnCalculate) {
        btnCalculate.addEventListener("click", () => {
            const vc = parseFloat(document.getElementById("calc-vc").value);
            const fz = parseFloat(document.getElementById("calc-fz").value);
            const ap = parseFloat(document.getElementById("calc-ap").value);
            const ae = parseFloat(document.getElementById("calc-ae").value);

            const toolOpt = toolSelect.selectedOptions[0];
            const matOpt = materialSelect.selectedOptions[0];

            if (!toolOpt || !matOpt) return;

            const diameter = parseFloat(toolOpt.dataset.diameter);
            const teeth = parseInt(toolOpt.dataset.teeth);
            const kc11 = parseFloat(matOpt.dataset.kc);

            if (!Validator.isPositiveNumber(vc) || !Validator.isPositiveNumber(fz) || !Validator.isPositiveNumber(diameter)) {
                alert("Bitte gültige positive Zahlen eingeben.");
                return;
            }

            const result = Calculator.calculate(vc, diameter, fz, teeth, ap, ae, kc11);

            document.getElementById("res-n").textContent = result.n;
            document.getElementById("res-vf").textContent = result.vf;
            document.getElementById("res-q").textContent = result.q;
            document.getElementById("res-fc").textContent = result.fc;
        });
    }

    function renderTables() {
        const searchToolsVal = document.getElementById("search-tools")?.value.toLowerCase() || "";
        const searchMaterialsVal = document.getElementById("search-materials")?.value.toLowerCase() || "";
        const searchMachinesVal = document.getElementById("search-machines")?.value.toLowerCase() || "";

        // Tools Table
        const toolsTbody = document.querySelector("#tools-table tbody");
        if (toolsTbody) {
            const filteredTools = db.tools.getAll().filter(t => 
                t.name.toLowerCase().includes(searchToolsVal) || t.type.toLowerCase().includes(searchToolsVal)
            );
            toolsTbody.innerHTML = filteredTools.map(t => `
                <tr>
                    <td>${t.id}</td>
                    <td>${t.name}</td>
                    <td>${t.type}</td>
                    <td>${t.diameter}</td>
                    <td>${t.teeth}</td>
                    <td>
                        <div class="table-actions">
                            <button class="btn secondary small" onclick="editTool(${t.id})">Bearbeiten</button>
                            <button class="btn danger small" onclick="deleteTool(${t.id})">Löschen</button>
                        </div>
                    </td>
                </tr>
            `).join("");
        }

        // Materials Table
        const matTbody = document.querySelector("#materials-table tbody");
        if (matTbody) {
            const filteredMaterials = db.materials.getAll().filter(m => 
                m.name.toLowerCase().includes(searchMaterialsVal) || m.iso.toLowerCase().includes(searchMaterialsVal)
            );
            matTbody.innerHTML = filteredMaterials.map(m => `
                <tr>
                    <td>${m.name}</td>
                    <td>${m.iso}</td>
                    <td>${m.kc11}</td>
                    <td>${m.defaultVc}</td>
                    <td>
                        <div class="table-actions">
                            <button class="btn secondary small" onclick="editMaterial(${m.id})">Bearbeiten</button>
                            <button class="btn danger small" onclick="deleteMaterial(${m.id})">Löschen</button>
                        </div>
                    </td>
                </tr>
            `).join("");
        }

        // Machines Table
        const machTbody = document.querySelector("#machines-table tbody");
        if (machTbody) {
            const filteredMachines = db.machines.getAll().filter(m => 
                m.name.toLowerCase().includes(searchMachinesVal)
            );
            machTbody.innerHTML = filteredMachines.map(m => `
                <tr>
                    <td>${m.name}</td>
                    <td>${m.maxRpm}</td>
                    <td>${m.maxFeed}</td>
                    <td>${m.power}</td>
                    <td>
                        <div class="table-actions">
                            <button class="btn secondary small" onclick="editMachine(${m.id})">Bearbeiten</button>
                            <button class="btn danger small" onclick="deleteMachine(${m.id})">Löschen</button>
                        </div>
                    </td>
                </tr>
            `).join("");
        }
    }

    renderTables();

    // Search event listeners
    document.getElementById("search-tools")?.addEventListener("input", renderTables);
    document.getElementById("search-materials")?.addEventListener("input", renderTables);
    document.getElementById("search-machines")?.addEventListener("input", renderTables);

    window.deleteTool = (id) => {
        db.tools.remove(id);
        renderTables();
        populateDropdowns();
    };
    window.deleteMaterial = (id) => {
        db.materials.remove(id);
        renderTables();
        populateDropdowns();
    };
    window.deleteMachine = (id) => {
        db.machines.remove(id);
        renderTables();
        populateDropdowns();
    };

    // Edit Functions
    window.editTool = (id) => {
        const tool = db.tools.getAll().find(t => t.id == id);
        if (!tool) return;
        modalBody.innerHTML = `
            <h3>Werkzeug bearbeiten</h3>
            <div class="form-group"><label>Name</label><input type="text" id="edit-tool-name" value="${tool.name}"></div>
            <div class="form-group"><label>Typ</label><input type="text" id="edit-tool-type" value="${tool.type}"></div>
            <div class="form-group"><label>Durchmesser (mm)</label><input type="number" id="edit-tool-dia" step="0.1" value="${tool.diameter}"></div>
            <div class="form-group"><label>Zähne</label><input type="number" id="edit-tool-teeth" value="${tool.teeth}"></div>
            <button class="btn primary" id="save-edit-tool">Änderungen speichern</button>
        `;
        modal.classList.remove("hidden");
        document.getElementById("save-edit-tool").addEventListener("click", () => {
            const name = document.getElementById("edit-tool-name").value;
            const type = document.getElementById("edit-tool-type").value;
            const diameter = parseFloat(document.getElementById("edit-tool-dia").value);
            const teeth = parseInt(document.getElementById("edit-tool-teeth").value);
            if (Validator.validateTool({name, diameter, teeth})) {
                db.tools.update({id, name, type, diameter, teeth});
                modal.classList.add("hidden");
                renderTables();
                populateDropdowns();
            } else {
                alert("Bitte alle Felder korrekt ausfüllen.");
            }
        });
    };

    window.editMaterial = (id) => {
        const mat = db.materials.getAll().find(m => m.id == id);
        if (!mat) return;
        modalBody.innerHTML = `
            <h3>Werkstoff bearbeiten</h3>
            <div class="form-group"><label>Bezeichnung</label><input type="text" id="edit-mat-name" value="${mat.name}"></div>
            <div class="form-group"><label>ISO-Gruppe</label><input type="text" id="edit-mat-iso" value="${mat.iso}"></div>
            <div class="form-group"><label>kc1.1 (N/mm²)</label><input type="number" id="edit-mat-kc" value="${mat.kc11}"></div>
            <div class="form-group"><label>Standard Vc (m/min)</label><input type="number" id="edit-mat-vc" value="${mat.defaultVc}"></div>
            <button class="btn primary" id="save-edit-mat">Änderungen speichern</button>
        `;
        modal.classList.remove("hidden");
        document.getElementById("save-edit-mat").addEventListener("click", () => {
            const name = document.getElementById("edit-mat-name").value;
            const iso = document.getElementById("edit-mat-iso").value;
            const kc11 = parseFloat(document.getElementById("edit-mat-kc").value);
            const defaultVc = parseFloat(document.getElementById("edit-mat-vc").value);
            if (Validator.validateMaterial({name, kc11})) {
                db.materials.update({id, name, iso, kc11, defaultVc});
                modal.classList.add("hidden");
                renderTables();
                populateDropdowns();
            } else {
                alert("Bitte alle Felder korrekt ausfüllen.");
            }
        });
    };

    window.editMachine = (id) => {
        const mach = db.machines.getAll().find(m => m.id == id);
        if (!mach) return;
        modalBody.innerHTML = `
            <h3>Maschine bearbeiten</h3>
            <div class="form-group"><label>Maschinenname</label><input type="text" id="edit-mach-name" value="${mach.name}"></div>
            <div class="form-group"><label>Max. Drehzahl (U/min)</label><input type="number" id="edit-mach-rpm" value="${mach.maxRpm}"></div>
            <div class="form-group"><label>Max. Vorschub (mm/min)</label><input type="number" id="edit-mach-feed" value="${mach.maxFeed}"></div>
            <div class="form-group"><label>Leistung (kW)</label><input type="number" id="edit-mach-power" value="${mach.power}"></div>
            <button class="btn primary" id="save-edit-mach">Änderungen speichern</button>
        `;
        modal.classList.remove("hidden");
        document.getElementById("save-edit-mach").addEventListener("click", () => {
            const name = document.getElementById("edit-mach-name").value;
            const maxRpm = parseFloat(document.getElementById("edit-mach-rpm").value);
            const maxFeed = parseFloat(document.getElementById("edit-mach-feed").value);
            const power = parseFloat(document.getElementById("edit-mach-power").value);
            if (Validator.validateMachine({name, maxRpm})) {
                db.machines.update({id, name, maxRpm, maxFeed, power});
                modal.classList.add("hidden");
                renderTables();
                populateDropdowns();
            } else {
                alert("Bitte alle Pflichtfelder korrekt ausfüllen.");
            }
        });
    };

    const modal = document.getElementById("modal");
    const closeModal = document.querySelector(".close-modal");
    const modalBody = document.getElementById("modal-body");

    if (closeModal) {
        closeModal.addEventListener("click", () => modal.classList.add("hidden"));
    }

    document.getElementById("btn-add-tool")?.addEventListener("click", () => {
        modalBody.innerHTML = `
            <h3>Neues Werkzeug hinzufügen</h3>
            <div class="form-group"><label>Name</label><input type="text" id="new-tool-name"></div>
            <div class="form-group"><label>Typ</label><input type="text" id="new-tool-type" value="Fräser"></div>
            <div class="form-group"><label>Durchmesser (mm)</label><input type="number" id="new-tool-dia" step="0.1"></div>
            <div class="form-group"><label>Zähne</label><input type="number" id="new-tool-teeth" value="2"></div>
            <button class="btn primary" id="save-new-tool">Speichern</button>
        `;
        modal.classList.remove("hidden");
        document.getElementById("save-new-tool").addEventListener("click", () => {
            const name = document.getElementById("new-tool-name").value;
            const type = document.getElementById("new-tool-type").value;
            const diameter = parseFloat(document.getElementById("new-tool-dia").value);
            const teeth = parseInt(document.getElementById("new-tool-teeth").value);
            if (Validator.validateTool({name, diameter, teeth})) {
                db.tools.add({name, type, diameter, teeth});
                modal.classList.add("hidden");
                renderTables();
                populateDropdowns();
            } else {
                alert("Bitte alle Felder korrekt ausfüllen.");
            }
        });
    });

    document.getElementById("btn-add-material")?.addEventListener("click", () => {
        modalBody.innerHTML = `
            <h3>Neuen Werkstoff hinzufügen</h3>
            <div class="form-group"><label>Bezeichnung</label><input type="text" id="new-mat-name"></div>
            <div class="form-group"><label>ISO-Gruppe</label><input type="text" id="new-mat-iso" value="P"></div>
            <div class="form-group"><label>kc1.1 (N/mm²)</label><input type="number" id="new-mat-kc" value="1500"></div>
            <div class="form-group"><label>Standard Vc (m/min)</label><input type="number" id="new-mat-vc" value="200"></div>
            <button class="btn primary" id="save-new-mat">Speichern</button>
        `;
        modal.classList.remove("hidden");
        document.getElementById("save-new-mat").addEventListener("click", () => {
            const name = document.getElementById("new-mat-name").value;
            const iso = document.getElementById("new-mat-iso").value;
            const kc11 = parseFloat(document.getElementById("new-mat-kc").value);
            const defaultVc = parseFloat(document.getElementById("new-mat-vc").value);
            if (Validator.validateMaterial({name, kc11})) {
                db.materials.add({name, iso, kc11, defaultVc});
                modal.classList.add("hidden");
                renderTables();
                populateDropdowns();
            } else {
                alert("Bitte alle Felder korrekt ausfüllen.");
            }
        });
    });

    document.getElementById("btn-add-machine")?.addEventListener("click", () => {
        modalBody.innerHTML = `
            <h3>Neue Maschine hinzufügen</h3>
            <div class="form-group"><label>Maschinenname</label><input type="text" id="new-mach-name"></div>
            <div class="form-group"><label>Max. Drehzahl (U/min)</label><input type="number" id="new-mach-rpm" value="10000"></div>
            <div class="form-group"><label>Max. Vorschub (mm/min)</label><input type="number" id="new-mach-feed" value="20000"></div>
            <div class="form-group"><label>Leistung (kW)</label><input type="number" id="new-mach-power" value="15"></div>
            <button class="btn primary" id="save-new-mach">Speichern</button>
        `;
        modal.classList.remove("hidden");
        document.getElementById("save-new-mach").addEventListener("click", () => {
            const name = document.getElementById("new-mach-name").value;
            const maxRpm = parseFloat(document.getElementById("new-mach-rpm").value);
            const maxFeed = parseFloat(document.getElementById("new-mach-feed").value);
            const power = parseFloat(document.getElementById("new-mach-power").value);
            if (Validator.validateMachine({name, maxRpm})) {
                db.machines.add({name, maxRpm, maxFeed, power});
                modal.classList.add("hidden");
                renderTables();
                populateDropdowns();
            } else {
                alert("Bitte alle Pflichtfelder korrekt ausfüllen.");
            }
        });
    });
});
