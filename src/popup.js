import { redirectButtons } from './settings.js';
import { IO } from './IO.js';
import { Task } from './task.js';
import {
  curry, map, compose, maybe,
} from './fnUtils.js';
import { getCalculation } from './generateCybersourceSession.js';
import { createButton, getCurrentTabTask, getTabUrl } from './utils.js';
import { initReaderView } from './readerViewPopup.js';
import { setIsWebRelaunch } from './webRelaunch.js';
import { loadHealthCheck } from './version.js';

const LOCALHOST = 'https://localhost:3443';
const STAGING = 'https://staging.worldremit.com';

const createNewTabIO = (url) => new IO(() => chrome.tabs.create({ url }));

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

function openCalculation(host) {
  getCalculation()
    .then(getCalculationUrl(host))
    .then(openUrlTask)
    .then((task) => task.fork(console.error, console.log));
}

function onLoad() {
  setIsWebRelaunch();
  Object.entries(redirectButtons)
    .forEach(([name, urlPrefix]) => createButton(`-> ${name}`, redirectExecute(urlPrefix)));
  createButton('Calculation - Stage', () => openCalculation(STAGING));
  createButton('Calculation - Localhost', () => openCalculation(LOCALHOST));
  initReaderView();
  loadHealthCheck();
}

document.addEventListener('DOMContentLoaded', onLoad, false);
