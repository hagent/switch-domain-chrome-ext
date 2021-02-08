export function getCurrentTabPromise() {
  return new Promise((resolve) => {
    chrome.tabs.getSelected(null, resolve);
  });
}

export function createButton(name, clickHandler) {
  const btn = document.createElement('button');
  btn.addEventListener('click', clickHandler, false);
  btn.textContent = name;
  document.getElementById('buttons').appendChild(btn);
  return btn;
}
