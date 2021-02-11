import { safeProp } from './fnUtils.js';
import { Task } from './task.js';

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

export function getCurrentTab(callback) {
  return chrome.tabs.getSelected(null, callback);
}

export const getCurrentTabTask = () => new Task((_, resolve) => getCurrentTab(resolve));

export const getTabUrl = safeProp('url');
