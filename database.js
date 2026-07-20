// database.js
// Enthält das Standard-Datenset für das CNC Assistenzsystem

export const defaultData = {
    machines: [
        { id: "mach_1", name: "DMG Mori CMX 50 U", maxRpm: 12000, maxFeed: 30000, powerKw: 13 },
        { id: "mach_2", name: "Haas VF-2SS", maxRpm: 12000, maxFeed: 21000, powerKw: 22 },
        { id: "mach_3", name: "Hermle C400", maxRpm: 18000, maxFeed: 35000, powerKw: 20 },
        { id: "mach_4", name: "Datron neo (HSC)", maxRpm: 40000, maxFeed: 10000, powerKw: 2 }
    ],
    materials: [
        { id: "mat_1", name: "1.0037 (S235JR / Baustahl)", isoGroup: "P", vc: 250 },
        { id: "mat_2", name: "1.2379 (X153CrMoV12)", isoGroup: "P", vc: 120 },
        { id: "mat_3", name: "1.4301 (V2A / X5CrNi18-10)", isoGroup: "M", vc: 100 },
        { id: "mat_4", name: "1.4404 (V4A)", isoGroup: "M", vc: 80 },
        { id: "mat_5", name: "EN-GJS-400-15 (GGG40)", isoGroup: "K", vc: 200 },
        { id: "mat_6", name: "EN AW-7075 (AlZnMgCu1,5)", isoGroup: "N", vc: 600 },
        { id: "mat_7", name: "Ti6Al4V (Titan Grade 5)", isoGroup: "S", vc: 50 },
        { id: "mat_8", name: "Hardox 500 (Gehärtet)", isoGroup: "H", vc: 40 }
    ],
    categories: [
        { id: "cat_1", name: "Schaftfräser" },
        { id: "cat_2", name: "Messerkopf" },
        { id: "cat_3", name: "Hochvorschubfräser" },
        { id: "cat_4", name: "Bohrer" }
    ],
    tools: [
        { id: "tool_1", name: "VHM Schaftfräser D10", manufacturer: "Garant", categoryId: "cat_1", d: 10, z: 4, imageUrl: "https://via.placeholder.com/150?text=Schaftfräser+D10" },
        { id: "tool_2", name: "VHM Alu-Fräser D12", manufacturer: "Hoffmann", categoryId: "cat_1", d: 12, z: 3, imageUrl: "https://via.placeholder.com/150/2ecc71/ffffff?text=Alu+Fräser+D12" },
        { id: "tool_3", name: "CoroMill 390 D50", manufacturer: "Sandvik", categoryId: "cat_2", d: 50, z: 5, imageUrl: "https://via.placeholder.com/150/0984e3/ffffff?text=Messerkopf+D50" },
        { id: "tool_4", name: "HighFeed D20", manufacturer: "Iscar", categoryId: "cat_3", d: 20, z: 3, imageUrl: "https://via.placeholder.com/150/e74c3c/ffffff?text=HFC+D20" }
    ],
    profiles: [
        { id: "prof_1", name: "Schruppen (Vollnut)", aeType: "percent", aeValue: 100, fz: 0.08 },
        { id: "prof_2", name: "Schruppen (Besäumen)", aeType: "percent", aeValue: 40, fz: 0.1 },
        { id: "prof_3", name: "Schlichten (Seite)", aeType: "fixed", aeValue: 0.2, fz: 0.05 },
        { id: "prof_4", name: "Trochoidal (HPC)", aeType: "percent", aeValue: 15, fz: 0.15 },
        { id: "prof_5", name: "Bohren", aeType: "percent", aeValue: 100, fz: 0.12 }
    ]
};
