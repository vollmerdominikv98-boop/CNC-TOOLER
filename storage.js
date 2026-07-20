// storage.js
// Verwaltet LocalStorage, Backups und den Berechnungsverlauf

import { defaultData } from './database.js';

const STORAGE_KEY = 'cnc_cam_database';
const HISTORY_KEY = 'cnc_cam_history';

/**
 * Initialisiert die Datenbank. Falls noch keine existiert, wird defaultData geladen.
 */
export function initDB() {
    if (!localStorage.getItem(STORAGE_KEY)) {
        saveData(defaultData);
        console.log("Storage: Standard-Datenbank initialisiert.");
    }
    if (!localStorage.getItem(HISTORY_KEY)) {
        localStorage.setItem(HISTORY_KEY, JSON.stringify([]));
    }
}

/**
 * Holt die komplette aktuelle Datenbank.
 */
export function getData() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || defaultData;
    } catch (e) {
        console.error("Storage Error: Fehler beim Parsen der DB. Lade Standardwerte.", e);
        return defaultData;
    }
}

/**
 * Speichert das übergebene Objekt komplett als neue Datenbank.
 */
export function saveData(dataObj) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataObj));
}

/**
 * Setzt die Datenbank auf Werkseinstellungen zurück.
 */
export function resetDB() {
    saveData(defaultData);
}

// --- VERLAUF (History) FUNKTIONEN ---

/**
 * Holt den gesamten Berechnungsverlauf
 */
export function getHistory() {
    try {
        return JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
    } catch (e) {
        return [];
    }
}

/**
 * Fügt eine neue Berechnung in den Verlauf ein.
 * Speichert maximal die letzten 20 Einträge.
 */
export function addHistory(calculationRecord) {
    let history = getHistory();
    // Füge Zeitstempel und einzigartige ID hinzu
    calculationRecord.timestamp = new Date().toISOString();
    calculationRecord.id = 'hist_' + Date.now();
    
    // Oben anfügen
    history.unshift(calculationRecord);
    
    // Auf 20 Einträge begrenzen
    if (history.length > 20) {
        history.pop();
    }
    
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

// --- EXPORT & IMPORT (Backup) ---

/**
 * Erstellt eine JSON-Datei und lädt sie herunter.
 */
export function exportDB() {
    const data = getData();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "cnc_werkzeug_backup.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

/**
 * Liest ein File-Objekt ein und überschreibt die Datenbank, 
 * falls es valides JSON ist.
 */
export function importDB(file, callback) {
    const reader = new FileReader();
    reader.onload = function(event) {
        try {
            const importedData = JSON.parse(event.target.result);
            // Einfache Validierung, ob das JSON die richtige Struktur hat
            if(importedData && importedData.machines && importedData.materials && importedData.tools) {
                saveData(importedData);
                if(callback) callback(true, "Datenbank erfolgreich importiert!");
            } else {
                if(callback) callback(false, "Fehler: Die Datei hat nicht die richtige Struktur.");
            }
        } catch (e) {
            if(callback) callback(false, "Fehler: Ungültige JSON-Datei.");
        }
    };
    reader.readAsText(file);
}
