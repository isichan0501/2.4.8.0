/* eslint-disable no-restricted-globals */
// eslint-disable-next-line no-unused-vars
/* global markdown, initializeNavbar, generateInstructions, generateChat, SSE, formatDate, showAllCheckboxes, hideAllButLastCheckboxes, initializeCopyAndCounter, initializeAddToPromptLibrary, deleteConversation, renameConversation, loadConversation, resetSelection, rowUser, rowAssistant, updateOrCreateConversation, replaceTextAreaElemet, highlight, isGenerating:true, disableTextInput:true, generateTitle, addConversationsEventListeners, debounce, initializeRegenerateResponseButton, initializeStopGeneratingResponseButton, toggleTextAreaElemet, showNewChatPage, chatStreamIsClosed:true, addCopyCodeButtonsEventListeners, addScrollDetector, scrolUpDetected:true, Sortable, updateInputCounter, addUserPromptToHistory, getGPT4CounterMessageCapWindow */
const notSelectedClassList = 'flex py-3 px-3 pr-3 w-full items-center gap-3 relative rounded-md hover:bg-[#2A2B32] cursor-pointer break-all hover:pr-14 group';
const selectedClassList = 'flex py-3 px-3 pr-3 w-full items-center gap-3 relative rounded-md cursor-pointer break-all hover:pr-14 bg-gray-800 hover:bg-gray-800 group selected';
// Initial state
let userChatIsActuallySaved = false;

