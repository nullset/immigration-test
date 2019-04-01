import { html, render } from "lit-html";
import { unsafeHTML } from "lit-html/directives/unsafe-html";

const Question = store => {
  const current = store.currentQuestion;
  return html`
    <header>
      <progress value=${store.correct.length} max=${store.questions.length}
        >${store.percentCorrect}%
      </progress>
      <div>${store.percentCorrect}%</div>
    </header>
    <main>
      <details ?open=${store.open}>
        <summary
          @click=${e => {
            e.preventDefault();
            if (!store.open) {
              store.toggleOpen();
            }
          }}
        >
          <div class="question card">
            ${unsafeHTML(current.question)}
          </div>
        </summary>
        <div class="answers">
          <ul>
            ${current.answers.map(answer => {
              return html`
                <li>${answer}</li>
              `;
            })}
          </ul>
        </div>
      </details>
    </main>
    <footer>
      <button
        type="button"
        @click=${() => store.markAsIncorrect(current)}
        class="button button--incorrect"
        ?disabled=${!store.open}
      >
        Incorrect
      </button>
      <button
        type="button"
        @click=${() => store.markAsCorrect(current)}
        class="button button--correct"
        ?disabled=${!store.open}
      >
        Correct
      </button>
      <button
        type="button"
        class="button button--cta"
        ?disabled=${store.open}
        @click=${() => store.toggleOpen()}
      >
        Show answers
      </button>
    </footer>
    <div hidden>
      <p>correct: ${store.correct.length}</p>
      <p>incorrect: ${store.incorrect.length}</p>
      <p>index: ${current.id}</p>
      <p>pass: ${store.pass}</p>
      <p>open: ${store.open}</p>
    </div>
  `;
};

export default Question;
