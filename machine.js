class MachineManager {
    constructor() {
        this.defaultMachines = [
            { id: 1, name: "DMG Mori CMX 50U", maxRpm: 12000, maxFeed: 30000, power: 13 },
            { id: 2, name: "Haas VF-2", maxRpm: 8100, maxFeed: 16500, power: 22 },
            { id: 3, name: "Mazak Variaxis i-700", maxRpm: 18000, maxFeed: 42000, power: 25 }
        ];
        this.machines = Storage.load("machines", this.defaultMachines);
    }

    getAll() {
        return this.machines;
    }

    add(machine) {
        machine.id = Date.now();
        this.machines.push(machine);
        this.save();
    }

    update(machine) {
        const index = this.machines.findIndex(m => m.id == machine.id);
        if (index !== -1) {
            this.machines[index] = { ...this.machines[index], ...machine };
            this.save();
        }
    }

    remove(id) {
        this.machines = this.machines.filter(m => m.id != id);
        this.save();
    }

    save() {
        Storage.save("machines", this.machines);
    }

    reset() {
        this.machines = [...this.defaultMachines];
        this.save();
    }
}
