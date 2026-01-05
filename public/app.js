// WebSocket connection
let ws = null;

// App state
let currentUsername = '';
let currentUsernameWithPeerId = '';
let currentRoom = '';
let messages = [];
let peerCount = 0;

// DOM elements
const joinScreen = document.getElementById('join-screen');
const chatScreen = document.getElementById('chat-screen');
const usernameInput = document.getElementById('username');
const roomInput = document.getElementById('room');
const joinBtn = document.getElementById('join-btn');
const errorMsg = document.getElementById('error-msg');
const roomNameEl = document.getElementById('room-name');
const userInfoEl = document.getElementById('user-info');
const peerCountEl = document.getElementById('peer-count');
const messagesEl = document.getElementById('messages');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');
const leaveBtn = document.getElementById('leave-btn');

// Initialize WebSocket connection
function connectWebSocket() {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  ws = new WebSocket(`${protocol}//${window.location.host}`);

  ws.onopen = () => {
    console.log('WebSocket connected');
  };

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    handleServerMessage(data);
  };

  ws.onclose = () => {
    console.log('WebSocket disconnected');
    setTimeout(connectWebSocket, 1000);
  };

  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
  };
}

// Handle messages from server
function handleServerMessage(data) {
  switch (data.type) {
    case 'join-success':
      currentUsernameWithPeerId = `${currentUsername} (${data.peerId})`;
      renderChatScreen();
      break;

    case 'message':
      addMessage(data.message);
      break;

    case 'peer-connected':
      peerCount++;
      updatePeerCount();
      addSystemMessage(`Peer ${data.peerId} connected`);
      break;

    case 'peer-disconnected':
      peerCount--;
      updatePeerCount();
      addSystemMessage(`Peer ${data.peerId} disconnected`);
      break;

    case 'send-success':
      // Message sent successfully
      break;

    case 'leave-success':
      showJoinScreen();
      break;

    case 'error':
      errorMsg.textContent = data.message;
      break;
  }
}

// Join room
joinBtn.addEventListener('click', handleJoin);
usernameInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') roomInput.focus();
});
roomInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') handleJoin();
});

function handleJoin() {
  const username = usernameInput.value.trim();
  const room = roomInput.value.trim();

  if (!username || !room) {
    errorMsg.textContent = 'Please enter both username and room name';
    return;
  }

  currentUsername = username;
  currentRoom = room;

  ws.send(JSON.stringify({
    type: 'join-room',
    username,
    room
  }));

  joinBtn.disabled = true;
  joinBtn.textContent = 'Joining...';
}

// Send message
sendBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') sendMessage();
});

function sendMessage() {
  const content = messageInput.value.trim();
  if (!content) return;

  ws.send(JSON.stringify({
    type: 'send-message',
    content
  }));

  // Add own message to UI immediately
  addMessage({
    type: 'chat',
    sender: currentUsernameWithPeerId,
    content,
    timestamp: Date.now(),
    own: true
  });

  messageInput.value = '';
}

// Leave room
leaveBtn.addEventListener('click', () => {
  ws.send(JSON.stringify({
    type: 'leave-room'
  }));
});

// UI functions
function renderChatScreen() {
  joinScreen.classList.remove('active');
  chatScreen.classList.add('active');

  roomNameEl.textContent = `Room: ${currentRoom}`;
  userInfoEl.textContent = currentUsernameWithPeerId;
  messages = [];
  messagesEl.innerHTML = '';
  peerCount = 0;
  updatePeerCount();

  joinBtn.disabled = false;
  joinBtn.textContent = 'Join Room';
  messageInput.focus();
}

function showJoinScreen() {
  chatScreen.classList.remove('active');
  joinScreen.classList.add('active');
  currentUsername = '';
  currentUsernameWithPeerId = '';
  currentRoom = '';
  errorMsg.textContent = '';
}

function addMessage(message) {
  messages.push(message);

  const msgEl = document.createElement('div');
  msgEl.className = `message ${message.own ? 'own' : 'peer'}`;

  if (!message.own) {
    const senderEl = document.createElement('div');
    senderEl.className = 'message-sender';
    senderEl.textContent = message.sender;
    msgEl.appendChild(senderEl);
  }

  const contentEl = document.createElement('div');
  contentEl.className = 'message-content';
  contentEl.textContent = message.content;
  msgEl.appendChild(contentEl);

  const timeEl = document.createElement('div');
  timeEl.className = 'message-time';
  timeEl.textContent = new Date(message.timestamp).toLocaleTimeString();
  msgEl.appendChild(timeEl);

  messagesEl.appendChild(msgEl);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function addSystemMessage(content) {
  const msgEl = document.createElement('div');
  msgEl.className = 'message system';

  const contentEl = document.createElement('div');
  contentEl.className = 'message-content';
  contentEl.textContent = content;
  msgEl.appendChild(contentEl);

  messagesEl.appendChild(msgEl);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function updatePeerCount() {
  peerCountEl.textContent = `${peerCount} peer${peerCount !== 1 ? 's' : ''}`;
}

// Initialize
connectWebSocket();
