import { html, render } from "lit-html";
import { ifDefined } from "lit-html/directives/if-defined";
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
    this.open = false;
  }

  markAsCorrect(item) {
    runInAction(() => {
      item.correct = item.correct + 1;
      this.toggleOpen();
      this.nextPass();
    });
  }

  markAsIncorrect(item) {
    runInAction(() => {
      item.incorrect = item.incorrect + 1;
      item.pass = item.pass + 1;
      this.toggleOpen();
      this.nextPass();
    });
  }

  nextPass() {
    if (this.toBeAnswered.length === 0 && this.incorrect.length > 0) {
      this.pass = this.pass + 1;
    }
  }

  toggleOpen() {
    runInAction(() => {
      this.open = !this.open;
    });
  }

  reset() {
    runInAction(() => {
      this.questions.forEach(q => {
        q.pass = 0;
        q.correct = 0;
        q.incorrect = 0;
      });
      debugger;
      this.pass = 0;
    });
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
  get notIncorrect() {
    return this.questions.filter(item => item.correct && !item.incorrect);
  }
  get mostDifficultQuestions() {
    return this.questions.filter(item => {
      return item.incorrect && item.pass === this.pass - 1;
    });
  }

  get percentCorrect() {
    return `${Math.floor(
      (this.notIncorrect.length / this.questions.length) * 100
    )}%`;
  }
}

decorate(Store, {
  questions: observable,
  pass: observable,
  open: observable,
  // index: observable,
  toBeAnswered: computed,
  currentQuestion: computed,
  correct: computed,
  incorrect: computed,
  notIncorrect: computed,
  mostDifficultQuestions: computed,
  percentCorrect: computed
});

const App = store => {
  // console.log("incorrect", store.questions.filter(item => item.incorrect));
  // console.log("data", store.questions);
  // const current = store.currentQuestion;
  // console.log(store.questions);
  // if (current) {
  if (store.toBeAnswered.length > 0) {
    const idx = randomInRange(0, store.toBeAnswered.length);
    const current = store.toBeAnswered[idx];
    return html`
      <p>correct: ${store.correct.length}</p>
      <p>incorrect: ${store.incorrect.length}</p>
      <p>index: ${current.id}</p>
      <p>pass: ${store.pass}</p>
      <p>open: ${store.open}</p>
      <details ?open=${store.open}>
        <summary
          @click=${e => {
            e.preventDefault();
            store.toggleOpen();
          }}
          >${current.question}</summary
        >
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
      <footer>
        <dl>
          <dt>Correct:</dt>
          <dd>
            <progress
              value=${store.correct.length}
              max=${store.questions.length}
              >${store.percentCorrect}
            </progress>
            ${store.percentCorrect}
          </dd>
        </dl>
      </footer>
    `;
  } else {
    console.log(toJS(store));
    return html`
      <div>
        <h1>Complete!</h1>
        <dl>
          <dt>Questions missed:</dt>
          <dd>${store.incorrect.length} of ${store.questions.length}</dd>
          <dd>${store.percentCorrect} correct</dd>
          <dt>Questions most missed:</dt>
          ${store.mostDifficultQuestions.map(item => {
            return html`
              <dd>
                <dl>
                  <dt>${item.question}</dt>
                  ${item.answers.map(answer => {
                    return html`
                      <dd>${answer}</dd>
                    `;
                  })}
                </dl>
              </dd>
            `;
          })}
        </dl>
        <button @click=${() => store.reset()}>Retake the test</button>
      </div>
    `;
  }
};

// states.map(function(state) {
//   // document.write("<pre>" + JSON.stringify(state, null, 2) + "</pre>");
//   render(myTemplate(state), document.body);
// });

// states.map(state => render(App(state, actions), document.body));

const store = (window.store = new Store({ questions: kv }));

autorun(() => {
  render(App(store), document.getElementById("app"));
});
