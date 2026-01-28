console.log("=== JSON basics ===");

const jsonText = '{"a":1,"b":2}';

const parsed = JSON.parse(jsonText);
console.log(parsed); // { a: 1, b: 2 }

const stringified = JSON.stringify(parsed);
console.log(stringified); // {"a":1,"b":2}


console.log("\n=== JSON.parse with reviver ===");

const input = '{"createdAt":"2025-01-01T10:00:00.000Z","count":"123"}';

const revived = JSON.parse(input, (key, value) => {
  if (key === "createdAt") {
    return new Date(value);
  }
  if (key === "count") {
    return BigInt(value);
  }
  return value;
});

console.log(revived);
console.log(revived.createdAt instanceof Date); // true
console.log(typeof revived.count); // bigint

console.log("\n=== JSON.stringify with replacer ===");

const data = {
  gross_gdp: 12345678901234567890n,
  country: "BR",
};

// This would normally throw: JSON.stringify(data);

const str = JSON.stringify(data, (key, value) => {
  if (typeof value === "bigint") {
    return value.toString(); // must convert manually
  }
  return value;
});

console.log(str);
// {"gross_gdp":"12345678901234567890","country":"BR"}
// JSON.stringify cannot serialize BigInt unless you transform it

console.log("\n=== JSON.stringify with key whitelist ===");

const user = {
  id: 1,
  email: "test@email.com",
  password: "secret",
};

const safe = JSON.stringify(user, ["id", "email"]);
console.log(safe);
// {"id":1,"email":"test@email.com"}

console.log("\n=== JSON.rawJSON ===");

const raw = JSON.rawJSON('{"x":10,"y":20}');

const wrapped = {
  type: "point",
  value: raw,
};

console.log(JSON.stringify(wrapped));
// {"type":"point","value":{"x":10,"y":20}}


console.log("\n=== Values JSON drops ===");

const weird = {
  a: undefined,
  b: function () {},
  c: Symbol("x"),
  d: 1,
};

console.log(JSON.stringify(weird));
// {"d":1}

console.log("\n=== Circular reference ===");

const a = {};
a.self = a;

try {
  JSON.stringify(a);
} catch (e) {
  console.log("ERROR:", e.message);
}