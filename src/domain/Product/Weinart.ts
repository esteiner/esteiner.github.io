export class Weinart {
    static Wein        = new Weinart("Wein");
    static Schaumwein  = new Weinart("Schaumwein");
    static Dessertwein = new Weinart("Dessertwein");

    private name: String;

    constructor(name: String) {
        this.name = name;
    }

    public toString() {
        return this.name;
    }

    public equals(weinart: String | undefined): boolean {
        return weinart === undefined || this.toString() === weinart;
    }
}