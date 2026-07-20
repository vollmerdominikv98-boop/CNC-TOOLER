// storage.js
// Verwaltet den LocalStorage mit automatischer Daten-Migration und Fallbacks

export function initDB() {
    if (!localStorage.getItem('cnc_db')) {
        const defaultData = {
            machines: [
                { id: 'm1', name: 'Standard Fräszentrum (3-Achs)', maxRpm: 10000, maxFeed: 5000, powerKw: 7.5 }
            ],
            materials: [
                { id: 'mat1', name: 'Baustahl (S235)', isoGroup: 'P', vc: 200 },
                { id: 'mat2', name: 'Aluminium (AlCuBi)', isoGroup: 'N', vc: 400 }
            ],
            categories: [
                { id: 'cat1', name: 'Schaftfräser' },
                { id: 'cat2', name: 'Torusfräser' }
            ],
            tools: [
                { id: 't1', name: 'VHM Schaftfräser 10mm', manufacturer: 'Standard', categoryId: 'cat1', d: 10, z: 4, l: 30, imageUrl: '' }
            ],
            profiles: [
                { id: 'prof1', name: 'Schruppen', aeType: 'percent', aeValue: 40, fz: 0.08 },
                { id: 'prof2', name: 'Schlichten', aeType: 'percent', aeValue: 10, fz: 0.05 },
                { id: 'prof3', name: 'Trochoidal (HPC)', aeType: 'percent', aeValue: 15, fz: 0.12 }
            ],
            history: []
        };
        localStorage.setItem('cnc_db', JSON.stringify(defaultData));
    } else {
        // Migrations-Prüfung für bestehende lokale Speicherstände
        try {
            let db = JSON.parse(localStorage.getItem('cnc_db'));
            let updated = false;
            
            if (!db.categories) { 
                db.categories = [{ id: 'cat1', name: 'Schaftfräser' }]; 
                updated = true; 
            }
            if (!db.profiles) { 
                db.profiles = [{ id: 'prof1', name: 'Schruppen', aeType: 'percent', aeValue: 40, fz: 0.08 }]; 
                updated = true; 
            }
            if (!db.tools) { 
                db.tools = []; 
                updated = true; 
            }
            db.tools.forEach(t => { 
                if (t.l === undefined) { 
                    t.l = t.d ? t.d * 3 : 30; 
                    updated = true; 
                } 
            });
            
            if (updated) {
                localStorage.setItem('cnc_db', JSON.stringify(db));
            }
        } catch(e) {
            console.error("Migrationsfehler:", e);
        }
    }
}

export function getData() {
    initDB();
    try {
        let db = JSON.parse(localStorage.getItem('cnc_db'));
        // Absolute Sicherheitsnetze gegen undefined-Fehler
        if (!db.categories) db.categories = [];
        if (!db.profiles) db.profiles = [];
        if (!db.tools) db.tools = [];
        if (!db.machines) db.machines = [];
        if (!db.materials) db.materials = [];
        if (!db.history) db.history = [];
        return db;
    } catch (e) {
        return { machines: [], materials: [], categories: [], tools: [], profiles: [], history: [] };
    }
}

export function saveData(db) {
    localStorage.setItem('cnc_db', JSON.stringify(db));
}

export function addHistory(entry) {
    let db = getData();
    entry.timestamp = new Date().toISOString();
    db.history.unshift(entry);
    if (db.history.length > 50) db.history.pop();
    saveData(db);
}

export function getHistory() {
    return getData().history;
}

export function resetDB() {
    localStorage.removeItem('cnc_db');
    initDB();
}

export function exportDB() {
    let dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(getData(), null, 2));
    let downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "cnc_assistant_backup.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
}

export function importDB(file, callback) {
    let reader = new FileReader();
    reader.onload = function(e) {
        try {
            let json = JSON.parse(e.target.result);
            if (json.machines && json.materials) {
                saveData(json);
                callback(true, "Backup erfolgreich importiert!");
            } else {
                callback(false, "Ungültiges Dateiformat!");
            }
        } catch (err) {
            callback(false, "Fehler beim Parsen der JSON-Datei.");
        }
    };
    reader.readAsText(file);
}