function removeOriginalConversationList() {
  const nav = document.querySelector('nav');
  const navGap = nav.querySelector('div');
  navGap.style = `${navGap.style.cssText};display:flex;margin-right:-8px;`;
  const existingConversationList = navGap.querySelector('div');
  const newConversationList = document.createElement('div');
  newConversationList.id = 'conversation-list';
  newConversationList.classList = 'flex flex-col gap-2 text-gray-100 text-sm';
  newConversationList.style = 'overflow-y:scroll;height:100%;padding-right:8px;';
  if (existingConversationList) {
    existingConversationList.remove();
    navGap.prepend(newConversationList);
    // const sortable = new Sortable(newConversationList, {
    //   draggable: '[id^="conversation-button-"]',
    // });
  }
}
function getConversationElementClassList(conversation) {
  const { pathname } = new URL(window.location.toString());
  const conversationId = pathname.split('/').pop().replace(/[^a-z0-9-]/gi, '');
  return conversationId === conversation.id ? selectedClassList : notSelectedClassList;
}
function addCheckboxToConversationElement(conversationElement, conversation) {
  chrome.storage.local.get(['selectedConversations'], (result) => {
    const selectedConvs = result.selectedConversations;
    const checkboxWrapper = document.createElement('div');
    checkboxWrapper.style = 'position: absolute; top: 0px; left: 0px; z-index:10; display:none;cursor: pointer;width:40px;height: 100%;border:none;border-radius:6px;';
    checkboxWrapper.id = `checkbox-wrapper-${conversation.id}`;
    checkboxWrapper.addEventListener('click', (event) => {
      event.stopPropagation();
      const checkbox = conversationElement.querySelector('#checkbox');
      checkbox.click();
    });
    conversationElement.appendChild(checkboxWrapper);

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = 'checkbox';
    checkbox.style = 'position: absolute; top: 12px; left: 12px; z-index:11; cursor: pointer;';
    checkbox.checked = false;
    checkboxWrapper.appendChild(checkbox);
    if (selectedConvs?.length > 0) {
      checkboxWrapper.style.display = 'block';
      checkboxWrapper.style.width = '100%';
      if (selectedConvs.map((c) => c.id).includes(conversation.id)) {
        checkbox.checked = true;
      }
    }

    checkbox.addEventListener('click', (event) => {
      event.stopPropagation();
    });

    conversationElement.addEventListener('mouseenter', () => {
      checkboxWrapper.style.display = 'block';
    });
    conversationElement.addEventListener('mouseleave', () => {
      chrome.storage.local.get(['selectedConversations'], (res) => {
        const { selectedConversations } = res;
        if (selectedConversations.length === 0) {
          checkboxWrapper.style.display = 'none';
        }
      });
    });
    checkbox.addEventListener('change', () => {
      chrome.storage.local.get(['selectedConversations'], (res) => {
        const { selectedConversations } = res;
        let newSelectedConversations = selectedConversations;
        const nav = document.querySelector('nav');
        const newChatButton = nav.querySelector('a');
        if (checkbox.checked) {
          newSelectedConversations = [...selectedConversations, conversation];

          chrome.storage.local.set({ selectedConversations: newSelectedConversations });
          if (newSelectedConversations.length === 1) {
            showAllCheckboxes();
          }
          // chenge export all to export selected
          const exportAllButton = document.querySelector('#export-all-button');
          if (exportAllButton) {
            // keep export all icon, but change the text
            if (newSelectedConversations.length === 1) {
              exportAllButton.innerHTML = exportAllButton.innerHTML.replace('Export All', `Export ${newSelectedConversations.length} Selected`);
            } else {
              exportAllButton.innerHTML = exportAllButton.innerHTML.replace(`Export ${newSelectedConversations.length - 1} Selected`, `Export ${newSelectedConversations.length} Selected`);
            }
          }
          const deleteConversationsButton = document.querySelector('#delete-conversations-button');
          if (deleteConversationsButton) {
            // keep export all icon, but change the text
            if (newSelectedConversations.length === 1) {
              deleteConversationsButton.innerHTML = deleteConversationsButton.innerHTML.replace('Delete All', `Delete ${newSelectedConversations.length} Selected`);
            } else {
              deleteConversationsButton.innerHTML = deleteConversationsButton.innerHTML.replace(`Delete ${newSelectedConversations.length - 1} Selected`, `Delete ${newSelectedConversations.length} Selected`);
            }
          }
        } else {
          newSelectedConversations = selectedConversations.filter((conv) => conv.id !== conversation.id);
          chrome.storage.local.set({ selectedConversations: newSelectedConversations });
          if (newSelectedConversations.length === 0) {
            hideAllButLastCheckboxes(conversation.id);
          }
          // chenge export selected to export all
          const exportAllButton = document.querySelector('#export-all-button');
          if (exportAllButton) {
            if (newSelectedConversations.length === 0) {
              exportAllButton.innerHTML = exportAllButton.innerHTML.replace('Export 1 Selected', 'Export All');
            } else {
              exportAllButton.innerHTML = exportAllButton.innerHTML.replace(`Export ${newSelectedConversations.length + 1} Selected`, `Export ${newSelectedConversations.length} Selected`);
            }
          }
          const deleteConversationsButton = document.querySelector('#delete-conversations-button');
          if (deleteConversationsButton) {
            if (newSelectedConversations.length === 0) {
              deleteConversationsButton.innerHTML = deleteConversationsButton.innerHTML.replace('Delete 1 Selected', 'Delete All');
            } else {
              deleteConversationsButton.innerHTML = deleteConversationsButton.innerHTML.replace(`Delete ${newSelectedConversations.length + 1} Selected`, `Delete ${newSelectedConversations.length} Selected`);
            }
          }
        }
        if (newSelectedConversations.length > 0) {
          // show an x svg followed by clear selection
          newChatButton.innerHTML = '<svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>Clear selection';
        } else {
          // show a plus svg followed by new chat
          newChatButton.innerHTML = '<svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>New chat';
        }
      });
    });
  });
}
function createSearchBox() {
  chrome.storage.local.get(['conversations', 'settings'], (res) => {
    const { showArchivedConversations } = res.settings;
    const existingSearchBoxWrapper = document.querySelector('#conversation-search-wrapper');
    if (existingSearchBoxWrapper) existingSearchBoxWrapper.remove();
    const visibleConvs = showArchivedConversations
      ? Object.values(res.conversations).filter((c) => !c.skipped)
      : Object.values(res.conversations).filter((c) => !c.archived && !c.skipped);
    if (visibleConvs.length === 0) {
      return;
    }
    const conversationList = document.querySelector('#conversation-list');
    const searchboxWrapper = document.createElement('div');
    searchboxWrapper.id = 'conversation-search-wrapper';
    searchboxWrapper.classList = 'flex items-center justify-center';
    const searchbox = document.createElement('input');
    searchbox.type = 'search';
    searchbox.id = 'conversation-search';
    searchbox.placeholder = 'Search conversations';
    searchbox.classList = 'w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-gray-800 conversation-search';
    searchbox.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowDown') {
        // chatStreamIsClosed = true;
        const focusedConversation = document.querySelector('.selected');
        if (focusedConversation) {
          const nextConversation = focusedConversation.nextElementSibling;
          if (nextConversation) {
            nextConversation.click();
            nextConversation.scrollIntoView({ block: 'center' });
          }
        }
      }
      if (event.key === 'ArrowUp') {
        // chatStreamIsClosed = true;
        const focusedConversation = document.querySelector('.selected');
        if (focusedConversation) {
          const previousConversation = focusedConversation.previousElementSibling;
          if (previousConversation) {
            previousConversation.click();
            previousConversation.scrollIntoView({ block: 'center' });
          }
        }
      }
    });
    searchbox.addEventListener('input', debounce((event) => {
      // chatStreamIsClosed = true;
      const searchValue = event.target.value.toLowerCase();
      chrome.storage.local.get(['conversations', 'settings'], (result) => {
        const { conversations, settings } = result;
        // remove existing conversations
        const curConversationList = document.querySelector('#conversation-list');
        // remove conversations list childs other than the search box wrapper (first child)
        while (curConversationList.childNodes.length > 1) {
          curConversationList.removeChild(curConversationList.lastChild);
        }

        const visibleConversations = settings.showArchivedConversations
          ? Object.values(conversations).filter((c) => !c.skipped)
          : Object.values(conversations).filter((c) => !c.archived && !c.skipped);
        let filteredConversations = visibleConversations;
        if (searchValue) {
          filteredConversations = visibleConversations.filter((c) => (
            c.title.toLowerCase().includes(searchValue.toLowerCase())
            || Object.values(c.mapping).map((m) => m?.message?.content?.parts?.join(' ')?.replace(/## Instructions[\s\S]*## End Instructions\n\n/, ''))
              .join(' ')?.toLowerCase()
              .includes(searchValue.toLowerCase())));
        }
        loadStorageConversations(filteredConversations, searchValue);
        if (!searchValue) {
          const { pathname } = new URL(window.location.toString());
          const conversationId = pathname.split('/').pop().replace(/[^a-z0-9-]/gi, '');
          loadConversation(conversationId, '', false);
        }
      });
    }), 500);

    const newFolderButton = document.createElement('button');
    newFolderButton.id = 'new-folder-button';
    newFolderButton.classList = 'w-12 h-full flex items-center justify-center ml-2 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-gray-800 border border-gray-800';
    // const newFoolderIcon = document.createElement('img');
    // newFoolderIcon.classList = 'w-5 h-5';
    // newFoolderIcon.src = chrome.runtime.getURL('icons/new-folder.png');
    // newFolderButton.append(newFoolderIcon);
    // newFolderButton.addEventListener('mouseover', () => {
    //   newFolderButton.classList.remove('border-gray-800');
    //   newFolderButton.classList.add('bg-gray-600', 'border-gray-300');
    // });
    // newFolderButton.addEventListener('mouseout', () => {
    //   newFolderButton.classList.add('border-gray-800');

    //   newFolderButton.classList.remove('bg-gray-600', 'border-gray-300');
    // });
    // newFolderButton.addEventListener('click', () => {
    //   const folderName = prompt('Enter folder name');
    // });
    // searchboxWrapper.append(newFolderButton);
    // add conversation search box to the top of the list
    searchboxWrapper.prepend(searchbox);
    conversationList.prepend(searchboxWrapper);
  });
}
// add new conversation to the top of the list
// eslint-disable-next-line no-unused-vars
function prependConversation(conversation) {
  const existingConversationElement = document.querySelector(`#conversation-button-${conversation.id}`);
  if (existingConversationElement) existingConversationElement.remove();
  const conversationList = document.querySelector('#conversation-list');
  const searchboxWrapper = document.querySelector('#conversation-search-wrapper');
  const conversationElement = document.createElement('a');
  // conversationElement.href = 'javascript:';
  conversationElement.id = `conversation-button-${conversation.id}`;
  conversationElement.classList = getConversationElementClassList(conversation);
  // eslint-disable-next-line no-loop-func
  conversationElement.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    // get closet element with id starting with conversation-button
    const conversationElementId = e.srcElement.closest('[id^="conversation-button-"]').id.split('conversation-button-')[1];
    // if commandkey or ctrlkey is pressed, open in new tab
    if (e.metaKey || e.ctrlKey) {
      window.open(`https://chat.openai.com/chat/${conversationElementId}`, '_blank');
      return;
    }
    const { pathname } = new URL(window.location.toString());
    const urlConversationId = pathname.split('/').pop().replace(/[^a-z0-9-]/gi, '');
    if (urlConversationId !== conversationElementId) {
      window.history.pushState({}, '', `https://chat.openai.com/chat/${conversationElementId}`);
      // set conversations with class selected to not selected
      const focusedConversations = document.querySelectorAll('.selected');
      focusedConversations.forEach((c) => {
        c.classList = notSelectedClassList;
      });
      // set selected conversation
      conversationElement.classList = selectedClassList;
      loadConversation(conversationElementId);
    }
  });
  const bubbleIcon = document.createElement('img');
  bubbleIcon.classList = 'w-4 h-4';
  bubbleIcon.src = chrome.runtime.getURL('icons/bubble.png');

  const trashIcon = document.createElement('img');
  trashIcon.classList = 'w-4 h-4';
  trashIcon.src = chrome.runtime.getURL('icons/trash.png');
  if (conversation.archived) {
    conversationElement.appendChild(trashIcon);
  } else {
    conversationElement.appendChild(bubbleIcon);
  }
  const conversationTitle = document.createElement('div');
  conversationTitle.id = `conversation-title-${conversation.id}`;
  conversationTitle.classList = 'flex-1 text-ellipsis max-h-5 overflow-hidden break-all relative';
  conversationTitle.style = 'position: relative; bottom: 5px;';
  conversationTitle.innerHTML = conversation.title;
  conversationElement.title = conversation.title;
  conversationElement.appendChild(conversationTitle);
  // add timestamp
  const timestamp = document.createElement('div');
  timestamp.id = 'timestamp';
  timestamp.style = 'font-size: 10px; color: lightslategray; position: absolute; bottom: 0px; left: 40px;';
  chrome.storage.local.get(['settings'], (result) => {
    const { settings } = result;
    const createTime = settings.conversationSort
      ? new Date(conversation.mapping[conversation.current_node].message.create_time * 1000)
      : new Date(conversation.create_time * 1000);
    const conversationCreateTime = formatDate(new Date(createTime));

    timestamp.innerHTML = conversationCreateTime;
  });
  conversationElement.appendChild(timestamp);
  // action icons
  conversationElement.appendChild(conversationActions(conversation.id));

  // add checkbox
  addCheckboxToConversationElement(conversationElement, conversation);
  conversationList.insertBefore(conversationElement, searchboxWrapper.nextSibling);
  createSearchBox();
  // scroll to the top of the conversation list
  conversationList.scrollTop = 0;
}
// eslint-disable-next-line no-unused-vars
function generateTitleForConversation(conversationId, messageId) {
  setTimeout(() => {
    generateTitle(conversationId, messageId).then((data) => {
      const { title } = data;
      const conversationElement = document.querySelector(`#conversation-button-${conversationId}`);
      conversationElement.classList.add('animate-flash');
      const conversationTitle = conversationElement.querySelector(`#conversation-title-${conversationId}`);
      // animate writing title one character at a time
      conversationTitle.innerHTML = '';
      if (!title) return;
      title.split('').forEach((c, i) => {
        setTimeout(() => {
          conversationTitle.innerHTML += c;
        }, i * 50);
      });

      chrome.storage.local.get('conversations', (result) => {
        const { conversations } = result;
        conversations[conversationId].title = title;
        chrome.storage.local.set({ conversations });
      });
    });
  }, 500);// a little delay to make sure gen title still works even if user stops the generation
}
function loadStorageConversations(conversations, searchValue = '') {
  chrome.storage.local.get(['settings'], (result) => {
    const { showArchivedConversations, conversationSort } = result.settings;
    const conversationList = document.querySelector('#conversation-list');

    const nonArchivedConversations = conversationSort // === 'updated'
      ? Object.values(conversations).filter((c) => !c.archived && !c.skipped).sort((a, b) => (b.mapping[b.current_node]).message.create_time - (a.mapping[a.current_node]).message.create_time)
      // conversationSort === 'created'
      : Object.values(conversations).filter((c) => !c.archived && !c.skipped).sort((a, b) => b.create_time - a.create_time);

    const sortedConversations = nonArchivedConversations;
    let archivedConversationsLength = 0;
    // add archived conversations if needed
    if (showArchivedConversations) {
      const archivedConversations = conversationSort // === 'updated'
        ? Object.values(conversations).filter((c) => c.archived && !c.skipped).sort((a, b) => (b.mapping[b.current_node]).message.create_time - (a.mapping[a.current_node]).message.create_time)
        // conversationSort === 'created'
        : Object.values(conversations).filter((c) => c.archived && !c.skipped).sort((a, b) => b.create_time - a.create_time);
      archivedConversationsLength = archivedConversations.length;
      sortedConversations.push(...archivedConversations);
    }

    for (let i = 0; i < sortedConversations.length; i += 1) {
      const conversation = sortedConversations[i];
      const conversationElement = document.createElement('a');
      // conversationElement.href = 'javascript:';
      conversationElement.id = `conversation-button-${conversation.id}`;

      conversationElement.classList = getConversationElementClassList(conversation);
      if (conversation.archived) {
        conversationElement.style.opacity = 0.7;
        conversationElement.classList.remove('hover:pr-14');
      }
      // eslint-disable-next-line no-loop-func
      conversationElement.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        const { pathname } = new URL(window.location.toString());
        const conversationId = pathname.split('/').pop().replace(/[^a-z0-9-]/gi, '');
        if (e.metaKey || e.ctrlKey) {
          window.open(`https://chat.openai.com/chat/${conversation.id}`, '_blank');
          return;
        }
        if (searchValue || conversationId !== conversation.id) {
          window.history.pushState({}, '', `https://chat.openai.com/chat/${conversation.id}`);
          // set conversations with class selected to not selected
          const focusedConversations = document.querySelectorAll('.selected');
          focusedConversations.forEach((c) => {
            c.classList = notSelectedClassList;
            c.style.backgroundColor = '';
          });
          // set selected conversation
          conversationElement.classList = selectedClassList;
          if (conversation.archived) {
            conversationElement.classList.remove('hover:pr-14');
          }
          loadConversation(conversation.id, searchValue);
        }
      });
      const bubbleIcon = document.createElement('img');
      bubbleIcon.classList = 'w-4 h-4';
      bubbleIcon.src = chrome.runtime.getURL('icons/bubble.png');
      const trashIcon = document.createElement('img');
      trashIcon.classList = 'w-4 h-4';
      trashIcon.src = chrome.runtime.getURL('icons/trash.png');
      if (conversation.archived) {
        conversationElement.appendChild(trashIcon);
      } else {
        conversationElement.appendChild(bubbleIcon);
      }
      const conversationTitle = document.createElement('div');
      conversationTitle.id = `conversation-title-${conversation.id}`;
      conversationTitle.classList = 'flex-1 text-ellipsis max-h-5 overflow-hidden break-all relative';
      conversationTitle.style = 'position: relative; bottom: 5px;';
      conversationTitle.innerHTML = highlight(conversation.title, searchValue);
      conversationElement.title = conversation.title;
      conversationElement.appendChild(conversationTitle);
      // add timestamp
      const timestamp = document.createElement('div');
      timestamp.id = 'timestamp';
      timestamp.style = 'font-size: 10px; color: lightslategray; position: absolute; bottom: 0px; left: 40px;';
      const createTime = conversationSort
        ? new Date(conversation.mapping[conversation.current_node].message.create_time * 1000)
        : new Date(conversation.create_time * 1000);
      const conversationCreateTime = formatDate(new Date(createTime));

      timestamp.innerHTML = conversationCreateTime;

      conversationElement.appendChild(timestamp);
      // action icons
      if (!conversation.archived) {
        conversationElement.appendChild(conversationActions(conversation.id));
        // add checkbox
        addCheckboxToConversationElement(conversationElement, conversation);
      }
      if (conversation.archived && (i === 0 || !sortedConversations[i - 1].archived)) {
        const existingArchivedConversationsTitle = document.querySelector('#archived-conversations-title');
        if (existingArchivedConversationsTitle) existingArchivedConversationsTitle.remove();
        const archivedConversationsTitle = document.createElement('div');
        archivedConversationsTitle.id = 'archived-conversations-title';
        archivedConversationsTitle.classList = 'text-gray-300 my-4 text-red-600';
        archivedConversationsTitle.innerHTML = `Archived Conversations (${archivedConversationsLength})`;
        conversationList.appendChild(archivedConversationsTitle);
      }
      conversationList.appendChild(conversationElement);
    }
    const existingNoResult = document.querySelector('#search-no-result');
    if (existingNoResult) existingNoResult.remove();
    if (searchValue) {
      if (sortedConversations.length > 0) {
        // click on first conversation
        const firstConversation = document.querySelector('[id^="conversation-button-"]');
        if (firstConversation) {
          firstConversation.click();
          // focus on searchbox
          const searchbox = document.querySelector('#conversation-search');
          searchbox.focus();
        }
      } else {
        const noResult = document.createElement('div');
        noResult.id = 'search-no-result';
        noResult.classList = 'text-gray-300 text-center';
        noResult.innerHTML = 'No results';
        conversationList.appendChild(noResult);
        showNewChatPage();
      }
    }
  });
}
function conversationActions(conversationId) {
  const actionsWrapper = document.createElement('div');
  actionsWrapper.id = `actions-wrapper-${conversationId}`;
  actionsWrapper.classList = 'absolute flex right-1 z-10 text-gray-300 invisible group-hover:visible';
  const editConversationNameButton = document.createElement('button');
  editConversationNameButton.classList = 'p-1 hover:text-white';
  editConversationNameButton.innerHTML = '<svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>';
  editConversationNameButton.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    chrome.storage.local.get(['conversations'], (result) => {
      const { conversations } = result;
      const textInput = document.createElement('input');
      const conversationTitle = document.querySelector(`#conversation-title-${conversationId}`);
      textInput.id = `conversation-rename-${conversationId}`;
      textInput.classList = 'border-0 bg-transparent p-0 focus:ring-0 focus-visible:ring-0';
      textInput.style = 'position: relative; bottom: 5px;';
      textInput.value = conversations[conversationId].title;
      conversationTitle.parentElement.replaceChild(textInput, conversationTitle);
      textInput.focus();
      textInput.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        textInput.focus();
      });
      // replace action buttons with save and cancel buttons
      actionsWrapper.replaceWith(confirmActions(conversations[conversationId], 'edit'));
    });
  });
  const deleteConversationButton = document.createElement('button');
  deleteConversationButton.classList = 'p-1 hover:text-white';
  deleteConversationButton.innerHTML = '<svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>';
  deleteConversationButton.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    chrome.storage.local.get(['conversations'], (result) => {
      const { conversations } = result;
      actionsWrapper.replaceWith(confirmActions(conversations[conversationId], 'delete'));
    });
    // remove all other visible cancel buttons
    // get all cancel buttons with last part of id not equal to this conversation id and click on them
    const cancelButtons = document.querySelectorAll(`button[id^="cancel-"]:not(#cancel-${conversationId})`);
    cancelButtons.forEach((button) => {
      button.click();
    });
  });
  actionsWrapper.appendChild(editConversationNameButton);
  actionsWrapper.appendChild(deleteConversationButton);
  return actionsWrapper;
}
function confirmActions(conversation, action) {
  let skipBlur = false;
  const conversationElement = document.querySelector(`#conversation-button-${conversation.id}`);
  conversationElement.classList.replace('pr-3', 'pr-14');
  const actionsWrapper = document.createElement('div');
  actionsWrapper.id = `actions-wrapper-${conversation.id}`;
  actionsWrapper.classList = 'absolute flex right-1 z-10 text-gray-300';
  const confirmButton = document.createElement('button');
  confirmButton.id = `confirm-${conversation.id}`;
  confirmButton.classList = 'p-1 hover:text-white';
  confirmButton.innerHTML = '<svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><polyline points="20 6 9 17 4 12"></polyline></svg>';
  confirmButton.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (action === 'edit') {
      const textInput = document.querySelector(`#conversation-rename-${conversation.id}`);
      const conversationTitle = document.createElement('div');
      conversationTitle.id = `conversation-title-${conversation.id}`;
      conversationTitle.classList = 'flex-1 text-ellipsis max-h-5 overflow-hidden break-all relative';
      conversationTitle.style = 'position: relative; bottom: 5px;';
      conversationTitle.innerText = textInput.value;
      textInput.parentElement.replaceChild(conversationTitle, textInput);
      actionsWrapper.replaceWith(conversationActions(conversation.id));
      skipBlur = false;

      renameConversation(conversation.id, textInput.value);
      syncLocalConversation(conversation.id, 'title', textInput.value);
    } else if (action === 'delete') {
      deleteConversation(conversation.id).then((data) => {
        if (data.success) {
          syncLocalConversation(conversation.id, 'archived', true);
          chrome.storage.local.get(['settings'], (res) => {
            const { settings } = res;
            const { showArchivedConversations } = settings;
            if (!showArchivedConversations) {
              // remove conversation from conversations list
              if (conversationElement.classList.contains('selected')) {
                showNewChatPage();
              }
              conversationElement.remove();
            } else {
              actionsWrapper.remove();
              conversationElement.querySelector('[id^=checkbox-wrapper-]').remove();
              conversationElement.style.opacity = 0.7;
              conversationElement.classList.remove('hover:pr-14');
              // replace bubble icon with trash
              const conversationElementIcon = conversationElement.querySelector('img');
              conversationElementIcon.src = chrome.runtime.getURL('icons/trash.png');
              // move conversation after archivedConversationsTitle
              const archivedConversationsTitle = document.querySelector('#archived-conversations-title');
              if (archivedConversationsTitle) {
                conversationElement.parentElement.insertBefore(conversationElement, archivedConversationsTitle.nextSibling);
                archivedConversationsTitle.innerHTML = archivedConversationsTitle.innerHTML.replace(/\(([^)]+)\)/, (match, p1) => `(${parseInt(p1, 10) + 1})`);
              }
            }
          });
        }
      }, () => { });
    }
    conversationElement.classList.replace('pr-14', 'pr-3');
  });
  const cancelButton = document.createElement('button');
  cancelButton.id = `cancel-${conversation.id}`;
  cancelButton.classList = 'p-1 hover:text-white';
  cancelButton.innerHTML = '<svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
  cancelButton.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (action === 'edit') {
      const textInput = document.querySelector(`#conversation-rename-${conversation.id}`);
      const conversationTitle = document.createElement('div');
      conversationTitle.id = `conversation-title-${conversation.id}`;
      conversationTitle.classList = 'flex-1 text-ellipsis max-h-5 overflow-hidden break-all relative';
      conversationTitle.style = 'position: relative; bottom: 5px;';
      conversationTitle.innerText = conversation.title;
      textInput.parentElement.replaceChild(conversationTitle, textInput);
    }
    actionsWrapper.replaceWith(conversationActions(conversation.id));
    conversationElement.classList.replace('pr-14', 'pr-3');
  });
  actionsWrapper.appendChild(confirmButton);
  actionsWrapper.appendChild(cancelButton);
  const textInput = document.querySelector(`#conversation-rename-${conversation.id}`);
  if (textInput) {
    textInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && e.which === 13) {
        skipBlur = true;
        confirmButton.click();
      } else if (e.key === 'Escape') {
        cancelButton.click();
      }
      conversationElement.classList.replace('pr-14', 'pr-3');
    });
    textInput.addEventListener('blur', (e) => {
      if (skipBlur) return;
      if (e.relatedTarget?.id === `confirm-${conversation.id}`) return;
      cancelButton.click();
      conversationElement.classList.replace('pr-14', 'pr-3');
    });
  }
  return actionsWrapper;
}

