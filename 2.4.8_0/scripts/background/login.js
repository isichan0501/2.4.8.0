let API_URL = 'https://api.wfh.team';
chrome.management.getSelf((self) => {
  if (self.installType === 'development') {
    API_URL = 'https://dev.wfh.team:8000';
    chrome.storage.local.set({ environment: 'development' });
  } else {
    chrome.storage.local.set({ environment: 'production' });
  }
});

function registerUser(data) {
  const { user } = data;
  const { version } = chrome.runtime.getManifest();
  const body = {
    openai_id: user.id,
    email: user.email,
    avatar: user.image,
    name: user.name,
    version,
  };

  // register user to the server
  fetch(`${API_URL}/gptx/register/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  }).then((res) => res.json())
    .then((newData) => {
      chrome.storage.sync.set({
        openai_id: user.id,
        user_id: newData.id,
        name: newData.name,
        nickname: newData.nickname ? newData.nickname : newData.name,
        email: newData.email,
        avatar: newData.avatar,
        url: newData.url,
        version: newData.version,
        lastUserSync: Date.now(),
      });
      chrome.storage.local.get(['settings'], (result) => {
        chrome.storage.local.set({ settings: { ...result.settings, emailNewsletter: newData.email_newsletter } });
      });
      chrome.runtime.setUninstallURL(`${API_URL}/gptx/uninstall?p=${user.id.split('-')[1]}`);
    });
}
/* eslint-disable no-unused-vars */
chrome.webRequest.onBeforeSendHeaders.addListener(
  (details) => {
    chrome.storage.sync.get(['user_id', 'openai_id', 'version', 'avatar', 'lastUserSync'], (result) => {
      // or conditionor
      const { version } = chrome.runtime.getManifest();

      const shouldRegister = true || !result.lastUserSync
        || result.lastUserSync < Date.now() - 1000 * 60 * 60 * 24
        || !result.avatar
        || !result.user_id
        || !result.openai_id
        || result.version !== version;
      if (shouldRegister && details.url === 'https://chat.openai.com/api/auth/session') {
        const requestHeaders = details.requestHeaders.reduce((acc, header) => {
          acc[header.name] = header.value;
          return acc;
        }, {});
        // add stop=true to prevent infinity calls
        fetch('https://chat.openai.com/api/auth/session?stop=true', {
          method: 'GET',
          headers: requestHeaders,
        }).then((res) => {
          if (res.ok) {
            return res.json();
          }
          return null;
        }).then((data) => {
          if (data?.user?.id) {
            registerUser(data);
          }
        });
        // chrome.webRequest.onBeforeSendHeaders.removeListener();
      }
    });
  },
  {
    urls: ['https://chat.openai.com/api/auth/session'],
  },
  ['requestHeaders'],
);

/* eslint-disable no-unused-vars */
chrome.webRequest.onBeforeSendHeaders.addListener(
  (details) => {
    const requestHeaders = details.requestHeaders.reduce((acc, header) => {
      acc[header.name] = header.value;
      return acc;
    }, {});

    // save auth token to chrome storage
    chrome.storage.sync.set({ auth_token: requestHeaders.Authorization });
  },
  {
    urls: ['https://chat.openai.com/backend-api/models*'],
  },
  ['requestHeaders'],
);
