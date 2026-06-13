const createRandomId = () => {
  if (window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const generateRandomUser = async () => {
  const storedUser = localStorage.getItem('user');
  if (storedUser) return JSON.parse(storedUser);

  const newUser = {
    id: createRandomId(),
    name: 'Gast',
  };

  localStorage.setItem('user', JSON.stringify(newUser));
  return newUser;
};

const saveUser = (user) => {
  localStorage.setItem('user', JSON.stringify(user));
};

const generateBackendUrl = () => {
  const { protocol, host } = window.location;
  if (protocol === 'http:') return `ws://${host}`;
  if (protocol === 'https:') return `wss://${host}`;
  throw new Error('Unknown protocol');
};

const generateMessage = (message, myUser) => {
  const avatar = document.createElement('div');
  const messageElement = document.createElement('div');
  const messageBox = document.createElement('div');
  const senderElement = document.createElement('p');
  const textElement = document.createElement('p');
  const isMyMessage = message.user.id === myUser.id;

  messageElement.className = 'flex items-end gap-3 px-2 transition-opacity opacity-0 duration-300';
  avatar.className = 'flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold';
  messageBox.className = 'max-w-xs rounded-2xl px-4 py-3 shadow-lg';
  senderElement.className = 'text-xs font-semibold uppercase tracking-[0.2em]';
  textElement.className = 'mt-2 text-sm leading-snug';
  avatar.textContent = message.user.name.slice(0, 1).toUpperCase();
  senderElement.textContent = isMyMessage ? 'Du' : message.user.name;
  textElement.textContent = message.message;

  if (isMyMessage) {
    avatar.classList.add('bg-cyan-400', 'text-slate-950');
    messageBox.classList.add('bg-cyan-400', 'text-slate-950');
    senderElement.classList.add('text-slate-800');
    messageElement.classList.add('justify-end');
  } else {
    avatar.classList.add('bg-slate-700', 'text-white');
    messageBox.classList.add('bg-slate-800', 'text-slate-100');
    senderElement.classList.add('text-cyan-300');
    messageElement.classList.add('justify-start');
  }

  messageBox.appendChild(senderElement);
  messageBox.appendChild(textElement);

  if (isMyMessage) {
    messageElement.appendChild(messageBox);
    messageElement.appendChild(avatar);
  } else {
    messageElement.appendChild(avatar);
    messageElement.appendChild(messageBox);
  }

  return messageElement;
};

const generateUserBadge = (user, myUser) => {
  const badge = document.createElement('span');
  const isCurrentUser = user.id === myUser.id;

  badge.className = 'rounded-full border px-3 py-1 text-sm';
  badge.textContent = isCurrentUser ? `${user.name} (du)` : user.name;

  if (isCurrentUser) {
    badge.classList.add('border-cyan-400/40', 'bg-cyan-400/10', 'text-cyan-200');
  } else {
    badge.classList.add('border-slate-700', 'bg-slate-950/60', 'text-slate-200');
  }

  return badge;
};

const getTypingText = (typingUsers, myUser) => {
  const otherTypingUsers = typingUsers.filter((user) => user.id !== myUser.id);

  if (otherTypingUsers.length === 0) {
    return 'Niemand schreibt gerade.';
  }

  if (otherTypingUsers.length === 1) {
    return `${otherTypingUsers[0].name} schreibt gerade...`;
  }

  return `${otherTypingUsers.map((user) => user.name).join(', ')} schreiben gerade...`;
};

window.chatUtils = {
  generateBackendUrl,
  generateMessage,
  generateRandomUser,
  generateUserBadge,
  getTypingText,
  saveUser,
};
