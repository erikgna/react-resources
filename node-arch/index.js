const eventQueue = [];

function eventLoop() {
  while (eventQueue.length > 0) {
    const event = eventQueue.shift();

    console.log(`\nEvent Loop picked: ${event.type}`);

    if (event.type === "NON_BLOCKING") {
      console.log("Handling non-blocking task");
    }

    if (event.type === "BLOCKING") {
      console.log("Delegating blocking task");

      blockingOperation(() => {
        eventQueue.push({ type: "BLOCKING_DONE" });
      });
    }

    if (event.type === "BLOCKING_DONE") {
      console.log("Blocking task completed (back in Event Loop)");
    }
  }

  console.log("\nEvent Loop empty");
}

function blockingOperation(callback) {
  console.log("External resource working...");

  setTimeout(() => {
    console.log("External resource finished");
    callback();
  }, 3000);
}

eventQueue.push({ type: "BLOCKING" });
eventQueue.push({ type: "NON_BLOCKING" });

eventLoop();

// RESULT:

// Event Loop picked: BLOCKING
// Delegating blocking task
// External resource working...

// Event Loop picked: NON_BLOCKING
// Handling non-blocking task

// Event Loop empty
// After 3 seconds:
// External resource finished