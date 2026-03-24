import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";

// Prevent unhandled promise rejection popups — errors are shown via toast
window.addEventListener("unhandledrejection", (e) => {
  e.preventDefault();
});

const elem = document.getElementById("root")!;
const app = (
  <StrictMode>
    <App />
  </StrictMode>
);

if (import.meta.hot) {
  const root = (import.meta.hot.data.root ??= createRoot(elem));
  root.render(app);
} else {
  createRoot(elem).render(app);
}
