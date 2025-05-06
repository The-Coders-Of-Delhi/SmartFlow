let userInput = document.getElementById('user');
let form = document.getElementById('chat-form');
let responseBox = document.getElementById('response');
let chatHistoryList = document.getElementById('chat-history');
let newChatBtn = document.getElementById('new-chat-btn');

// Variables
let storedUserName = localStorage.getItem('username') || null;
let conversations = JSON.parse(localStorage.getItem('conversations')) || [];
let activeConversationIndex = conversations.length > 0 ? 0 : null;

let help = [
  `<br>📝 <i id="glow">To add a new task: Type To Do followed by your task. Example: To Do Buy groceries</i> <br>`,
  `❌ <i id="glow">To remove a task: Type remove to do or remove to do followed by the task number. Example: remove to do </i> <br>`,
  `📋 <i id="glow">To show your task list: Type show list</i> <br>`,
  `🖥 <i id="glow">In built calculator for basic calculations</i><br>`,
  `💬 <i id="glow">Start a new conversation: Click the 'New Chat' button</i> <br>`,
  `🗑️ <i id="glow">To delete a conversation: Click 'Delete❌' beside the conversation title in the chat list</i> <br>`,
  `🔁 <i id="glow">All chats and tasks are saved automatically in localStorage and persist after reload</i> <br>`,
  `ℹ️ <i id="glow">You can type any message and get a simulated AI response </i><br>`
];

// Functions to save and show chats list
function saveChats() {
  localStorage.setItem('conversations', JSON.stringify(conversations));
}

function showChatList() {
  chatHistoryList.innerHTML = '';
  conversations.forEach((conv, index) => {
    let li = document.createElement('li');
    li.textContent = conv.title;
    if (index === activeConversationIndex) {
      li.className = 'active-chat';
    }

    li.onclick = (e) => {
      if (e.target.className === 'delete-btn') {
        return;
      }
      activeConversationIndex = index;
      showChatList();
      loadChat();
    };

    let delBtn = document.createElement('button');
    delBtn.textContent = 'Delete❌';
    delBtn.className = 'delete-btn';
    delBtn.onclick = (e) => {
      e.stopPropagation();
      deleteChat(index);
    };

    li.appendChild(delBtn);
    chatHistoryList.appendChild(li);
  });
}

function deleteChat(index) {
  if (confirm('Are you sure you want to delete this chat?')) {
    conversations.splice(index, 1);
    if (conversations.length === 0) {
      activeConversationIndex = null;
      responseBox.innerHTML = '';
    } else if (activeConversationIndex >= conversations.length) {
      activeConversationIndex = conversations.length - 1;
    }
    saveChats();
    showChatList();
    loadChat();
  }
}

function loadChat() {
  responseBox.innerHTML = '';
  if (activeConversationIndex === null) {
    return;
  }
  let conv = conversations[activeConversationIndex];
  conv.messages.forEach((msg) => {
    let div = document.createElement('div');
    if (msg.sender === 'user') {
      div.className = 'user-msg';
    } else {
      div.className = 'bot-msg';
    }
    div.innerHTML = msg.content;
    responseBox.appendChild(div);
  });
  responseBox.scrollTop = responseBox.scrollHeight;
}

newChatBtn.onclick = () => {
  let newConv = {
    title: 'Chat ' + (conversations.length + 1),
    messages: [],
    todoList: []
  };
  conversations.push(newConv);
  activeConversationIndex = conversations.length - 1;
  saveChats();
  showChatList();
  loadChat();
};


if (conversations.length === 0) {
  newChatBtn.click();
} else {
  showChatList();
  loadChat();
}

