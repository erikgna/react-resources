// Declaration
class Rectangle {
  #privateField = "This is a private field";

  constructor(height, width) {
    this.height = height;
    this.width = width;
  }

  // Getter
  get area() {
    return this.calcArea();
  }
  // Method
  calcArea() {
    return this.height * this.width;
  }
  *getSides() {
    yield this.height;
    yield this.width;
    yield this.height;
    yield this.width;
  }

  static displayName = "Point";
}

const square = new Rectangle(10, 10);

console.log(square.area); // 100
console.log([...square.getSides()]); // [10, 10, 10, 10]
console.log(Rectangle.displayName); // Point
console.log(square.#privateField); // This is a private field

class Square extends Rectangle {
  constructor(side) {
    super(side, side);
  }
}

// Expression; the class is anonymous but assigned to a variable
const Rectangle = class {
  constructor(height, width) {
    this.height = height;
    this.width = width;
  }
};

// Expression; the class has its own name
const Rectangle = class Rectangle2 {
  constructor(height, width) {
    this.height = height;
    this.width = width;
  }
};

// Kind: Getter, setter, method, or field
// Location: Static or instance
// Visibility: Public or private