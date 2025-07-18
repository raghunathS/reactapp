import React from "react";
import ReactDOM from "react-dom/client";
import { StorageHelper } from "./common/helpers/storage-helper";
import App from "./app";
import { YearFilterProvider } from "./common/contexts/year-filter-context";
import "@cloudscape-design/global-styles/index.css";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

const theme = StorageHelper.getTheme();
StorageHelper.applyTheme(theme);

root.render(
  <React.StrictMode>
    <YearFilterProvider>
      <App />
    </YearFilterProvider>
  </React.StrictMode>
);
