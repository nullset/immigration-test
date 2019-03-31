import { html, render } from "lit-html";
import {
  observable,
  computed,
  action,
  autorun,
  decorate,
  runInAction,
  toJS
} from "mobx";

import data from "./data";
import { randomInRange } from "./utils";

const kv = data.reduce((acc, item) => {
  item.incorrect = 0;
  item.correct = 0;
  item.pass = 0;
  acc.push(item);
  return acc;
}, []);

class Store {
  constructor(initState) {
    this.questions = initState.questions;
    this.pass = 0;
  }

  markAsCorrect(item) {
    runInAction(() => {
      item.correct = item.correct + 1;
      this.nextPass();
    });
  }

  markAsIncorrect(item) {
    runInAction(() => {
      item.incorrect = item.incorrect + 1;
      item.pass = item.pass + 1;
      this.nextPass();
    });
  }

  nextPass() {
    if (this.toBeAnswered.length === 0 && this.incorrect.length > 0) {
      this.pass = this.pass + 1;
    }
  }

  get toBeAnswered() {
    return this.questions.filter(item => {
      // debugger;
      return item.correct === 0 && item.pass <= this.pass;
    });
  }

  get currentQuestion() {
    const newIdx = randomInRange(0, this.toBeAnswered.length);
    return this.toBeAnswered[newIdx];
  }
  get correct() {
    return this.questions.filter(item => item.correct);
  }
  get incorrect() {
    return this.questions.filter(item => item.incorrect);
  }
  get mostDifficultQuestions() {
    return this.questions.filter(
      item => item.incorrect && item.pass === this.pass
    );
  }
}

decorate(Store, {
  questions: observable,
  pass: observable,
  // index: observable,
  toBeAnswered: computed,
  currentQuestion: computed,
  correct: computed,
  incorrect: computed,
  mostDifficultQuestions: computed
});

const App = store => {
  // console.log("incorrect", store.questions.filter(item => item.incorrect));
  // console.log("data", store.questions);
  // const current = store.currentQuestion;
  // console.log(store.questions);
  // if (current) {
  console.log(store.questions);
  if (store.toBeAnswered.length > 0) {
    console.log("toBeAnswered", store.toBeAnswered);
    const idx = randomInRange(0, store.toBeAnswered.length);
    const current = store.toBeAnswered[idx];
    return html`
      <p>correct: ${store.correct.length}</p>
      <p>incorrect: ${store.incorrect.length}</p>
      <p>index: ${current.id}</p>
      <p>pass: ${store.pass}</p>
      <details open>
        <summary>${current.question}</summary>
        <div>
          <ul>
            ${current.answers.map(answer => {
              return html`
                <li>${answer}</li>
              `;
            })}
          </ul>
          <button @click=${() => store.markAsCorrect(current)}>
            Correct
          </button>
          <button @click=${() => store.markAsIncorrect(current)}>
            Incorrect
          </button>
        </div>
      </details>
    `;
  } else {
    console.log(toJS(store));
    debugger;
    return html`
      <div>
        <h1>Complete!</h1>
        <dl>
          <dt>Questions missed:</dt>
          <dd>${store.incorrect.length}</dd>
          <dt>Questions most missed:</dt>
          ${store.mostDifficultQuestions.map(item => {
            return html`
              <dd>
                <dl>
                  <dt>${item.question}</dt>
                  <dd>${item.answer}</dd>
                </dl>
              </dd>
            `;
          })}
        </dl>
      </div>
    `;
  }
};

// states.map(function(state) {
//   // document.write("<pre>" + JSON.stringify(state, null, 2) + "</pre>");
//   render(myTemplate(state), document.body);
// });

// states.map(state => render(App(state, actions), document.body));

const store = new Store({ questions: kv });

autorun(() => {
  render(App(store), document.getElementById("app"));
});

console.error("3 options, incorrect, incorrect, correct => DONE ???");
