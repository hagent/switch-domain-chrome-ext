import { redirectButtons } from '../settings.js';
import { IO } from './utils/IO.js';
import { Task } from './utils/task.js';
import {
  curry, map, compose, maybe,
} from './utils/fnUtils.js';
import { createButton, getCurrentTabTask, getTabUrl } from './utils/utils.js';
import { initReaderView } from './readerViewPopup.js';


const createNewTabIO = (url) => new IO(() => chrome.tabs.create({ url }));

const createUrl = (url) => new URL(url);
const replaceUrlBeg = curry((redirectionUrlPrefix, url) => {
  const newUrl = new URL(url.href.replace(url.origin, redirectionUrlPrefix));
  if (redirectionUrlPrefix.startsWith('http://localhost')) {
    newUrl.pathname = newUrl.pathname.replace('/contact-center', '');
  } else if (url.origin.startsWith('http://localhost')) {
    newUrl.pathname = '/contact-center' + newUrl.pathname;
  }
  return newUrl.href;
});
const replaceUrlDomain = (redirectionUrlPrefix) => compose(replaceUrlBeg(redirectionUrlPrefix), createUrl);

const redirect = (redirectionUrlPrefix) => compose(
  map(map(createNewTabIO)), // Task Maybe IO
  map(map(replaceUrlDomain(redirectionUrlPrefix))), // Task Maybe String
  map(getTabUrl), // Task Maybe String
  getCurrentTabTask, // Task Object
);


// not pure

const redirectExecute = (urlPrefix) => compose(
  (x) => x.fork(
    console.warn,
    maybe(null, (x1) => x1.unsafePerformIO()),
  ),
  redirect(urlPrefix),
);

function onLoad() {
  Object.entries(redirectButtons)
    .forEach(([name, urlPrefix]) => createButton(`→ ${name}`, redirectExecute(urlPrefix)));
  initReaderView();
}

document.addEventListener('DOMContentLoaded', onLoad, false);
