import { redirectButtons } from '../settings.js';
import { initReaderView } from './readerViewPopup.js';

function createNewTab(url) {
  chrome.tabs.create({ url });
}

function replaceUrlBeg(redirectionUrlPrefix, url) {
  const newUrl = new URL(url.href.replace(url.origin, redirectionUrlPrefix));
  if (redirectionUrlPrefix.startsWith('http://localhost')) {
    newUrl.pathname = newUrl.pathname.replace('/contact-center', '');
  } else if (url.origin.startsWith('http://localhost')) {
    newUrl.pathname = '/contact-center' + newUrl.pathname;
  }
  return newUrl.href;
}

function redirect(redirectionUrlPrefix) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]?.url) {
      const currentUrl = new URL(tabs[0].url);
      const newUrl = replaceUrlBeg(redirectionUrlPrefix, currentUrl);
      createNewTab(newUrl);
    }
  });
}

function createButton(text, onClick) {
  const button = document.createElement('button');
  button.textContent = text;
  button.addEventListener('click', onClick);
  document.getElementById('buttons').appendChild(button);
}

function onLoad() {
  for (const [name, urlPrefix] of Object.entries(redirectButtons)) {
    createButton(`→ ${name}`, () => redirect(urlPrefix));
  }
  initReaderView();
}

document.addEventListener('DOMContentLoaded', onLoad, false);