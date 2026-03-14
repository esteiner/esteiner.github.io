export class Weinfarbe {
    static Rot        = new Weinfarbe("rot");
    static Weiss  = new Weinfarbe("weiss");
    static Rose = new Weinfarbe("rose");

    private name: String;

    constructor(name: String) {
        this.name = name;
    }

    public toString() {
        return this.name;
    }

    public equals(weinfarbe: String | undefined): boolean {
        return weinfarbe === undefined || this.toString() === weinfarbe;
    }
}