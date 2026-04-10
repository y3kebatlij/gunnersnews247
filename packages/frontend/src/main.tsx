import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import "@uswds/uswds/css/uswds.css";
import "./styles/arsenal-theme.css";
import "./styles/dark-mode.scss";
import "./styles/responsive.scss";

const root = document.getElementById("root");
if (!root) throw new Error("Root element not found");

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
