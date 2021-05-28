import { lensProp, over, sequence } from '../node_modules/ramda/es/index.js';
import {
  compose, List, map, curry,
} from './utils/fnUtils.js';
import { Task } from './utils/task.js';
import { getCurrentTabPromise } from './utils/utils.js';

const ENV_HOSTS = [
  'www.staging.worldremit.com',
  'www.worldremit.com',
  'e2e-cms.wremitprd.com',
];

const replaceHost = (host) => (ENV_HOSTS.includes(host)
  ? host
  : 'cms.wremitdev.com');

const getVersionUrl = (
  host = 'cms.wremitdev.com',
) => `https://${replaceHost(host)}/public-assets/utils/cms_version.json`;

const getDevVersionUrl = () => getVersionUrl();
const getStageVersionUrl = () => getVersionUrl('www.staging.worldremit.com');
const getProdVersionUrl = () => getVersionUrl('www.worldremit.com');
const getE2EVersionUrl = () => getVersionUrl('e2e-cms.wremitprd.com');

const getVersionPromise = async (versionUrl) => (await fetch(versionUrl)).json();
const getVersionTask = (versionUrl) => Task.fromPromise(getVersionPromise(versionUrl));

function getStatusMarkup({ commit, tag }) {
  return `${tag} - <a target="_blank" class="health-text" href="https://github.com/Worldremit/cms/commit/${commit}">${commit}</a>`;
}

function getStatusListItemMarkup({ env, commit, tag }) {
  return `
    <div class="env-status">
      ${env}: ${getStatusMarkup({ commit, tag })}
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

const boxObjInTask_ = (taskProp, resProp, obj) => obj[taskProp]
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
  // extract task Task object Object { url: Task, ...rest } -> Task Object { version: TaskResult, ...rest }
  map(boxObjInTask('url', 'version')), // Array Task Object
  map(over(urlLense, getVersionTask)), // Array Object { url: Task, ...rest } // put getVersionTask into url prop
);

// not pure

function setHtml(id, markup) {
  document.getElementById(id).innerHTML = markup;
}

function show(id) {
  document.getElementById(id).classList.remove('hidden');
}

function hide(id) {
  document.getElementById(id).classList.add('hidden');
}

const loadAndSetAllEnvsTooltip = compose(
  // Task ->
  (t) => t.fork(
    () => console.warn,
    (allVersionsHtml) => {
      setHtml('allVersionsTooltip', allVersionsHtml);
    },
  ),
  loadVersionsForAllEnvs,
);

export const loadHealthCheck = () => {
  getCurrentTabPromise()
    .then(loadVersionForCurrentEnvOrDevTask)
    .then((t) => t.fork(
      () => {
        show('no-connection');
        hide('version_wrap');
      },
      (currentVersionHtml) => setHtml('version', currentVersionHtml),
    ));
  loadAndSetAllEnvsTooltip([
    { env: 'dev', url: getDevVersionUrl() },
    { env: 'stage', url: getStageVersionUrl() },
    { env: 'prod', url: getProdVersionUrl() },
    { env: 'e2e', url: getE2EVersionUrl() },
  ]);
};
