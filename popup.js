const STATUS_REFRESH_TIMEOUT = 30000;

function getCurrentTab(callback) {
  return chrome.tabs.getSelected(null, callback);
}

const createNewTabIO = url => new IO(() => chrome.tabs.create({ url }));

const getTabId = safeProp("id");
const getTabUrl = safeProp("url");
const getUrlEnd = compose(chain(safeHead), safeReExec(/\/event\/.*/));

const getEventUrlEnd = compose(chain(getUrlEnd), getTabUrl);
const getCurrentTabTask = () =>
  new Task((_, resolve) => getCurrentTab(resolve));

const redirect = redirectionUrlPrefix => {
  return compose(
    map(map(createNewTabIO)), // Task Maybe IO
    map(map(prepand(redirectionUrlPrefix))), // Task Maybe String
    map(getEventUrlEnd), // Task Maybe String
    getCurrentTabTask // Task Object
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

const loadAndSetHealthCheckStatus = compose(
  map(map(setHealthCheckHashAndTagIO)), // Task Maybe IO
  map(join), // Task Maybe Object // collapse 2 Maybe
  traverse(Task.of, map(getHashAndTag)), // Task Maybe Maybe Object
  map(getHealthCheckTask), // Maybe Task String
  getHealthCheckUrl // Maybe String
);

// not pure

document.addEventListener("DOMContentLoaded", onLoad, false);

const redirectExecute = urlPrefix =>
  compose(
    x =>
      x.fork(
        console.warn,
        maybe(null, x => x.unsafePerformIO())
      ),
    redirect(urlPrefix)
  );

function onLoad() {
  const buttons = Object.entries(SETTINGS.buttons).map(([name, urlPrefix]) => {
    const btn = document.createElement("button");
    btn.addEventListener("click", redirectExecute(urlPrefix), false);
    btn.textContent = "-> " + name;
    return btn;
  });
  buttons.forEach(btn => document.getElementById("buttons").appendChild(btn));
  loadHealthCheck();
}

function setHealthCheckHashAndTagIO({ hash, tag }) {
  return new IO(() => {
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
}

const loadAndSetHealthCheckStatusExecute = compose(
  // Task Maybe IO ->
  t =>
    t.fork(
      console.warn,
      maybe(null, x => x.unsafePerformIO())
    ),
  loadAndSetHealthCheckStatus
);

const loadHealthCheck = () => {
  getCurrentTab(loadAndSetHealthCheckStatusExecute);
};
