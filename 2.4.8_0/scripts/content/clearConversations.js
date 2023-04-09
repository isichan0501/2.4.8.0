/* global deleteConversation, deleteAllConversations, resetSelection, showNewChatPage */
function replaceDeleteConversationButton() {
  const nav = document.querySelector('nav');
  if (!nav) return;
  const allNavButtons = Array.from(nav.querySelectorAll('a'));
  const logoutButton = allNavButtons.find((button) => button.textContent.toLocaleLowerCase() === 'log out');

  if (!logoutButton) return;
  const deleteConversationsButton = logoutButton.cloneNode(true);
  // remove existing
  const existingDeleteConversationsButton = document.getElementById('delete-conversations-button');
  if (existingDeleteConversationsButton) existingDeleteConversationsButton.remove();
  // insert deleteConversationsButton before logoutButton
  nav.insertBefore(deleteConversationsButton, logoutButton);
  deleteConversationsButton.id = 'delete-conversations-button';
  chrome.storage.local.get(['selectedConversations'], (result) => {
    let { selectedConversations } = result;
    if (!selectedConversations) selectedConversations = [];
    deleteConversationsButton.innerHTML = `<svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>Delete ${selectedConversations?.length === 0 ? 'All' : `${selectedConversations?.length} Selected`}`;
  });
  deleteConversationsButton.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    chrome.storage.local.get(['selectedConversations', 'conversations', 'conversationsAreSynced', 'settings'], (result) => {
      const {
        selectedConversations, conversations, conversationsAreSynced, settings,
      } = result;

      const visibleConversations = conversationsAreSynced && conversations && settings.autoSync ? Object.values(conversations).filter((conversation) => !conversation.archived && !conversation.skipped) : nav.querySelector('div').querySelector('div').querySelectorAll('a');

      if (e.target.textContent === 'Confirm Delete') {
        e.target.innerHTML = '<svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>Delete All';
        e.target.style.backgroundColor = 'transparent';
        e.target.style.color = 'white';
        e.target.style.borderColor = 'none';
        if (selectedConversations && selectedConversations?.length === 0) {
          deleteAllConversations().then((data) => {
            if (data.success) {
              // set archived = true for all conversations
              const newConversations = conversations
                ? Object.keys(conversations).reduce(
                  (acc, key) => {
                    acc[key] = {
                      ...conversations[key],
                      archived: true,
                    };
                    return acc;
                  },
                  {},
                ) : {};
              chrome.storage.local.set({
                conversations: newConversations,
                selectedConversations: [],
              });
              // remove all children of conversationlist
              const conversationList = document.querySelector('#conversation-list');
              const searchBoxWrapper = document.querySelector('#conversation-search-wrapper');
              if (searchBoxWrapper) searchBoxWrapper.remove();

              while (conversationList.firstChild) {
                const conversationElement = conversationList.firstChild;
                if (!settings.showArchivedConversations) {
                  conversationList.removeChild(conversationElement);
                } else {
                  conversationElement.querySelector('[id^=checkbox-wrapper-]').remove();
                  conversationElement.querySelector('[id^=actions-wrapper-]').remove();
                  conversationElement.style.opacity = 0.7;
                  conversationElement.classList.remove('hover:pr-14');
                  const conversationElementIcon = conversationElement.querySelector('img');
                  conversationElementIcon.src = chrome.runtime.getURL('icons/trash.png');
                  // move conversation after archivedConversationsTitle
                  const archivedConversationsTitle = document.querySelector('#archived-conversations-title');
                  if (archivedConversationsTitle) {
                    conversationElement.parentElement.insertBefore(conversationElement, archivedConversationsTitle.nextSibling);
                    archivedConversationsTitle.innerHTML = archivedConversationsTitle.innerHTML.replace(/\(([^)]+)\)/, (match, p1) => `(${parseInt(p1, 10) + 1})`);
                  }
                }
              }
              showNewChatPage();
            }
          }, () => { });
        } else {
          const selectedConversationIds = selectedConversations.map((conversation) => conversation.id);
          const successfullyDeletedConvIds = [];
          // wait for all deleteConversation to be resolved
          const promises = [];

          for (let i = 0; i < selectedConversationIds.length; i += 1) {
            promises.push(deleteConversation(selectedConversationIds[i]).then((data) => {
              if (data.success) {
                successfullyDeletedConvIds.push(selectedConversationIds[i]);
                const conversationElement = document.querySelector(`#conversation-button-${selectedConversationIds[i]}`);
                if (conversationElement && conversationElement.classList.contains('selected')) {
                  showNewChatPage();
                }
                if (!settings.showArchivedConversations) {
                  conversationElement.remove();
                } else {
                  conversationElement.querySelector('[id^=checkbox-wrapper-]').remove();
                  conversationElement.querySelector('[id^=actions-wrapper-]').remove();
                  conversationElement.style.opacity = 0.7;
                  conversationElement.classList.remove('hover:pr-14');
                  const conversationElementIcon = conversationElement.querySelector('img');
                  conversationElementIcon.src = chrome.runtime.getURL('icons/trash.png');
                  // move conversation after archivedConversationsTitle
                  const archivedConversationsTitle = document.querySelector('#archived-conversations-title');
                  if (archivedConversationsTitle) {
                    conversationElement.parentElement.insertBefore(conversationElement, archivedConversationsTitle.nextSibling);
                    archivedConversationsTitle.innerHTML = archivedConversationsTitle.innerHTML.replace(/\(([^)]+)\)/, (match, p1) => `(${parseInt(p1, 10) + 1})`);
                  }
                }
              }
            }, () => { }));
          }
          resetSelection();
          // set archived = true for all selected conversations
          Promise.all(promises).then(() => {
            const newConversations = conversations
              ? Object.keys(conversations).reduce(
                (acc, key) => {
                  if (successfullyDeletedConvIds.includes(key)) {
                    acc[key] = {
                      ...conversations[key],
                      archived: true,
                    };
                  } else {
                    acc[key] = {
                      ...conversations[key],
                    };
                  }
                  return acc;
                },
                {},
              )
              : {};

            chrome.storage.local.set({
              conversations: newConversations,
              selectedConversations: [],
            });
          });
        }
      } else if (visibleConversations.length > 0) {
        e.target.innerHTML = '<svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>Confirm Delete';
        e.target.style.backgroundColor = '#864e6140';
        e.target.style.color = '#ff4a4a';
        setTimeout(() => {
          chrome.storage.local.get(['selectedConversations'], (res) => {
            const selectedConvs = res.selectedConversations;
            e.target.innerHTML = `<svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>Delete ${selectedConvs.length === 0 ? 'All' : `${selectedConvs.length} Selected`}`;
            e.target.style.backgroundColor = 'transparent';
            e.target.style.color = 'white';
          });
        }, 3000);
      }
    });
  });
}
// eslint-disable-next-line no-unused-vars
function initializeReplaceDeleteConversationButton() {
  replaceDeleteConversationButton();
}
