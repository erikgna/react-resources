console.log("=== Arrays are objects ===");

const years = [1990, 1991, 1992, 1993, 1994, 1995];

console.log(years["1"]);  // 1991
console.log(years["01"]); // undefined

console.log("\n=== push ===");

console.log(years.push(1996)); // returns new length
console.log(years);
console.log(years.length);

console.log("\n=== pop ===");

years.pop(); // removes last element
console.log(years);
console.log(years.length);

console.log("\n=== shift ===");

years.shift(); // removes first element (O(n))
console.log(years);
console.log(years.length);

console.log("\n=== unshift ===");

years.unshift(1990); // adds to beginning (O(n))
console.log(years);

// push / pop → fast
// shift / unshift → slow (reindexing)

console.log("\n=== Sparse arrays ===");

years[10] = "2020";

console.log(years);
console.log(years.length); // 11

console.log(0 in years); // true
console.log(5 in years); // true
console.log(6 in years); // false (hole)
console.log(9 in years); // false (hole)
console.log(10 in years); // true

// Holes ≠ undefined
// Many array methods skip holes

console.log("\n=== Manually setting length ===");

years.length = 20;
console.log(years);
console.log(years.length);

years.length = 2;
console.log(years);
console.log(years.length);

console.log("\n=== Iterators ===");

const iterator = years.keys();
console.log(iterator); // Array Iterator {}

console.log([...iterator]); // [0, 1]

console.log([...years.values()]);
console.log([...years.entries()]);

console.log("\n=== Iteration behavior ===");

const sparse = [1, , 3];

console.log("for loop:");
for (let i = 0; i < sparse.length; i++) {
  console.log(i, sparse[i]);
}

console.log("forEach:");
sparse.forEach(v => console.log(v));

console.log("map:");
console.log(sparse.map(v => v * 2));

// for → sees holes as undefined
// forEach → skips holes
// map → preserves holes

console.log("\n=== Mutating vs non-mutating ===");

const arr = [1, 2, 3];

arr.push(4);
console.log(arr); // mutated

const arr2 = arr.concat(5);
console.log(arr);  // unchanged
console.log(arr2); // new array

console.log("\n=== Copy-first pattern ===");

const base = [1, 2, 3, 4];

const mut1 = base.slice().copyWithin(0, 1, 2);
const mut2 = [...base].copyWithin(0, 1, 2);

console.log("base:", base);
console.log("mut1:", mut1);
console.log("mut2:", mut2);