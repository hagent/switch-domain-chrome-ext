import { redirectButtons } from './settings.js';
import { IO } from './IO.js';
import { Task } from './task.js';
import {
  safeProp, curry, map, compose, maybe,
} from './utils.js';
import { getCalculation } from './generateCybersourceSession.js';

const LOCALHOST = 'https://localhost:3443';
const STAGING = 'https://staging.worldremit.com';

const state = {
  readerViewState: 'off',
};

function getCurrentTab(callback) {
  return chrome.tabs.getSelected(null, callback);
}

const createNewTabIO = (url) => new IO(() => chrome.tabs.create({ url }));

const getTabUrl = safeProp('url');

const getCurrentTabTask = () => new Task((_, resolve) => getCurrentTab(resolve));

const createUrl = (url) => new URL(url);
const replaceUrlBeg = curry((redirectionUrlPrefix, url) => url.href.replace(url.origin, redirectionUrlPrefix));
const replaceUrlDomain = (redirectionUrlPrefix) => compose(replaceUrlBeg(redirectionUrlPrefix), createUrl);

const redirect = (redirectionUrlPrefix) => compose(
  map(map(createNewTabIO)), // Task Maybe IO
  map(map(replaceUrlDomain(redirectionUrlPrefix))), // Task Maybe String
  map(getTabUrl), // Task Maybe String
  getCurrentTabTask, // Task Object
);

const getCalculationUrl = curry(
  (host, calculationId) => `${host}/en/calculation/${calculationId}`,
);
const openUrlTask = (url) => new Task((rej, res) => {
  chrome.tabs.create({ url });
  res();
});

// not pure

const redirectExecute = (urlPrefix) => compose(
  (x) => x.fork(
    console.warn,
    maybe(null, (x1) => x1.unsafePerformIO()),
  ),
  redirect(urlPrefix),
);

function createButton(name, clickHandler) {
  const btn = document.createElement('button');
  btn.addEventListener('click', clickHandler, false);
  btn.textContent = name;
  document.getElementById('buttons').appendChild(btn);
  return btn;
}

function openCalculation(host) {
  getCalculation()
    .then(getCalculationUrl(host))
    .then(openUrlTask)
    .then((task) => task.fork(console.error, console.log));
}

function updateReaderViewButton() {
  state.readButton.className = '';
  state.readButton.classList.remove('hidden');
  if (state.readerViewState !== 'off') {
    state.readButton.classList.add('active-button');
  }
  switch (state.readerViewState) {
    case 'off':
      state.readButton.textContent = 'To Reader View';
      break;
    case 'readerViewOn':
      state.readButton.textContent = 'Close reader view';
      break;
    case 'selectTextForReaderView':
      state.readButton.textContent = 'Click text to read';
      break;

    default:
      state.readButton.classList.add('hidden');
      // state.readButton.textContent = 'error: unknown state';
      break;
  }

  state.readButton.title = JSON.stringify(state, null, 2);
}

function toggleReaderView() {
  getCurrentTab((tab) => {
    switch (state.readerViewState) {
      case 'off':
        state.readerViewState = 'selectTextForReaderView';
        chrome.tabs.sendMessage(tab.id, { type: 'selectTextForReaderView' });
        break;
      case 'readerViewOn':
        chrome.tabs.sendMessage(tab.id, { type: 'closeReaderView' });
        state.readerViewState = 'off';
        break;
      case 'selectTextForReaderView':
        chrome.tabs.sendMessage(tab.id, { type: 'closeReaderView' });
        state.readerViewState = 'off';
        break;

      default:
        console.error('unknown reader view state');
        break;
    }

    if (state.readerView) {
      state.readerView = false;
      console.log('seng closeReaderView');
    }
    updateReaderViewButton();
  });
}

const WEB_RELAUNCH_COOKIE_NAME = 'Eg9be';

function setIsWebRelaunch() {
  getCurrentTab((tab) => {
    const { origin, hostname: domain } = new URL(tab.url);
    const toggle = document.getElementById('web-relaunch-toggle');
    toggle.addEventListener('change', (event) => {
      chrome.cookies.remove(
        {
          name: WEB_RELAUNCH_COOKIE_NAME,
          url: origin,
        },
        () => {
          chrome.cookies.set(
            {
              name: WEB_RELAUNCH_COOKIE_NAME,
              url: origin,
              value: event.target.checked ? '1' : '0',
            },
            () => {
              console.log('yeah all set');
              chrome.tabs.reload();
            },
          );
        },
      );
    });
    chrome.cookies.getAll(
      { name: WEB_RELAUNCH_COOKIE_NAME, domain },
      (cookies) => {
        console.log('is it your cookies', cookies);
        const foundCookies = cookies.filter(
          (c) => c.domain === domain && c.value === '1',
        );
        console.log('cookies length', {
          length: foundCookies.length,
          foundCookies,
        });
        toggle.checked = foundCookies.length > 0;
      },
    );
  });
}

function onLoad() {
  setIsWebRelaunch();
  Object.entries(redirectButtons).forEach(([name, urlPrefix]) => createButton(`-> ${name}`, redirectExecute(urlPrefix)));
  createButton('Calculation - Stage', () => openCalculation(STAGING));
  createButton('Calculation - Localhost', () => openCalculation(LOCALHOST));
  getCurrentTab((tab) => {
    chrome.tabs.sendMessage(tab.id, { type: 'getReaderViewState' }, (readerViewState) => {
      state.readerViewState = readerViewState;
      state.readButton = createButton('', () => toggleReaderView());
      updateReaderViewButton();
    });
  });
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'readerViewOn') {
      state.readerViewState = 'readerViewOn';
    }
  });
}

document.addEventListener('DOMContentLoaded', onLoad, false);
