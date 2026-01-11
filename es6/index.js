// Block Scope
{
    let a = 1;
    const b = 2;
}

// Cannot access outside the block
console.log(a);
console.log(b);

// Function Scope
// Global Scope

// Don't have their own this and are not hoisted
const func = () => { }

// Array and object destructuring
const objA = { 'a': 1, 'b': 2, 'c': 3 };
const { a, b, c } = objA;

// Spread operator
// ...

// Maps - the key can be any type
// Insertion order is preserved
// map.set(key, value) can be used to remove duplicates or update values
const map = new Map();
map.set('a', 1);

// Sets - it's the same as Map but:
// the key is the value
// the value is unique
// the order is not preserved
const set = new Set();
set.add(1);

// Classes - It is a template for JavaScript objects
class Car {
    constructor(name, year) {
        this.name = name;
        this.year = year;
    }
}

// Promises
let myPromise = new Promise(function (myResolve, myReject) {
    myResolve("OK");
    myReject("Error");
});

// Symbols - unique and immutable
const person = {
    firstName: "John",
};

let id = Symbol('id');
person[id] = 140353;
// Now person[id] = 140353
// but person.id is still undefined

// Function default parameters
const func1 = (a = 1, b = 2) => {
    return a + b;
}

// Function rest parameters
const func2 = (...args) => {
    return args;
}

// Array
const arr = ['a', 'b', 'c', 'd', 'e'];
// does not change the original array
arr.entries(); // (0: 'a', 1: 'b', 2: 'c', 3: 'd', 4: 'e')

Array.from('Hello World'); // ['H', 'e', 'l', 'l', 'o', ' ', 'W', 'o', 'r', 'l', 'd']

// Object Assign
// Target Object
const person1 = {
    firstName: "John",
    lastName: "Doe"
};
// Source Object
const person2 = { age: 50, eyeColor: "blue" };
// Assign Source to Target
Object.assign(person1, person2); // person1 will be {firstName: "John", lastName: "Doe", age: 50, eyeColor: "blue"}

// Modules 
// Prevent global scope pollution (name conflicts)

// Reflect 
// Reflect is safe and flexible alternative to object handling methods

const obj = { a: 1, b: 2, c: 3 };
Reflect.has(obj, 'a');
Reflect.deleteProperty(obj, 'a');
Reflect.get(obj, 'b');
Reflect.set(obj, 'd', 4);
Reflect.defineProperty(obj, 'e', { value: 5 });
Reflect.apply(() => { }, obj, [1, 2, 3]);

// Proxy
// JavaScript object that can wrap other objects
// Lets you control operations on other objects and can trap and intercept code
// Common use cases:
// 1. Logging
// 2. Validation
// 3. Data transformation
// 4. Access control
// 5. Data filtering

// Example:
const user = { name: "Jan", age: 40 };
const proxy = new Proxy(user, {
    get(target, property) {
        log("Getting: " + property);
        return Reflect.get(target, property);
    },
    set(target, property, value) {
        log("Setting: " + property);
        return Reflect.set(target, property, value);
    }
});