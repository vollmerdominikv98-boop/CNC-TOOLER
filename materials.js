class MaterialsManager {
    constructor() {
        this.defaultMaterials = [
            { id: 1, name: "Aluminium (AlCuMg)", iso: "N", kc11: 700, defaultVc: 350 },
            { id: 2, name: "Baustahl (S235JR)", iso: "P", kc11: 1500, defaultVc: 200 },
            { id: 3, name: "Edelstahl (1.4301)", iso: "M", kc11: 2100, defaultVc: 120 },
            { id: 4, name: "Grauguss (GJL-250)", iso: "K", kc11: 1100, defaultVc: 180 },
            { id: 5, name: "Titan (Ti6Al4V)", iso: "S", kc11: 2800, defaultVc: 60 }
        ];
        this.materials = Storage.load("materials", this.defaultMaterials);
    }

    getAll() {
        return this.materials;
    }

    add(material) {
        material.id = Date.now();
        this.materials.push(material);
        this.save();
    }

    update(material) {
        const index = this.materials.findIndex(m => m.id == material.id);
        if (index !== -1) {
            this.materials[index] = { ...this.materials[index], ...material };
            this.save();
        }
    }

    remove(id) {
        this.materials = this.materials.filter(m => m.id != id);
        this.save();
    }

    save() {
        Storage.save("materials", this.materials);
    }

    reset() {
        this.materials = [...this.defaultMaterials];
        this.save();
    }
}
