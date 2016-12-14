let PromiseClass = Promise;

export function getPromiseClass() {
  return PromiseClass;
}

export function setPromiseClass(NewPromiseClass) {
  PromiseClass = NewPromiseClass;
}
