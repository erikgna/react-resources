import React from "react";
import ReactDOM from "react-dom/client";
import { SWRConfig } from "swr";
import App from "./App";
import { fetcher } from "./api";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <SWRConfig
    value={{
      fetcher,
      onErrorRetry: (error, key, config, revalidate, { retryCount }) => {
        if (retryCount >= 3) return;
        setTimeout(() => revalidate({ retryCount }), 2000);
      },
    }}
  >
    <App />
  </SWRConfig>,
);
