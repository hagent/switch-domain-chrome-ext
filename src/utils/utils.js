import { safeProp } from './fnUtils.js';
import { Task } from './task.js';

export function getCurrentTabPromise() {
  return new Promise((resolve) => {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      resolve(tabs[0]);
    });
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
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    callback(tabs[0]);
  });
}

export const getCurrentTabTask = () => new Task((_, resolve) => getCurrentTab(resolve));

export const getTabUrl = safeProp('url');
