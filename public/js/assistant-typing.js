// public/js/assistant-typing.js
// Adds a character-by-character typing effect for assistant replies.
// Usage: include this script AFTER the main chat script so it can wrap appendMessage/render logic.

(function(){
  const DEFAULT_SPEED = 18; // ms per character — adjust to taste

  function removeTypingPlaceholders(){
    document.querySelectorAll('.msg.typing').forEach(el=>{
      if(el && el.parentNode) el.parentNode.removeChild(el);
    });
  }

  function htmlEscape(text){
    return String(text || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  // Type text into an element (preserves newline as line-break)
  function typeTextIntoElement(el, text, msPerChar = DEFAULT_SPEED){
    if(!el) return Promise.resolve();
    // ensure element is empty and prepared
    el.innerHTML = ''; // we'll insert text as text nodes + <br> for newlines
    const parts = String(text).split('\n');
    let charIndex = 0;
    let partIndex = 0;
    let currentNode = document.createTextNode('');
    el.appendChild(currentNode);

    return new Promise(resolve=>{
      function step(){
        // if finished all parts
        if(partIndex >= parts.length) {
          resolve();
          return;
        }
        const part = parts[partIndex];
        if(charIndex < part.length){
          // append next character
          const nextChar = part.charAt(charIndex);
          currentNode.nodeValue += nextChar;
          charIndex++;
          // schedule next char
          setTimeout(step, msPerChar + Math.random()*6); // add tiny jitter so it feels more human
        } else {
          // finished this line; if more lines, add <br> and continue
          partIndex++;
          charIndex = 0;
          if(partIndex < parts.length){
            // add line break and a new text node
            el.appendChild(document.createElement('br'));
            currentNode = document.createTextNode('');
            el.appendChild(currentNode);
            // small pause at newline
            setTimeout(step, msPerChar * 6);
          } else {
            resolve();
            return;
          }
        }
      }
      step();
    });
  }

  // Wait for the chat renderer to complete so DOM contains the inserted empty assistant bubble.
  function waitForAssistantBubble(timeout = 2000){
    return new Promise((resolve, reject)=>{
      const start = Date.now();
      function check(){
        const area = document.getElementById('chat-area');
        if(area){
          // find last assistant bubble which has empty/short content or a typing placeholder
          const msgs = area.querySelectorAll('.msg.msg-assistant, .msg-assistant');
          if(msgs.length){
            const last = msgs[msgs.length - 1];
            resolve(last);
            return;
          }
        }
        if(Date.now() - start > timeout){ reject(new Error('assistant bubble not found')); return; }
        requestAnimationFrame(check);
      }
      check();
    });
  }

  // Wrap existing appendMessage to animate assistant messages.
  function wrapAppendMessage(){
    if(!window.appendMessage) {
      // appendMessage not present yet; try again shortly
      setTimeout(wrapAppendMessage, 80);
      return;
    }

    if(window.__assistantTypingWrapped) return;
    window.__assistantTypingWrapped = true;

    const orig = window.appendMessage.bind(window);

    window.appendMessage = function(from, message){
      // if it's assistant -> add empty message and animate
      if(from === 'assistant'){
        // remove any existing typing placeholders
        removeTypingPlaceholders();

        // call original with empty string so topics/rendering still works
        try { orig(from, ''); } catch(e){ orig(from, message); return; }

        // After DOM updated, find last assistant bubble and type into it
        waitForAssistantBubble().then(async (bubbleEl)=>{
          try{
            // If bubbleEl contains a typing placeholder element (older approach), remove it
            const typingInside = bubbleEl.querySelector && bubbleEl.querySelector('.typing-dots');
            if(typingInside){
              bubbleEl.innerHTML = '';
            }
            // Type the message
            await typeTextIntoElement(bubbleEl, message, DEFAULT_SPEED);
          }catch(err){
            // Fallback: if anything goes wrong, just set text
            bubbleEl.textContent = message;
          }
        }).catch(()=>{
          // couldn't find bubble in time — fallback to original behavior (replace last assistant message)
          // find and replace last assistant message in topics if possible
          try{
            // best-effort: find DOM last .msg-assistant
            const area = document.getElementById('chat-area');
            if(area){
              const msgs = area.querySelectorAll('.msg.msg-assistant, .msg-assistant');
              if(msgs.length){
                msgs[msgs.length-1].textContent = message;
                return;
              }
            }
          }catch(e){}
        });

      } else {
        // user/system messages use original behavior
        orig(from, message);
      }
    };
  }

  // initialize wrapper after DOM is ready
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', wrapAppendMessage);
  } else {
    wrapAppendMessage();
  }

})();
