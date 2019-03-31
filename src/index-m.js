import { html, render } from "lit-html";
import flyd from "flyd";

import data from "./data";
import { randomInRange } from "./utils";

const kv = data.reduce((acc, item) => {
  item.incorrect = 0;
  item.correct = 0;
  acc.push(item);
  return acc;
}, []);

var store = {
  initialState: {
    questions: kv,
    get toBeAnswered() {
      return this.questions.filter(item => item.correct === 0);
    },
    get current() {
      const availableQuestions = this.toBeAnswered;
      const idx = randomInRange(0, availableQuestions.length);
      return availableQuestions[idx];
    }
  },
  actions: function(update) {
    return {
      markAsCorrect: function(idx) {
        console.log(idx);
        update(function(state) {
          state.questions[idx].correct = state.questions[idx].correct + 1;
          return state;
        });
      },
      markAsIncorrect: function(idx) {
        console.log(idx);
        update(function(state) {
          state.questions[idx].incorrect = state.questions[idx].incorrect + 1;
          return state;
        });
      }
    };
  }
};

var update = flyd.stream();
var states = flyd.scan(
  function(state, patch) {
    return patch(state);
  },
  store.initialState,
  update
);

var actions = store.actions(update);

const App = (state, actions) => {
  console.log("correct", state.questions.filter(item => item.correct));
  console.log("incorrect", state.questions.filter(item => item.incorrect));
  console.log("data", state.questions);
  const current = state.current;
  return html`
    <details>
      <summary>${current.question}</summary>
      <div>
        <ul>
          ${current.answers.map(answer => {
            return html`
              <li>${answer}</li>
            `;
          })}
        </ul>
        <button @click=${() => actions.markAsCorrect(current.id)}>
          Correct
        </button>
        <button @click=${() => actions.markAsIncorrect(current.id)}>
          Incorrect
        </button>
      </div>
    </details>
  `;
};

// states.map(function(state) {
//   // document.write("<pre>" + JSON.stringify(state, null, 2) + "</pre>");
//   render(myTemplate(state), document.body);
// });

states.map(state => render(App(state, actions), document.body));