// submit
form.addEventListener('submit', function (e) {
  e.preventDefault();
  let rawText = userInput.value.trim();
  let query = rawText.toLowerCase().replace(/\s+/g, '');

  // Check if there's an active chat
  if (activeConversationIndex === null && rawText) {
    // Create a new chat if there isn't one
    let newConv = {
      title: 'Chat ' + (conversations.length + 1),
      messages: [],
      todoList: []
    };
    conversations.push(newConv);
    activeConversationIndex = conversations.length - 1;
    saveChats();
    showChatList();
    loadChat();
  }

  if (!rawText || activeConversationIndex === null) return;

  let conv = conversations[activeConversationIndex];


  let userMsg = document.createElement('div');
  userMsg.className = 'user-msg';
  userMsg.innerText = rawText;
  responseBox.appendChild(userMsg);
  conv.messages.push({ sender: 'user', content: rawText });
  saveChats();
  responseBox.scrollTop = responseBox.scrollHeight;


  let typingIndicator = document.createElement('div');
  typingIndicator.className = 'bot-msg';
  typingIndicator.innerHTML = `<i>SmartFlow is typing...</i>`;
  responseBox.appendChild(typingIndicator);
  responseBox.scrollTop = responseBox.scrollHeight;

  function respond(message, delay = 1000) {
    setTimeout(() => {
      typingIndicator.remove();
      let botMsg = document.createElement('div');
      botMsg.className = 'bot-msg';
      botMsg.innerHTML = `<b>SmartFlow:</b> ${message}`;
      responseBox.appendChild(botMsg);
      responseBox.scrollTop = responseBox.scrollHeight;
      conv.messages.push({ sender: 'bot', content: `<b>SmartFlow:</b> ${message}` });
      saveChats();
    }, delay);
  }

  
  if (query.startsWith('todo')) {
    let task = rawText.substring(5).trim();
    if (task) {
      conv.todoList.push(task);
      saveChats();
      respond(`Task "${task}" added to your to-do list.`);
    } else {
      respond(`What task would you like to add?`);
    }
  }

  else if (query === 'showlist') {
    if (conv.todoList.length === 0) {
      respond(`Your to-do list is empty.`);
    } else {
      let table = `
        <table>
          <thead>
            <tr>
              <th>S.NO</th>
              <th>Task</th>
            </tr>
          </thead>
          <tbody>
      `;
      conv.todoList.forEach((task, index) => {
        table += `
            <tr>
              <td>${index + 1}</td>
              <td>${task}</td>
            </tr>
          `;
      });
      
      respond(`Here is your to-do list: <br>${table}`);
    }
  }

 else if (query.startsWith('removetodo') || query.startsWith('remove todo')) {
    let numberString = '';
    if (query.startsWith('removetodo')) {
      numberString = rawText.substring(12).trim();
    } else if (query.startsWith('remove todo')) {
      numberString = rawText.substring(11).trim();
    }
 

    let taskNumber = parseInt(numberString) - 1;

    if (!isNaN(taskNumber) && taskNumber >= 0 && taskNumber < conv.todoList.length) {
      let removedTask = conv.todoList.splice(taskNumber, 1)[0];
      saveChats();
      respond(`Task "${removedTask}" removed from your to-do list.`);
    } else if (numberString) {
      respond(`Invalid task number: "${numberString}". Please use the number shown in the to-do list.`);
    } else {
      respond(`Please specify the number of the task you want to remove (e.g., "remove to do 1").`);
    }
  }

  else if (rawText.toLowerCase().startsWith("my name is")) {
    let name = rawText.slice(11).trim();
    storedUserName = name;
    localStorage.setItem('username', name);
    respond(`Nice to meet you, ${name}!`);
  }

  else if (query === 'whatismyname') {
    if (storedUserName) {
      respond(`Your name is ${storedUserName}.`);
    } else {
      respond(`I don't know your name yet. Please tell me by saying "My name is ...".`);
    }
  }

  else if (['hi', 'hello', 'hibro'].includes(query)) {
    respond(`HI! How are you?`);
  }

  else if (query === 'help') {
    respond(`${help}`)
  }

  else if (/what\s+is\s+[-+*/0-9\s().]+/i.test(rawText)) {
    try {
      let expression = rawText.match(/what\s+is\s+(.+)/i)[1];
      let result = Function('"use strict";return (' + expression + ')')();
      if (!isNaN(result)) {
        respond(`The result of ${expression.trim()} is <b>${result}</b>.`);
      } else {
        respond("Sorry, I couldn't calculate that.");
      }
    } catch (err) {
      respond("There was an error while calculating your expression.");
    }
  }


     else {
      respond(`Sorry, I don't understand. Try a different command.<br>For any help type 'help'`);
    }
  

  userInput.value = '';
});

