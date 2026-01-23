const years = [1990, 1991, 1992, 1993, 1994, 1995];

console.log(years['1']);
console.log(years['01']);

console.log(years.push(1996));

years[10] = '2020';

console.log(years);
console.log(years.length);

years.pop(); // removes the last element of the array
console.log(years);
console.log(years.length);

years.shift(); // removes the first element of the array
console.log(years);
console.log(years.length);

years.unshift(1990); // adds to the beginning of the array
console.log(years);

years.length = 20;
console.log(years);
console.log(years.length);

years.length = 2;
console.log(years);
console.log(years.length);

const iterator = years.keys();
console.log(iterator)

// The following table lists the methods that mutate the original array, and the corresponding non-mutating alternative:

// Mutating method	Non-mutating alternative
// copyWithin()	No one-method alternative
// fill()	No one-method alternative
// pop()	slice(0, -1)
// push(v1, v2)	concat([v1, v2])
// reverse()	toReversed()
// shift()	slice(1)
// sort()	toSorted()
// splice()	toSpliced()
// unshift(v1, v2)	toSpliced(0, 0, v1, v2)

// An easy way to change a mutating method into a non-mutating alternative is to use the spread syntax or slice() to create a copy first:

arr.copyWithin(0, 1, 2); // mutates arr
const arr2 = arr.slice().copyWithin(0, 1, 2); // does not mutate arr
const arr3 = [...arr].copyWithin(0, 1, 2);