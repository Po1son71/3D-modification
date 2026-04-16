import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { store } from "./store/index";
import App from "./App";
import './index.css'

document.body.style.margin = '0';
document.body.style.padding = '0';
document.body.style.overflow = 'hidden';

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);
