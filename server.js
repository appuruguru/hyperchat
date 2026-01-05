import express from 'express';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import Hyperswarm from 'hyperswarm';
import b4a from 'b4a';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static('public'));

// Store active swarm connections per WebSocket client
const clients = new Map();

wss.on('connection', (ws) => {
  console.log('Client connected');

  const clientId = crypto.randomBytes(16).toString('hex');
  clients.set(clientId, { ws, swarm: null, peers: new Map() });

  ws.on('message', async (data) => {
    try {
      const message = JSON.parse(data.toString());
      const client = clients.get(clientId);

      if (message.type === 'join-room') {
        // Clean up existing swarm if any
        if (client.swarm) {
          await client.swarm.destroy();
        }

        // Create new swarm
        const swarm = new Hyperswarm();
        client.swarm = swarm;
        client.username = message.username;
        client.room = message.room;

        // Get local peer ID
        const localPeerId = b4a.toString(swarm.keyPair.publicKey, 'hex').substring(0, 6);

        // Join room topic
        const topic = crypto.createHash('sha256').update(message.room).digest();
        console.log(`Joining room "${message.room}" with topic:`, topic.toString('hex'));
        const discovery = swarm.join(topic, { client: true, server: true });

        discovery.flushed().then(() => {
          console.log(`Successfully announced to DHT for room: ${message.room}`);
        });

        // Handle peer connections
        swarm.on('connection', (connection, info) => {
          const peerId = b4a.toString(info.publicKey, 'hex');
          console.log(`[${message.username}] New peer connection from:`, peerId.substring(0, 6));

          client.peers.set(peerId, {
            id: peerId,
            username: 'Unknown',
            connection,
            connected: true
          });

          // Notify client about new peer
          ws.send(JSON.stringify({
            type: 'peer-connected',
            peerId: peerId.substring(0, 6)
          }));

          // Send join message to peer
          const joinMsg = {
            type: 'join',
            sender: message.username,
            content: `${message.username} joined the chat`,
            timestamp: Date.now(),
            room: message.room
          };
          connection.write(JSON.stringify(joinMsg));

          // Handle incoming messages from peer
          connection.on('data', (buffer) => {
            try {
              const peerMessage = JSON.parse(buffer.toString('utf-8'));

              // Update peer username on join
              if (peerMessage.type === 'join') {
                const peer = client.peers.get(peerId);
                if (peer) {
                  peer.username = peerMessage.sender;
                }
              }

              // Forward message to WebSocket client with peer ID
              const peerIdShort = peerId.substring(0, 6);
              ws.send(JSON.stringify({
                type: 'message',
                message: {
                  ...peerMessage,
                  sender: `${peerMessage.sender} (${peerIdShort})`
                }
              }));
            } catch (err) {
              console.error('Error parsing peer message:', err);
            }
          });

          connection.on('close', () => {
            console.log('Peer disconnected:', peerId.substring(0, 6));
            const peer = client.peers.get(peerId);
            if (peer) {
              peer.connected = false;
            }
            ws.send(JSON.stringify({
              type: 'peer-disconnected',
              peerId: peerId.substring(0, 6)
            }));
          });

          connection.on('error', (err) => {
            console.error('Connection error:', err);
          });
        });

        // Send success response
        ws.send(JSON.stringify({
          type: 'join-success',
          peerId: localPeerId
        }));
      }

      if (message.type === 'send-message') {
        const client = clients.get(clientId);
        if (!client.swarm) {
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Not connected to a room'
          }));
          return;
        }

        // Broadcast message to all connected peers
        const chatMessage = {
          type: 'chat',
          sender: client.username,
          content: message.content,
          timestamp: Date.now(),
          room: client.room
        };

        for (const peer of client.peers.values()) {
          if (peer.connected) {
            peer.connection.write(JSON.stringify(chatMessage));
          }
        }

        ws.send(JSON.stringify({
          type: 'send-success'
        }));
      }

      if (message.type === 'leave-room') {
        const client = clients.get(clientId);
        if (client.swarm) {
          await client.swarm.destroy();
          client.swarm = null;
          client.peers.clear();
        }
        ws.send(JSON.stringify({
          type: 'leave-success'
        }));
      }
    } catch (err) {
      console.error('Error handling message:', err);
      ws.send(JSON.stringify({
        type: 'error',
        message: err.message
      }));
    }
  });

  ws.on('close', async () => {
    console.log('Client disconnected');
    const client = clients.get(clientId);
    if (client?.swarm) {
      await client.swarm.destroy();
    }
    clients.delete(clientId);
  });
});

server.listen(PORT, () => {
  console.log(`HyperChat server running on http://localhost:${PORT}`);
});
