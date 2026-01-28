console.log("=== Shadowing Object.prototype methods ===");

const obj = {
  foo: 1,
  // This shadows Object.prototype.propertyIsEnumerable
  propertyIsEnumerable() {
    return false;
  },
};

console.log(obj.propertyIsEnumerable("foo")); 
// false → unexpected, because you overrode the method

// Safe way: always call the original method explicitly
console.log(
  Object.prototype.propertyIsEnumerable.call(obj, "foo")
); // true

// When dealing with objects from external input, never trust instance methods.

console.log("\n=== Prototypes ===");

const normalObj = {};
const nullProtoObj = Object.create(null);
const obj2 = { __proto__: null };

console.log("normalObj:", normalObj);
console.log("nullProtoObj:", nullProtoObj);
console.log("obj2:", obj2);

console.log("\n--- valueOf ---");
console.log(normalObj.valueOf()); // {}

try {
  nullProtoObj.valueOf();
} catch (e) {
  console.log("nullProtoObj.valueOf ERROR:", e.message);
}

console.log("\n--- hasOwnProperty ---");
console.log(
  Object.prototype.hasOwnProperty.call(normalObj, "p")
); // false

console.log(
  Object.prototype.hasOwnProperty.call(nullProtoObj, "p")
); // false

// ❌ This throws, because method doesn't exist
try {
  nullProtoObj.hasOwnProperty("p");
} catch (e) {
  console.log("nullProtoObj.hasOwnProperty ERROR:", e.message);
}

// Why null-prototype objects matter

// immune to prototype pollution
// common in security-sensitive code

console.log("\n=== Enumerability ===");

const enumObj = {};

Object.defineProperty(enumObj, "visible", {
  value: 123,
  enumerable: true,
});

Object.defineProperty(enumObj, "hidden", {
  value: 456,
  enumerable: false,
});

console.log("Object.keys:", Object.keys(enumObj)); // ["visible"]
console.log("Object.values:", Object.values(enumObj)); // [123]
console.log("Object.entries:", Object.entries(enumObj)); // [["visible", 123]]

console.log("hidden in obj:", "hidden" in enumObj); // true

console.log("\n=== Property Descriptors ===");

const user = {};

Object.defineProperty(user, "id", {
  value: 1,
  writable: false,
  enumerable: true,
  configurable: false,
});

console.log(user.id); // 1

user.id = 2; // silently ignored (or throws in strict mode)
console.log(user.id); // still 1

console.log(
  Object.getOwnPropertyDescriptor(user, "id")
);

console.log("\n=== Object immutability ===");

const a = { x: 1 };
Object.freeze(a);

a.x = 2;      // ignored
delete a.x;   // ignored
a.y = 3;      // ignored

console.log(a); // { x: 1 }
console.log(Object.isFrozen(a)); // true

const b = { x: 1 };
Object.seal(b);

b.x = 2;      // allowed
delete b.x;   // ignored
b.y = 3;      // ignored

console.log(b); // { x: 2 }

const c = { x: 1 };
Object.preventExtensions(c);

c.y = 2; // ignored
console.log(c); // { x: 1 }

console.log("\n=== Object.assign ===");

const target = { a: 1 };
const source = { b: 2, c: 3 };

const result = Object.assign(target, source);

console.log(result); // { a: 1, b: 2, c: 3 }
console.log(target === result); // true (mutates target)

// Nested objects are still shared

console.log("\n=== fromEntries ===");

const entries = [
  ["a", 1],
  ["b", 2],
];

const objFromEntries = Object.fromEntries(entries);
console.log(objFromEntries); // { a: 1, b: 2 }

console.log("\n=== groupBy ===");

const people = [
  { name: "Ana", age: 20 },
  { name: "Bob", age: 30 },
  { name: "Carol", age: 20 },
];

const grouped = Object.groupBy(people, p => p.age);
console.log(grouped);
/*
{
  "20": [{...}, {...}],
  "30": [{...}]
}
*/

console.log("\n=== Safe property checks ===");

const data = Object.create(null);
data.x = 1;

console.log(Object.hasOwn(data, "x")); // true
console.log(Object.hasOwn(data, "toString")); // false