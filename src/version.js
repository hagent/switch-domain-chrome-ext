import {
  compose,
  map,
  Maybe,
  maybe,
} from './fnUtils.js';
import { Task } from './task.js';
import { getCurrentTab } from './utils.js';

const replaceHost = (host) => (host === 'www.develop.staging.worldremit.com' ? 'cms.wremitdev.com' : host);
const getVersionUrl = ({
  host,
  protocol,
}) => (host.includes('worldremit.com') ? Maybe.of(`${protocol}//${replaceHost(host)}/public-assets/utils/cms_version.json`) : Maybe.nothing());

const getVersionTask = (versionUrl) => new Task(async (reject, resolve) => {
  const res = await (await fetch(versionUrl)).json();
  resolve(res);
});

function setHealthCheckHash({ commit, tag }) {
  const tagEl = document.getElementById('healthCheckTag');
  tagEl.textContent = `${tag} - `;
  const hashEl = document.getElementById('healthCheckHash');
  hashEl.textContent = commit;
  hashEl.href = `https://github.com/Worldremit/cms/commit/${commit}`;
}

const loadAndSetHealthCheckStatus = compose(
  map(getVersionTask), // Maybe Task String
  getVersionUrl, // Maybe String
  (x) => new URL(x.url),
);

const loadAndSetHealthCheckStatusExecute = compose(
  // Maybe Task ->
  maybe(undefined, (t) => t.fork(
    console.warn,
    (x) => setHealthCheckHash(x),
  )),
  loadAndSetHealthCheckStatus,
);

export const loadHealthCheck = () => {
  getCurrentTab(loadAndSetHealthCheckStatusExecute);
};
