const state = {
  readerViewState: "off",
  orginStyle: undefined,
  textElement: undefined,
};

function toReadView(el) {
  const originStyle = el.style.cssText;
  const isJenkins = window.location.href.includes("jenkins");

  const currentRect = el.getBoundingClientRect();
  const bodyRect = document.body.getBoundingClientRect();
  const curentPos = {
    top: currentRect.y,
    left: currentRect.x,
    right: bodyRect.width - currentRect.x - currentRect.width,
    bottom: bodyRect.height - currentRect.y - currentRect.height,
  };
  console.log({ currentRect, curentPos, bodyRect });
  const intermidiateAdjustmentForAnimation = {
    inset: `${curentPos.top}px ${curentPos.right}px 100px ${curentPos.left}px`,
    position: "fixed",
    "z-index": 999999,
    transition: "all 0.2s ease-out",
    background: "rgba(255,255,255, 0.98)",
    border: "grey 3px dashed",
  };
  Object.assign(el.style, intermidiateAdjustmentForAnimation);

  setTimeout(() => {
    const styleAddjustment = {
      inset: 0,
      padding: !isJenkins ? "40px 2%" : "40px 2% 40px 180px",
      overflow: "scroll",
      margin: 0,
      width: "unset",
      "max-width": "unset",
    };
    Object.assign(el.style, styleAddjustment);
  }, 1);

  console.log({ originStyle });
  return originStyle;
}

const MINIMAL_TEXT = 1000;
const WIDTH_INCREASE_TRESHOLD = 1.1; // 110%

function getWidth(el) {
  return el.getBoundingClientRect().width;
}

function findTextElement(sourceElement) {
  let el = sourceElement;
  // first step - minimal bunch of text and fix width
  while (
    el?.parentElement !== document.body &&
    el.innerText.length < MINIMAL_TEXT
  ) {
    el = el?.parentElement;
  }

  console.log("minimal amount of text element", el);
  // second step - increase text till width is more or less the same
  while (
    el.parentElement !== document.body &&
    getWidth(el.parentElement) / getWidth(el) < WIDTH_INCREASE_TRESHOLD
  ) {
    el = el.parentElement;
  }
  console.log("targetElement", el);
  console.log("parent", el.parentElement);

  return el;
}

function restorePage() {
  state.textElement.style.cssText = state.orginStyle;
  state.textElement = null;
  state.readerViewState = "off";
}

document.addEventListener("click", (event) => {
  if (state.readerViewState === "selectTextForReaderView") {
    console.log("source", event.target);
    const textElement = findTextElement(event.target);

    const orginStyle = toReadView(textElement);
    state.textElement = textElement;
    state.readerViewState = "readerViewOn";
    state.orginStyle = orginStyle;
    console.log("target", textElement);
    chrome.runtime.sendMessage({ type: "readerViewOn" });
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "selectTextForReaderView") {
    state.readerViewState = "selectTextForReaderView";
  }
  if (message.type === "getReaderViewState") {
    sendResponse(state.readerViewState);
  }
  if (message.type === "closeReaderView") {
    console.log("receive closeReaderView");
    if (state.readerViewState === "readerViewOn") {
      restorePage();
    }
    state.readerViewState = "off";
  }
});
