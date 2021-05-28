import { getCurrentTabPromise } from './utils/utils.js';

export function initOnlineVSCode(createButton) {
  getCurrentTabPromise()
    .then((tab) => {
      if (tab.url.includes('github.com')) {
        createButton('→ VScode', () => {
          chrome.tabs.create({ url: tab.url.replace('github.com', 'github1s.com') });
        });
      }
    });
}
