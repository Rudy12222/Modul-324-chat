(async () => {
  const { generateBackendUrl, generateMessage, generateRandomUser, generateUserBadge, getTypingText, saveUser } =
    window.chatUtils;
  const myUser = await generateRandomUser();
  let activeUsers = [];
  let typingUsers = [];
  const messageList = document.getElementById('messages');
  const messageInput = document.getElementById('messageInput');
  const sendButton = document.getElementById('sendButton');
  const nameInput = document.getElementById('nameInput');
  const saveNameButton = document.getElementById('saveNameButton');
  const userCount = document.getElementById('userCount');
  const userList = document.getElementById('userList');
  const typingStatus = document.getElementById('typingStatus');

  const socket = new WebSocket(generateBackendUrl());

  const renderName = () => {
    nameInput.value = myUser.name;
  };

  const renderActiveUsers = () => {
    const usersToRender = activeUsers.length > 0 ? activeUsers : [myUser];
    userCount.textContent = `${usersToRender.length} online`;
    userList.replaceChildren();

    usersToRender.forEach((user) => {
      userList.appendChild(generateUserBadge(user, myUser));
    });
  };

  const renderTypingUsers = () => {
    typingStatus.textContent = getTypingText(typingUsers, myUser);
  };

  const appendMessage = (message, animate = true) => {
    const messageElement = generateMessage(message, myUser);
    messageList.appendChild(messageElement);
    if (animate) {
      requestAnimationFrame(() => {
        messageElement.classList.add('opacity-100');
      });
    } else {
      messageElement.classList.add('opacity-100');
    }
    messageList.scrollTop = messageList.scrollHeight;
  };

  const renderHistory = (messages) => {
    messageList.replaceChildren();
    messages.forEach((historyMessage) => {
      appendMessage(historyMessage, false);
    });
  };

  const updateMyName = () => {
    const newName = nameInput.value.trim() || 'Gast';
    myUser.name = newName;
    saveUser(myUser);

    activeUsers = activeUsers.map((user) => (user.id === myUser.id ? { ...user, name: newName } : user));
    typingUsers = typingUsers.map((user) => (user.id === myUser.id ? { ...user, name: newName } : user));

    renderName();
    renderActiveUsers();
    renderTypingUsers();

    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'updateUser', user: myUser }));
    }
  };

  const sendMessage = () => {
    const message = messageInput.value.trim();
    if (!message) return;

    socket.send(JSON.stringify({ type: 'message', message, user: myUser }));
    messageInput.value = '';
  };

  socket.addEventListener('open', () => {
    socket.send(JSON.stringify({ type: 'newUser', user: myUser }));
    renderActiveUsers();
    renderTypingUsers();
  });

  socket.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    switch (message.type) {
      case 'message':
        appendMessage(message);
        break;
      case 'activeUsers':
        activeUsers = message.users ?? [];
        renderActiveUsers();
        break;
      case 'typing':
        typingUsers = message.users ?? [];
        renderTypingUsers();
        break;
      case 'history':
        renderHistory(message.messages ?? []);
        break;
      default:
        break;
    }
  });

  socket.addEventListener('close', () => {
    typingStatus.textContent = 'Verbindung getrennt.';
  });

  socket.addEventListener('error', () => {
    typingStatus.textContent = 'Verbindung fehlgeschlagen.';
  });

  sendButton.addEventListener('click', () => {
    sendMessage();
  });

  saveNameButton.addEventListener('click', () => {
    updateMyName();
  });

  nameInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      updateMyName();
    }
  });

  messageInput.addEventListener('input', () => {
    if (messageInput.value.trim()) {
      socket.send(JSON.stringify({ type: 'typing', user: myUser }));
    }
  });

  messageInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      sendMessage();
    }
  });

  renderName();
  renderActiveUsers();
  renderTypingUsers();
})();
