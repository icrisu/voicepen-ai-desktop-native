import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { initI18n } from "../shared/i18nSetup";
import "../styles.css";
import "./overlay.css";

initI18n().then(() => {
  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
});
