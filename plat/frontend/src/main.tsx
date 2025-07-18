import React from "react";
import ReactDOM from "react-dom/client";
import { StorageHelper } from "./common/helpers/storage-helper";
import App from "./app";
import { GlobalFilterProvider } from './common/contexts/GlobalFilterContext';
import "@cloudscape-design/global-styles/index.css";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

const theme = StorageHelper.getTheme();
StorageHelper.applyTheme(theme);

root.render(
  <React.StrictMode>
    <GlobalFilterProvider>
      <App />
    </GlobalFilterProvider>
  </React.StrictMode>
);