function updateNewChatButtonSynced() {
  chrome.storage.local.get(['selectedConversations', 'conversationsAreSynced'], (result) => {
    const { selectedConversations, conversationsAreSynced } = result;
    const main = document.querySelector('main');
    if (!main) return;
    const inputForm = main.querySelector('form');
    const textAreaElement = inputForm.querySelector('textarea');
    const nav = document.querySelector('nav');
    const newChatButton = nav.querySelector('a');
    // clone newChatButton
    if (conversationsAreSynced) {
      const newChatButtonClone = newChatButton.cloneNode(true);
      newChatButtonClone.id = 'new-chat-button';
      newChatButton.replaceWith(newChatButtonClone);
      if (!newChatButtonClone) return;
      newChatButtonClone.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.target.innerText === 'Clear selection') {
          resetSelection();
        } else {
          showNewChatPage();
        }
        if (textAreaElement) {
          textAreaElement.focus();
        }
        // remove selected class from conversations from conversations list
        const focusedConversations = document.querySelectorAll('.selected');
        focusedConversations.forEach((c) => {
          c.classList = notSelectedClassList;
        });
        // if search box has value reload conversations list
        const searchBox = document.querySelector('#conversation-search');
        if (searchBox?.value) {
          searchBox.value = '';
          searchBox.dispatchEvent(new Event('input'), { bubbles: true });
        }
      });
      if (selectedConversations?.length > 0) {
        newChatButtonClone.innerHTML = '<svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>Clear selection';
      } else {
        newChatButtonClone.innerHTML = '<svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>New chat';
      }
    }
  });
}
function submitChat(userInput, conversation, messageId, parentId, settings, regenerateResponse = false) {
  scrolUpDetected = false;
  const curSubmitButton = document.querySelector('main').querySelector('form').querySelector('textarea ~ button');
  curSubmitButton.disabled = true;
  curSubmitButton.innerHTML = '<svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"> <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"></circle> <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path> </svg>';
  const syncDiv = document.getElementById('sync-div');
  if (syncDiv) syncDiv.style.opacity = '0.3';
  if (!regenerateResponse) initializeRegenerateResponseButton();
  chatStreamIsClosed = false;
  generateChat(userInput, conversation?.id, messageId, parentId).then((chatStream) => {
    userChatIsActuallySaved = regenerateResponse;
    let userChatSavedLocally = regenerateResponse; // false by default unless regenerateResponse is true
    let assistantChatSavedLocally = false;
    let finalMessage = '';
    let finalConversationId = '';
    let initialUserMessage = {};
    let systemMessage = {};
    chatStream.addEventListener('message', (e) => {
      if (e.data === '[DONE]' || chatStreamIsClosed) {
        const main = document.querySelector('main');
        const inputForm = main.querySelector('form');
        const submitButton = inputForm.querySelector('textarea ~ button');
        const textAreaElement = inputForm.querySelector('textarea');
        textAreaElement.focus();
        // submitButton.disabled = false;
        submitButton.innerHTML = '<svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4 mr-1" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>';
        if (chatStreamIsClosed && e.data !== '[DONE]') {
          const data = JSON.parse(e.data);
          if (data.error) throw new Error(data.error);
          const { conversation_id: conversationId, message } = data;
          finalConversationId = conversationId;
          finalMessage = message;
          // update rowAssistant?
        }
        const tempId = setInterval(() => {
          if (userChatIsActuallySaved) {
            clearInterval(tempId);
            updateOrCreateConversation(finalConversationId, finalMessage, messageId, settings, true, chatStreamIsClosed);
          }
        }, 1000);
        isGenerating = false;
        chatStream.close();
        if (syncDiv) syncDiv.style.opacity = '1';
        toggleTextAreaElemet();
        initializeStopGeneratingResponseButton();
        initializeRegenerateResponseButton();
      } else if (e.event === 'ping') {
        // console.error('PING RECEIVED', e);
      } else {
        try {
          isGenerating = true;
          if (finalMessage === '') {
            initializeStopGeneratingResponseButton();
            // update gpt4 counter
            chrome.storage.local.get(['gpt4Timestamps', 'settings', 'conversationLimit'], (result) => {
              const { gpt4Timestamps } = result;
              if (result.settings.selectedModel.slug !== 'gpt-4') return;
              const now = new Date().getTime();
              const gpt4CounterElement = document.querySelector('#gpt4-counter');
              gpt4CounterElement.style.display = result.settings.showGpt4Counter ? 'block' : 'none';
              const messageCap = result?.conversationLimit?.message_cap || 25;
              const messageCapWindow = result?.conversationLimit?.message_cap_window || 180;
              if (gpt4Timestamps) {
                gpt4Timestamps.push(now);
                const fourHoursAgo = now - (messageCapWindow / 60) * 60 * 60 * 1000;
                const gpt4TimestampsFiltered = gpt4Timestamps.filter((timestamp) => timestamp > fourHoursAgo);
                chrome.storage.local.set({ gpt4Timestamps: gpt4TimestampsFiltered });
                if (gpt4CounterElement) {
                  gpt4CounterElement.innerText = `GPT4 requests (last ${getGPT4CounterMessageCapWindow(messageCapWindow)}): ${gpt4TimestampsFiltered.length}/${messageCap}`;
                }
              } else {
                chrome.storage.local.set({ gpt4Timestamps: [now] });
                if (gpt4CounterElement) {
                  gpt4CounterElement.innerText = `GPT4 requests (last ${getGPT4CounterMessageCapWindow(messageCapWindow)}): 1/${messageCap}`;
                }
              }
            });
          }

          const data = JSON.parse(e.data);

          if (data.error) throw new Error(data.error);
          const { conversation_id: conversationId, message } = data;
          const { role } = message.author;

          finalConversationId = conversationId;
          const { pathname } = new URL(window.location.toString());
          const urlConversationId = pathname.split('/').pop().replace(/[^a-z0-9-]/gi, '');
          if (pathname === '/chat') { // https://chat.openai.com/chat
            // only change url if there are any user messages. if user switch to new page while generating, don't change url when done generating
            const anyUserMessageWrappers = document.querySelectorAll('[id^="message-wrapper-"][data-role="user"]').length > 0;
            if (anyUserMessageWrappers) {
              window.history.pushState({}, '', `https://chat.openai.com/chat/${finalConversationId}`);
            }
          }
          // save user chat locally
          if (!conversation?.id) {
            if (role === 'system') {
              systemMessage = message;
              return;
            }
            if (role === 'user') {
              initialUserMessage = message;
              // set forcerefresh=true when adding user chat, and set it to false when stream ends. This way if something goes wrong in between, the conversation will be refreshed later
              updateOrCreateConversation(finalConversationId, initialUserMessage, parentId, settings, false, true, systemMessage);
              return;
            }
          } else if (!userChatSavedLocally) {
            const userMessage = {
              id: messageId,
              role: 'user',
              content: {
                content_type: 'text',
                parts: [userInput],
              },
            };
            // set forcerefresh=true when adding user chat, and set it to false when stream ends. This way if something goes wrong in between, the conversation will be refreshed later
            updateOrCreateConversation(finalConversationId, userMessage, parentId, settings, false, true);
            userChatSavedLocally = true;
          }
          if (!conversation?.id || userChatSavedLocally) {
            // save assistant chat locally
            finalMessage = message;
            if (!assistantChatSavedLocally) {
              assistantChatSavedLocally = true;
              const tempId = setInterval(() => {
                if (userChatIsActuallySaved) {
                  clearInterval(tempId);
                  updateOrCreateConversation(finalConversationId, finalMessage, messageId, settings);
                }
              }, 1000);
            }
          }

          // if user switch conv while generating, dont show the assistant row until the user switch back to the original conv
          if (finalConversationId !== urlConversationId) return;

          const existingRowAssistant = document.querySelector(`[id="message-wrapper-${message.id}"][data-role="assistant"]`);
          if (existingRowAssistant) {
            const existingRowAssistantTextWrapper = existingRowAssistant.querySelector(`#message-text-${message.id}`);
            const resultCounter = existingRowAssistant.querySelector(`#result-counter-${message.id}`);
            const searchValue = document.querySelector('#conversation-search')?.value;
            const messageContentParts = searchValue ? highlight(finalMessage.content.parts.join('\n'), searchValue) : finalMessage.content.parts.join('\n');
            const messageContentPartsHTML = markdown('assistant').render(messageContentParts);
            const wordCount = messageContentParts.split(/[ /]/).length;
            const charCount = messageContentParts.length;
            existingRowAssistantTextWrapper.innerHTML = `${messageContentPartsHTML}`;
            resultCounter.innerHTML = `${charCount} chars / ${wordCount} words`;
            const conversationBottom = document.querySelector('#conversation-bottom');
            if (!scrolUpDetected) {
              conversationBottom.scrollIntoView();
            }
          } else {
            const lastMessageWrapper = [...document.querySelectorAll('[id^="message-wrapper-"]')].pop();
            if (lastMessageWrapper?.dataset?.role !== 'assistant') {
              const existingRowUser = document.querySelector(`[id="message-wrapper-${messageId}"][data-role="user"]`);
              if (existingRowUser) {
                let threadCount = Object.keys(conversation).length > 0 ? conversation?.mapping[messageId]?.children?.length || 1 : 1;
                if (regenerateResponse) threadCount += 1;
                const assistantRow = rowAssistant(conversation, data, threadCount, threadCount);
                const conversationBottom = document.querySelector('#conversation-bottom');
                conversationBottom.insertAdjacentHTML('beforebegin', assistantRow);
                if (!scrolUpDetected) {
                  conversationBottom.scrollIntoView();
                }
              }
            }
          }
          // addCopyCodeButtonsEventListeners();
        } catch (err) {
          syncDiv.style.opacity = '1';
          // if (err.message === 'Unexpected end of JSON input') {
          // }
        }
      }
    });
    chatStream.addEventListener('error', (err) => {
      isGenerating = false;
      syncDiv.style.opacity = '1';
      const main = document.querySelector('main');
      const inputForm = main.querySelector('form');
      const submitButton = inputForm.querySelector('textarea ~ button');
      // submitButton.disabled = false;
      submitButton.innerHTML = '<svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4 mr-1" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>';
      const error = JSON.parse(err.data);
      const errorMessage = typeof error.detail === 'string' ? error.detail : error.detail.message;
      const conversationBottom = document.querySelector('#conversation-bottom');
      const errorMessageElement = `<div class="py-2 px-3 my-2 border text-gray-600 rounded-md text-sm dark:text-gray-100 border-red-500 bg-red-500/10">${errorMessage}</div>`;
      conversationBottom.insertAdjacentHTML('beforebegin', errorMessageElement);
      conversationBottom.scrollIntoView({ behavior: 'smooth' });
    });
  });
}
function overrideSubmitForm() {
  const main = document.querySelector('main');
  if (!main) return;
  const inputForm = main.querySelector('form');
  if (!inputForm) return;
  inputForm.addEventListener('submit', (e) => {
    const textAreaElement = inputForm.querySelector('textarea');
    e.preventDefault();
    e.stopPropagation();
    if (isGenerating) return;
    const { pathname } = new URL(window.location.toString());
    const conversationId = pathname.split('/').pop().replace(/[^a-z0-9-]/gi, '');
    const anyUserMessageWrappers = document.querySelectorAll('[id^="message-wrapper-"][data-role="user"]').length > 0;
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(conversationId) && anyUserMessageWrappers) {
      chrome.storage.local.get(['conversations', 'settings']).then((res) => {
        const { conversations, settings } = res;
        const conversation = conversations[conversationId];
        chrome.storage.sync.get(['name', 'avatar'], (result) => {
          const text = generateInstructions(conversation, settings, textAreaElement.value.trim());

          const messageId = self.crypto.randomUUID();
          const allMessages = document.querySelectorAll('[id^="message-wrapper-"]');
          const lastMessage = allMessages[allMessages.length - 1];
          const parentId = lastMessage?.id?.split('message-wrapper-')[1] || self.crypto.randomUUID();
          const conversationBottom = document.querySelector('#conversation-bottom');
          const node = { message: { id: messageId, content: { parts: [text] } } };
          const userRow = rowUser(conversation, node, 1, 1, result.name, result.avatar);
          conversationBottom.insertAdjacentHTML('beforebegin', userRow);
          conversationBottom.scrollIntoView({ behavior: 'smooth' });
          if (text) {
            isGenerating = true;
            submitChat(text, conversation, messageId, parentId, settings);
            textAreaElement.value = '';
            updateInputCounter('');
          }
        });
      });
    } else {
      chrome.storage.local.get(['settings']).then((res) => {
        const { settings } = res;
        chrome.storage.sync.get(['name', 'avatar'], (result) => {
          const text = generateInstructions({}, settings, textAreaElement.value.trim());
          const messageId = self.crypto.randomUUID();
          const node = { message: { id: messageId, content: { parts: [text] } } };
          const allMessages = document.querySelectorAll('[id^="message-wrapper-"]');
          const lastMessage = allMessages[allMessages.length - 1];
          const parentId = lastMessage?.id?.split('message-wrapper-')[1] || self.crypto.randomUUID();
          // remove main first child
          main.removeChild(main.firstChild);

          const outerDiv = document.createElement('div');
          outerDiv.classList = 'flex-1 overflow-hidden';
          const innerDiv = document.createElement('div');
          innerDiv.classList = 'h-full overflow-y-auto';
          innerDiv.style = 'scroll-behavior: smooth;';
          innerDiv.id = 'conversation-inner-div';
          addScrollDetector(innerDiv);
          const conversationDiv = document.createElement('div');
          conversationDiv.classList = 'flex flex-col items-center text-sm h-full dark:bg-gray-800';
          const userRow = rowUser({}, node, 1, 1, result.name, result.avatar);
          conversationDiv.innerHTML = userRow;
          const bottomDiv = document.createElement('div');
          bottomDiv.id = 'conversation-bottom';
          bottomDiv.classList = 'w-full h-32 md:h-48 flex-shrink-0';
          conversationDiv.appendChild(bottomDiv);

          innerDiv.appendChild(conversationDiv);
          outerDiv.appendChild(innerDiv);
          main.prepend(outerDiv);
          if (text) {
            isGenerating = true;
            submitChat(text, {}, messageId, parentId, settings);
            textAreaElement.value = '';
            updateInputCounter('');
          }
        });
      });
    }
  });
  // textAreaElement.addEventListener('keydown', (e) => {
  //   if (e.key === 'Enter' && e.which === 13 && !e.shiftKey) {
  //     disableTextInput = true;
  //     if (textAreaElement.value.trim().length === 0) {
  //       e.preventDefault();
  //       e.stopPropagation();
  //       return;
  //     }
  //     if (isGenerating) return;
  //     inputForm.dispatchEvent(new Event('submit', { cancelable: true }));
  //   }
  // });
  const submitButton = inputForm.querySelector('textarea ~ button');
  const submitButtonClone = submitButton.cloneNode(true);
  submitButtonClone.type = 'button';
  submitButtonClone.addEventListener('click', () => {
    const textAreaElement = inputForm.querySelector('textarea');
    if (isGenerating) return;
    if (textAreaElement.value.trim().length === 0) return;
    textAreaElement.style.height = '24px';
    addUserPromptToHistory(textAreaElement.value.trim());
    inputForm.dispatchEvent(new Event('submit', { cancelable: true }));
  });
  submitButton.parentNode.replaceChild(submitButtonClone, submitButton);
}

