import { html, render } from "lit-html";

const Question = store => {
  const current = store.currentQuestion;
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
          <progress value=${store.correct.length} max=${store.questions.length}
            >${store.percentCorrect}
          </progress>
          ${store.percentCorrect}
        </dd>
      </dl>
    </footer>
  `;
};

export default Question;
