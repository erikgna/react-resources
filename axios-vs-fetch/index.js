import axios from "axios";

const API_URL = "https://jsonplaceholder.typicode.com/posts";

// GET

// Fetch
async function fetchGet() {
    try {
        const response = await fetch(API_URL);

        // fetch does NOT throw on HTTP errors
        if (!response.ok) throw new Error(`HTTP error: ${response.status}`);

        const data = await response.json();
        console.log("Fetch GET:", data.slice(0, 2));
    } catch (error) {
        console.error("Fetch GET Error:", error.message);
    }
}

// Axios
async function axiosGet() {
    try {
        const response = await axios.get(API_URL);

        // Axios automatically parses JSON
        console.log("Axios GET:", response.data.slice(0, 2));
    } catch (error) {
        console.error("Axios GET Error:", error.message);
    }
}

// POST

const newPost = {
    title: "Hello",
    body: "Testing request",
    userId: 1,
};

// Fetch
async function fetchPost() {
    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newPost),
        });

        const data = await response.json();
        console.log("Fetch POST:", data);
    } catch (error) {
        console.error("Fetch POST Error:", error.message);
    }
}

// Axios
async function axiosPost() {
    try {
        const response = await axios.post(API_URL, newPost);
        console.log("Axios POST:", response.data);
    } catch (error) {
        console.error("Axios POST Error:", error.message);
    }
}

// TIMEOUT

// Fetch requires AbortController
async function fetchWithTimeout() {
    const controller = new AbortController();

    setTimeout(() => controller.abort(), 3000);

    try {
        const response = await fetch(API_URL, { signal: controller.signal });

        const data = await response.json();
        console.log("Fetch Timeout Example:", data.length);
    } catch (error) {
        console.error("Fetch Timeout Error:", error.name);
    }
}

// Axios has built-in timeout
async function axiosWithTimeout() {
    try {
        const response = await axios.get(API_URL, { timeout: 3000 });

        console.log("Axios Timeout Example:", response.data.length);
    } catch (error) {
        console.error("Axios Timeout Error:", error.message);
    }
}

// INTERCEPTORS / MIDDLEWARE

// Axios supports interceptors natively
axios.interceptors.request.use((config) => {
    console.log("Axios Request Interceptor");
    config.headers["X-Custom-Header"] = "InterceptorExample";
    return config;
});

axios.interceptors.response.use((response) => {
    console.log("Axios Response Interceptor");
    return response;
});

// Fetch wrapper to simulate interceptors

async function fetchWithMiddleware(url, options = {}) {
    console.log("Fetch Request Middleware");

    const response = await fetch(url, {
        ...options,
        headers: {
            ...(options.headers || {}),
            "X-Custom-Header": "MiddlewareExample",
        },
    });

    console.log("Fetch Response Middleware");

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    return response.json();
}

/*
Differences

Fetch
- Built into browsers and modern Node
- Requires manual JSON parsing
- Does NOT reject on HTTP errors
- Needs AbortController for timeout
- No built-in interceptors

Axios
- External dependency
- Automatically parses JSON
- Rejects promise on HTTP errors
- Built-in timeout support
- Built-in request/response interceptors

*/

/*
Support

- Fetch is built into browsers and modern NodeJS, but not in NodeJS older than 18 and very old browsers. React Native partially supports Fetch.
- Axios is supported in all browsers and NodeJS versions.
*/

/*
Axios use XMLHttpRequest under the hood in the browser, while Fetch uses the Fetch API in the browser and NodeJS.
XMLHttpRequest is a built-in browser API for making HTTP requests. It is supported in all browsers.
Axios in Node uses the natives Node HTTP modules.
*/

/*
Axios bundle is 20kb, while Fetch is 0kb (native).
*/