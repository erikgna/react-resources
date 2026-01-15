// The executor (function) is executed immediately by the Promise constructor.

let myPromise = new Promise(function(myResolve, myReject) {
    setTimeout(function() { myResolve("I love You !!"); }, 3000);
  });

// Promise.allSettled() means "Just run all promises. I don't care about the results".

const {promise, resolve, reject} = Promise.withResolvers();

setTimeout(() => {
  const success = Math.random() > 0.5;
  if (success) {
    resolve("Operation successful!");
  } else {
    reject("Operation failed!");
  }
}, 1000);

// Update the UI when the promise finishes
promise
  .then((message) => {
    document.getElementById("demo").innerHTML = message;
  })
  .catch((error) => {
    document.getElementById("demo").innerHTML = error;;
});