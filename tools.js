class ToolsManager {
    constructor() {
        this.defaultTools = [
            { id: 1, name: "VHM Schaftfräser 10mm", type: "Fräser", diameter: 10, teeth: 4 },
            { id: 2, name: "VHM Schaftfräser 6mm", type: "Fräser", diameter: 6, teeth: 3 },
            { id: 3, name: "NC-Anbohrer 90°", type: "Bohrer", diameter: 8, teeth: 2 },
            { id: 4, name: "HSS Spiralbohrer 8.5mm", type: "Bohrer", diameter: 8.5, teeth: 2 }
        ];
        this.tools = Storage.load("tools", this.defaultTools);
    }

    getAll() {
        return this.tools;
    }

    add(tool) {
        tool.id = Date.now();
        this.tools.push(tool);
        this.save();
    }

    update(tool) {
        const index = this.tools.findIndex(t => t.id == tool.id);
        if (index !== -1) {
            this.tools[index] = { ...this.tools[index], ...tool };
            this.save();
        }
    }

    remove(id) {
        this.tools = this.tools.filter(t => t.id != id);
        this.save();
    }

    save() {
        Storage.save("tools", this.tools);
    }

    reset() {
        this.tools = [...this.defaultTools];
        this.save();
    }
}
