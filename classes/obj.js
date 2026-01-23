const obj = {
    foo: 1,
    // You should not define such a method on your own object,
    // but you may not be able to prevent it from happening if
    // you are receiving the object from external input
    propertyIsEnumerable() {
        return false;
    },
};

obj.propertyIsEnumerable("foo"); // false; unexpected result
Object.prototype.propertyIsEnumerable.call(obj, "foo")

const normalObj = {};
const nullProtoObj = Object.create(null);
const obj2 = { __proto__: null };
console.log(nullProtoObj);
console.log(obj2);

normalObj.valueOf(); // shows {}
nullProtoObj.valueOf(); // throws error: nullProtoObj.valueOf is not a function

normalObj.hasOwnProperty("p"); // shows "true"
nullProtoObj.hasOwnProperty("p"); // throws error: nullProtoObj.hasOwnProperty is not a function

Object.assign()
// Copies the values of all enumerable own properties from one or more source objects to a target object.

Object.create()
// Creates a new object with the specified prototype object and properties.

Object.defineProperties()
// Adds the named properties described by the given descriptors to an object.

Object.defineProperty()
// Adds the named property described by a given descriptor to an object.

Object.entries()
// Returns an array containing all of the [key, value] pairs of a given object's own enumerable string properties.

Object.freeze()
// Freezes an object. Other code cannot delete or change its properties.

Object.fromEntries()
// Returns a new object from an iterable of [key, value] pairs. (This is the reverse of Object.entries).

Object.getOwnPropertyDescriptor()
// Returns a property descriptor for a named property on an object.

Object.getOwnPropertyDescriptors()
// Returns an object containing all own property descriptors for an object.

Object.getOwnPropertyNames()
// Returns an array containing the names of all of the given object's own enumerable and non-enumerable properties.

Object.getOwnPropertySymbols()
// Returns an array of all symbol properties found directly upon a given object.

Object.getPrototypeOf()
// Returns the prototype (internal [[Prototype]] property) of the specified object.

Object.groupBy()
// Groups the elements of a given iterable according to the string values returned by a provided callback function. The returned object has separate properties for each group, containing arrays with the elements in the group.

Object.hasOwn()
// Returns true if the specified object has the indicated property as its own property, or false if the property is inherited or does not exist.

Object.is()
// Compares if two values are the same value. Equates all NaN values (which differs from both IsLooselyEqual used by == and IsStrictlyEqual used by ===).

Object.isExtensible()
// Determines if extending of an object is allowed.

Object.isFrozen()
// Determines if an object was frozen.

Object.isSealed()
// Determines if an object is sealed.

Object.keys()
// Returns an array containing the names of all of the given object's own enumerable string properties.

Object.preventExtensions()
// Prevents any extensions of an object.

Object.seal()
// Prevents other code from deleting properties of an object.

Object.setPrototypeOf()
// Sets the object's prototype (its internal [[Prototype]] property).

Object.values()
// Returns an array containing the values that correspond to all of a given object's own enumerable string properties.