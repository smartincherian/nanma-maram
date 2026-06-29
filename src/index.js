import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";

// react-easy-crop and some MUI components observe element size via
// ResizeObserver. When such a callback also changes layout, Chrome raises a
// benign "ResizeObserver loop ..." notice — nothing is broken, the browser just
// retries delivery next frame — but webpack-dev-server's overlay treats it as a
// fatal runtime error. Running each callback inside requestAnimationFrame breaks
// the synchronous re-layout loop, so the notice is never raised (dev or prod).
if (typeof window !== "undefined" && window.ResizeObserver) {
  const NativeResizeObserver = window.ResizeObserver;
  window.ResizeObserver = class extends NativeResizeObserver {
    constructor(callback) {
      super((entries, observer) => {
        window.requestAnimationFrame(() => callback(entries, observer));
      });
    }
  };
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
