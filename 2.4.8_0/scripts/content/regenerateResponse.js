/* eslint-disable no-restricted-globals */
// eslint-disable-next-line no-unused-vars
/* global canSubmitPrompt, submitChat, toggleTextAreaElemet, isGenerating:true */
function toggleOriginalRegenerateResponseButton() {
  const allMessageWrapper = document.querySelectorAll('[id^="message-wrapper-"]');
  const lastMessageWrapperElement = allMessageWrapper[allMessageWrapper.length - 1];
  const anyUserMessageWrappers = document.querySelectorAll('[id^="message-wrapper-"][data-role="user"]').length > 0;
  const main = document.querySelector('main');
  if (!main) return;
  const inputForm = main.querySelector('form');
  if (!inputForm) return;
  const submitButton = inputForm.querySelector('textarea ~ button');
  if (!submitButton) return;
  const canSubmit = canSubmitPrompt();

  const textAreaElement = inputForm.querySelector('textarea');
  if (!textAreaElement) return;
  const textAreaElementWrapper = textAreaElement.parentNode;
  const nodeBeforetTextAreaElement = textAreaElementWrapper.previousSibling;
  // find all button without id
  const allButtons = Array.from(nodeBeforetTextAreaElement.querySelectorAll('button:not([id])'));
  const originalRegenerateResponseButton = allButtons.find((button) => button.textContent.toLowerCase() === 'regenerate response');
  if (originalRegenerateResponseButton) {
    originalRegenerateResponseButton.remove();
  }
  const existingRegenerateResponseButton = document.querySelector('#regenerate-response-button');
  if (existingRegenerateResponseButton) {
    existingRegenerateResponseButton.remove();
  }
  const existingErrorMessage = nodeBeforetTextAreaElement.querySelector('span');
  if (existingErrorMessage && existingErrorMessage.textContent === 'There was an error generating a response') {
    nodeBeforetTextAreaElement.style.flexWrap = 'unset';
    existingErrorMessage.remove();
  }
  if (!canSubmit) return;
  if (!anyUserMessageWrappers) return;

  const newRegenerateResponseButton = document.createElement('button');
  newRegenerateResponseButton.id = 'regenerate-response-button';
  newRegenerateResponseButton.type = 'button';
  newRegenerateResponseButton.classList = `btn flex justify-center gap-2 ${textAreaElementWrapper.style.display === 'none' ? 'btn-primary' : 'btn-neutral'} border-0 md:border`;
  newRegenerateResponseButton.innerHTML = '<svg stroke="currentColor" fill="none" stroke-width="1.5" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" class="h-3 w-3" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><polyline points="1 4 1 10 7 10"></polyline><polyline points="23 20 23 14 17 14"></polyline><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"></path></svg> Regenerate response';
  newRegenerateResponseButton.addEventListener('click', () => {
    chrome.storage.local.get(['conversations', 'settings'], (result) => {
      const { pathname } = new URL(window.location.toString());
      const conversationId = pathname.split('/').pop().replace(/[^a-z0-9-]/gi, '');
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(conversationId)) return;
      const conversation = result.conversations?.[conversationId];
      // last element with id starting with message-wrapepr and data-role=user
      const allUserMessageWrappers = document.querySelectorAll('[id^="message-wrapper-"][data-role="user"]');
      const lastUserMessageWrapper = allUserMessageWrappers.item(allUserMessageWrappers.length - 1);
      while (lastUserMessageWrapper.nextElementSibling && lastUserMessageWrapper.nextElementSibling.id.startsWith('message-wrapper-')) {
        lastUserMessageWrapper.nextElementSibling.remove();
      }
      const lastUserChatMessageId = lastUserMessageWrapper.id.split('message-wrapper-')[1];
      const lastUserMessage = conversation.mapping[lastUserChatMessageId];
      const newMessage = lastUserMessage.message.content.parts.join('\n');
      const parentId = lastUserMessage.parent;
      newRegenerateResponseButton.remove();
      const errorMessage = nodeBeforetTextAreaElement.querySelector('span');
      if (errorMessage && errorMessage.textContent === 'There was an error generating a response') {
        nodeBeforetTextAreaElement.style.flexWrap = 'unset';
        errorMessage.remove();
      }
      toggleTextAreaElemet(true);
      isGenerating = true;
      submitChat(newMessage, conversation, lastUserChatMessageId, parentId, result.settings, true);
    });
  });
  // handle error message
  const erroMessageHTML = '<span class="mb-3 flex justify-center w-full block text-xs md:mb-auto">There was an error generating a response</span>';
  if (lastMessageWrapperElement.dataset.role === 'user') {
    nodeBeforetTextAreaElement.style.flexWrap = 'wrap';
    nodeBeforetTextAreaElement.insertAdjacentHTML('afterbegin', erroMessageHTML);
  } else {
    nodeBeforetTextAreaElement.style.flexWrap = 'unset';
  }

  nodeBeforetTextAreaElement.appendChild(newRegenerateResponseButton);
}

// eslint-disable-next-line no-unused-vars
function initializeRegenerateResponseButton() {
  toggleOriginalRegenerateResponseButton();
  // const observer = new MutationObserver(() => {
  //   const { pathname } = new URL(window.location.toString());;
  //   const urlConversationId = pathname.split('/').pop().replace(/[^a-z0-9-]/gi, '');
  //   if (/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(urlConversationId)) {
  //     replaceOriginalRegenerateResponseButton(urlConversationId);
  //   }
  // });
  // observer.observe(main, { childList: true, subtree: true });
}
