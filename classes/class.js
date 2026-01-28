console.log("=== Class declaration ===");

class Rectangle {
  #privateField = "This is a private field";

  // Public instance fields (optional syntax)
  height;
  width;

  constructor(height, width) {
    this.height = height;
    this.width = width;
  }

  // Getter (instance)
  get area() {
    return this.calcArea();
  }

  // Method (instance)
  calcArea() {
    return this.height * this.width;
  }

  // Generator method
  *getSides() {
    yield this.height;
    yield this.width;
    yield this.height;
    yield this.width;
  }

  // Static field
  static displayName = "Rectangle";

  // Method accessing private field
  revealSecret() {
    return this.#privateField;
  }
}

const square = new Rectangle(10, 10);

console.log(square.area); // 100
console.log([...square.getSides()]); // [10, 10, 10, 10]
console.log(Rectangle.displayName); // Rectangle
console.log(square.revealSecret()); // This is a private field

// #privateField is lexically scoped
// Accessing it outside the class is a syntax error, not undefined
// Private fields are not properties (they don’t exist on this)

console.log("\n=== Inheritance ===");

class Square extends Rectangle {
  constructor(side) {
    super(side, side); // must call super() first
  }

  // Override method
  calcArea() {
    return this.height ** 2;
  }
}

const sq = new Square(5);

console.log(sq.area); // 25
console.log(sq instanceof Square); // true
console.log(sq instanceof Rectangle); // true

// super() is mandatory before this
// super.method() calls parent methods
// Private fields are NOT inherited

console.log("\n=== Static vs Instance ===");

class Example {
  static staticMethod() {
    return "static";
  }

  instanceMethod() {
    return "instance";
  }
}

const e = new Example();

console.log(Example.staticMethod()); // static
console.log(e.instanceMethod()); // instance

// Static → belongs to the class
// Instance → belongs to objects

console.log("\n=== Getter / Setter ===");

class Person {
  #name;

  constructor(name) {
    this.#name = name;
  }

  get name() {
    return this.#name.toUpperCase();
  }

  set name(value) {
    if (value.length < 2) {
      throw new Error("Name too short");
    }
    this.#name = value;
  }
}

const p = new Person("Erik");
console.log(p.name); // ERIK

p.name = "John";
console.log(p.name); // JOHN

console.log("\n=== Method binding ===");

class Button {
  label = "OK";

  click() {
    console.log(this.label);
  }
}

const btn = new Button();
const handler = btn.click;

// undefined (lost `this`)
try {
  handler();
} catch {}

class SafeButton {
  label = "OK";

  click = () => {
    console.log(this.label);
  };
}

const safeBtn = new SafeButton();
const safeHandler = safeBtn.click;
safeHandler(); // OK

// Arrow methods:
// Bind this lexically
// Cost more memory

console.log("\n=== Class expressions ===");

// Anonymous class
const RectA = class {
  constructor(h, w) {
    this.h = h;
    this.w = w;
  }
};

// Named class expression (name is local only)
const RectB = class RectangleInternal {
  constructor(h, w) {
    this.h = h;
    this.w = w;
  }
};

console.log(RectA.name); // RectA
console.log(RectB.name); // RectangleInternal

// Classes
// strict mode by default which is safer because it prevents accidental global variables
// non-enumerable methods which is more performant because it doesn't pollute the prototype
// no hoisting
// enforced new which is more secure because it prevents accidental instantiation without new