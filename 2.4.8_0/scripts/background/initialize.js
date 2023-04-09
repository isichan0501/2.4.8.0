let changeInfoStatus = 'loading';
let tabStatus = 'loading';
const debounce = (func, wait = 1000) => {
  let timeout;

  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// function that injects code to a specific tab
const injectScript = debounce((tabId) => {
  chrome.scripting.executeScript(
    {
      target: { tabId },
      files: ['scripts/content/initialize.js'],
    },
  );
});

// adds a listener to tab change
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    changeInfoStatus = changeInfo.status;
  }
  if (tab.status === 'complete') {
    tabStatus = tab.status;
  }
  if (changeInfoStatus === 'complete' && tabStatus === 'complete' && tab.title) {
    injectScript(tabId);
    changeInfoStatus = 'loading';
    tabStatus = 'loading';
    setTimeout(() => {
      injectScript(tabId);
      changeInfoStatus = 'loading';
      tabStatus = 'loading';
    }, 2000);
  }
});
