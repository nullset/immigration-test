import { html, render } from "lit-html";
import { autorun } from "mobx";

import Question from "./components/Question";
import Complete from "./components/Complete";
import store from "./store";

import "./index.scss";

const App = store => {
  if (store.toBeAnswered.length > 0) {
    return Question(store);
  } else {
    return Complete(store);
  }
};

autorun(() => {
  render(App(store), document.getElementById("app"));
});
