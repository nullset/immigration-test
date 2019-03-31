import { html } from "lit-html";

const Complete = store => {
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
};

export default Complete;
