JSON.isRawJSON()
// Tests whether a value is an object returned by JSON.rawJSON().

JSON.parse()
// Parse a piece of string text as JSON, optionally transforming the produced value and its properties, and return the value.

JSON.rawJSON()
// Creates a "raw JSON" object containing a piece of JSON text. When serialized to JSON, the raw JSON object is treated as if it is already a piece of JSON. This text is required to be valid JSON.

JSON.stringify()

const data = {
    // Using a BigInt here to store the exact value,
    // but it can also be a custom high-precision number library,
    // if the number might not be an integer.
    gross_gdp: 12345678901234567890n,
};

BigInt.prototype.toJSON = function () {
    return this.toString();
};
const str1 = JSON.stringify(data);

// Using JSON.stringify() with replacer
const str2 = JSON.stringify(data, (key, value) => {
    if (key === "gross_gdp") {
        return value.toString();
    }
    return value;
});