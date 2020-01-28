const STATUS_REFRESH_TIMEOUT = 30000;

function getCurrentTab(callback) {
  return chrome.tabs.getSelected(null, callback);
}

const createNewTabTask = url => new IO(() => chrome.tabs.create({ url }));

const getTabId = safeProp("id");
const getTabUrl = safeProp("url");
const getUrlEnd = compose(chain(safeHead), safeReExec(/\/event\/.*/));

const getEventUrlEnd = compose(chain(getUrlEnd), getTabUrl);
const getCurrentTabTask = () =>
  new Task((_, resolve) => getCurrentTab(resolve));

const redirectFromTab = redirectionUrlPrefix => {
  
  return compose(
    // todo ¯\_(ツ)_/¯ something with types
    x =>
      x.fork(
        console.warn,
        maybe(null, x => x.unsafePerformIO())
      ),
    map(map(createNewTabTask)),
    map(map(prepand(redirectionUrlPrefix))),
    map(getEventUrlEnd),
    getCurrentTabTask
  );
};

const getUrlBeg = compose(
  chain(safeHead),
  chain(safeReExec(/https?:\/\/.*?\//)),
  getTabUrl
);

const getPassword = isTest =>
  isTest ? SETTINGS.TEST_HEALTH_CHECK_PASSWARD : SETTINGS.HEALTH_CHECK_PASSWARD;

const isTestUrl = safeMatch(/edp-qa|edp-alpha/);

const getPasswordForEnvironment = compose(
  map(getPassword),
  chain(isTestUrl),
  getTabUrl
);

const combineHealthCheckUrl = curry(
  (urlBeg, pass) => `${urlBeg}tmol/health?pass=${pass}`
);

const getHealthCheckUrl = lift2(
  combineHealthCheckUrl,
  getUrlBeg,
  getPasswordForEnvironment
);

const getHealthCheckTask = healthCheckUrl =>
  new Task(async (reject, resolve) => {
    const res = await (await fetch(healthCheckUrl)).text();
    resolve(res);
  });

const getHashAndTag = compose(
  map(([, hash, tag]) => ({
    hash,
    tag
  })),
  safeReExec(/gitHash=(.*?), ciBuildTag=(.*?),/)
);

// not pure

document.addEventListener("DOMContentLoaded", onLoad, false);

function onLoad() {
  const buttons = Object.entries(SETTINGS.buttons).map(([name, urlPrefix]) => {
    const btn = document.createElement("button");
    btn.addEventListener("click", redirectFromTab(urlPrefix), false);
    btn.textContent = "-> " + name;
    return btn;
  });
  buttons.forEach(btn => document.getElementById("buttons").appendChild(btn));
  loadHealthCheck();
}

const setHealthCheckHashAndTagIO = ({ hash, tag, healthCheckUrl }) =>
  new IO(() => {
    const tagEl = document.getElementById("healthCheckTag");
    tagEl.textContent = tag;
    // todo refactor
    getCurrentTab(
      compose(
        map(x => x.unsafePerformIO()),
        map(healthCheckUrl => new IO(() => (tagEl.href = healthCheckUrl))),
        getHealthCheckUrl
      )
    );
    const hashEl = document.getElementById("healthCheckHash");
    hashEl.textContent = hash;
    hashEl.href = "https://git.tmaws.io/tm/tmol-web-spring/commit/" + hash;
    setTimeout(loadHealthCheck, STATUS_REFRESH_TIMEOUT);
  });

const loadAndSetHealthCheckStatus = compose(
  map(t =>
    t.fork(
      console.warn,
      map(x => x.unsafePerformIO())
    )
  ),
  map(map(map(setHealthCheckHashAndTagIO))), // todo ¯\_(ツ)_/¯ something with types
  map(map(getHashAndTag)),
  map(getHealthCheckTask),
  getHealthCheckUrl
);

const loadHealthCheck = () => {
  // todo use task?
  getCurrentTab(loadAndSetHealthCheckStatus);
};
