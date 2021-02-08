import { createButton, getCurrentTabPromise } from './utils.js';

const state = {
  readerViewState: 'off',
};

async function toggleReaderView() {
  const tab = await getCurrentTabPromise();
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

export async function initReaderView() {
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'readerViewOn') {
      state.readerViewState = 'readerViewOn';
    }
  });

  const tab = await getCurrentTabPromise();
  chrome.tabs.sendMessage(tab.id, { type: 'getReaderViewState' }, (readerViewState) => {
    state.readerViewState = readerViewState;
    state.readButton = createButton('', () => toggleReaderView());
    updateReaderViewButton();
  });
}
