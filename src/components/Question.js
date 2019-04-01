import { html, render } from "lit-html";
import { unsafeHTML } from "lit-html/directives/unsafe-html";

const Question = store => {
  const current = store.currentQuestion;
  return html`
    <header>
      <progress value=${store.correct.length} max=${store.questions.length}
        >${store.percentCorrect}
      </progress>
      <div>${store.percentCorrect}</div>
    </header>
    <main>
      <details ?open=${store.open}>
        <summary
          @click=${e => {
            e.preventDefault();
            store.toggleOpen();
          }}
          ><div>${unsafeHTML(current.question)}</div></summary
        >
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
      <fieldset>
        <div>
          <button
            type="button"
            @click=${() => store.markAsIncorrect(current)}
            class="button button--incorrect"
          >
            Incorrect
          </button>
          <button
            type="button"
            @click=${() => store.markAsCorrect(current)}
            class="button button--correct"
          >
            Correct
          </button>
        </div>
      </fieldset>
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
