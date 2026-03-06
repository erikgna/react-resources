import axios from "axios";

// upload/download progress

export const axiosClient = axios.create({
  baseURL: "https://jsonplaceholder.typicode.com",
  timeout: 5000,
  headers: {
    "Content-Type": "application/json",
  },
});

// request interceptor
axiosClient.interceptors.request.use((config) => {
  console.log("Axios Request:", config.url);
  return config;
});

// response interceptor
axiosClient.interceptors.response.use(
  (response) => {
    console.log("Axios Response:", response.status);
    return response.data;
  },
  (error) => {
    console.error("Axios Error:", error.message);
    return Promise.reject(error);
  }
);

axiosClient.interceptors.response.use(null, (error) => {
  if (error.response?.status === 401) {
    // logout();
  }

  return Promise.reject(error);
});