function syncLocalConversation(conversationId, key, value) {
  chrome.storage.local.get(['conversations'], (result) => {
    const { conversations } = result;
    conversations[conversationId][key] = value;
    chrome.storage.local.set({ conversations }, () => {
      if (key === 'archived' && value === true) {
        createSearchBox();
      }
    });
  });
}
function setBackButtonDetection() {
  window.addEventListener('popstate', () => {
    const { pathname } = new URL(window.location.toString());
    const conversationId = pathname.split('/').pop().replace(/[^a-z0-9-]/gi, '');
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(conversationId)) {
      chrome.storage.local.get(['conversations'], (result) => {
        const { conversations } = result;
        if (conversations && conversations[conversationId]) {
          const searchbox = document.querySelector('#conversation-search');
          const searchValue = searchbox.value;
          const conversationElement = document.querySelector(`#conversation-button-${conversationId}`);
          const focusedConversations = document.querySelectorAll('.selected');
          focusedConversations.forEach((c) => {
            c.classList = notSelectedClassList;
          });
          // set selected conversation
          conversationElement.classList = selectedClassList;
          loadConversation(conversationId, searchValue);
        }
      });
    } else if (pathname === '/chat') {
      showNewChatPage();
    }
  });
}

// eslint-disable-next-line no-unused-vars
function loadConversationList(skipInputFormReload = false) {
  chrome.storage.local.get(['conversations', 'conversationsAreSynced', 'settings'], async (result) => {
    if (result.conversationsAreSynced && typeof result.conversations !== 'undefined') {
      updateNewChatButtonSynced();
      if (!skipInputFormReload) initializeNavbar();
      if (!skipInputFormReload) replaceTextAreaElemet();
      removeOriginalConversationList();
      createSearchBox();
      loadStorageConversations(result.conversations);
      const { pathname } = new URL(window.location.toString());
      const conversationId = pathname.split('/').pop().replace(/[^a-z0-9-]/gi, '');
      const conversationList = document.querySelector('#conversation-list');
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(conversationId)) {
        if (!result.conversations[conversationId].archived && !result.conversations[conversationId].skipped) {
          const focusedConversation = conversationList.querySelector(`#conversation-button-${conversationId}`);
          if (focusedConversation) {
            focusedConversation.scrollIntoView();
          }
          loadConversation(conversationId);
        } else {
          showNewChatPage();
        }
      } else { // } if (url === 'https://chat.openai.com/chat') {
        showNewChatPage();
      }
      if (!skipInputFormReload) overrideSubmitForm();
      if (!skipInputFormReload) setBackButtonDetection();
    }
  });
}
