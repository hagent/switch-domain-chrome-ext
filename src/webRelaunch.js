import { getCurrentTabPromise } from './utils/utils.js';

const WEB_RELAUNCH_COOKIE_NAME = 'Eg9be';

function toggleWebRelaunch(event, tab) {
  const { origin } = new URL(tab.url);
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
          chrome.tabs.reload();
        },
      );
    },
  );
}

function setInitState(cookies, domain, toggle) {
  const foundCookies = cookies.filter(
    (c) => c.domain === domain && c.value === '1',
  );
  toggle.checked = foundCookies.length > 0;
}

export async function setIsWebRelaunch() {
  const tab = await getCurrentTabPromise();
  const { hostname: domain } = new URL(tab.url);
  const toggle = document.getElementById('web-relaunch-toggle');
  toggle.addEventListener('change', (event) => toggleWebRelaunch(event, tab));
  chrome.cookies.getAll(
    { name: WEB_RELAUNCH_COOKIE_NAME, domain },
    (cookies) => setInitState(cookies, domain, toggle),
  );
}
