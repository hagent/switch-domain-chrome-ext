import { lensProp, over, sequence } from '../node_modules/ramda/es/index.js';
import {
  compose, List, map, curry,
} from './fnUtils.js';
import { Task } from './task.js';
import { getCurrentTabPromise } from './utils.js';

const replaceHost = (host) => (host.includes('worldremit.com') && host !== 'www.develop.staging.worldremit.com'
  ? host
  : 'cms.wremitdev.com');

const getVersionUrl = (
  host = 'cms.wremitdev.com',
) => `https://${replaceHost(host)}/public-assets/utils/cms_version.json`;

const getDevVersionUrl = () => getVersionUrl();
const getStageVersionUrl = () => getVersionUrl('www.staging.worldremit.com');
const getProdVersionUrl = () => getVersionUrl('www.worldremit.com');

const getVersionPromise = async (versionUrl) => (await fetch(versionUrl)).json();
const getVersionTask = (versionUrl) => Task.fromPromise(getVersionPromise(versionUrl));

function getStatusMarkup({ commit, tag }) {
  return `${tag} - <a class="health-text" href="https://github.com/Worldremit/cms/commit/${commit}">${commit}</a>`;
}
function getStatusListItemMarkup({ env, commit, tag }) {
  return `
    <div class="env-status">
      ${env}: ${tag} - <a class="health-text" href="https://github.com/Worldremit/cms/commit/${commit}">${commit}</a>
    </div>
  `;
}

const loadVersionForCurrentEnvOrDevTask = compose(
  map(getStatusMarkup), // Task String
  getVersionTask, // Task String
  getVersionUrl, // String
  (x) => new URL(x.url).host,
);

const urlLense = lensProp('url');

const boxObjInTask_ = (promiseProp, resProp, obj) => obj[promiseProp]
  .map((res) => ({
    ...obj,
    [resProp]: res,
  }));
const boxObjInTask = curry(boxObjInTask_);

const loadVersionsForAllEnvs = compose(
  map((x) => x.$value.join('')), // Task String
  map(map(getStatusListItemMarkup)), // Task List String
  map(map((x) => ({ ...x, ...x.version }))),
  sequence(Task.of), // Task List Object
  (x) => new List(x), // List Task Object
  map(boxObjInTask('url', 'version')), // Array Task Object
  map(over(urlLense, getVersionTask)),
);

// not pure

function setHtml(id, markup) {
  document.getElementById(id).innerHTML = markup;
}

const loadAndSetAllEnvsTooltip = compose(
  // Task ->
  (t) => t.fork(
    console.warn,
    (allVersionsHtml) => {
      console.log({ allVersionsHtml });
      setHtml('allVersionsTooltip', allVersionsHtml);
    },
  ),
  loadVersionsForAllEnvs,
);

export const loadHealthCheck = () => {
  getCurrentTabPromise()
    .then(loadVersionForCurrentEnvOrDevTask)
    .then((t) => t.fork(
      console.warn,
      (currentVersionHtml) => setHtml('version', currentVersionHtml),
    ));
  loadAndSetAllEnvsTooltip([
    { env: 'dev', url: getDevVersionUrl() },
    { env: 'stage', url: getStageVersionUrl() },
    { env: 'prod', url: getProdVersionUrl() },
  ]);
};
