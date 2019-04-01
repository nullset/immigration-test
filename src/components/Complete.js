import { html } from "lit-html";

const Complete = store => {
  return html`
    <header><h1>${store.percentCorrect}% correct</h1></header>
    <main>
      <div class="card">
        <dl>
          <dt>Questions missed:</dt>
          <dd>${store.incorrect.length} of ${store.questions.length}</dd>

          <dt ?hidden=${store.percentCorrect === 100}>
            Questions most missed:
          </dt>
          ${store.mostDifficultQuestions.map(item => {
            return html`
              <dd ?hidden=${store.percentCorrect === 100}>
                <dl class="questions-missed">
                  <dt>${item.question}</dt>
                  <dd>
                    <ul>
                      ${item.answers.map(answer => {
                        return html`
                          <li>${answer}</li>
                        `;
                      })}
                    </ul>
                  </dd>
                </dl>
              </dd>
            `;
          })}
        </dl>
      </div>
    </main>
    <footer>
      <button
        type="button"
        class="button button--cta"
        @click=${() => store.reset()}
      >
        Retake the test
      </button>
    </footer>
  `;
};

export default Complete;
