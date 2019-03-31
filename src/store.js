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
      this.pass = 0;
    });
  }

  get toBeAnswered() {
    return this.questions.filter(item => {
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

  // Questions which were *never* answered incorrectly.
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
  toBeAnswered: computed,
  currentQuestion: computed,
  correct: computed,
  incorrect: computed,
  notIncorrect: computed,
  mostDifficultQuestions: computed,
  percentCorrect: computed
});

const store = (window.store = new Store({ questions: kv }));
export default store;
