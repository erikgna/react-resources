class Queue {
    constructor() {
      // We use an object instead of an array to avoid costly array operations like shift()
      // The object will store items using numeric keys: {0: value, 1: value, ...}
      this.items = {};
  
      // head points to the index of the next element to be removed (front of the queue)
      this.head = 0;
  
      // tail points to the position where the next element will be inserted (end of the queue)
      this.tail = 0;
    }
  
    enqueue(element) {
      // Add the new element at the current tail position
      this.items[this.tail] = element;
  
      // Move the tail forward to the next empty position
      this.tail++;
    }
  
    dequeue() {
      // If the queue is empty, return null
      if (this.isEmpty()) return null;
  
      // Get the element at the front of the queue
      const item = this.items[this.head];
  
      // Remove the element from the object to free memory
      delete this.items[this.head];
  
      // Move the head forward to the next element
      this.head++;
  
      // Return the removed element
      return item;
    }
  
    peek() {
      // Return the element at the front of the queue without removing it
      return this.items[this.head];
    }
  
    isEmpty() {
      // The queue is empty if its size is zero
      return this.size() === 0;
    }
  
    size() {
      // The number of elements is the distance between tail and head
      // Example:
      // head = 2
      // tail = 5
      // elements = 3 (positions 2,3,4)
      return this.tail - this.head;
    }
  }