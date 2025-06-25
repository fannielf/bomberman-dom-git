# bomberman-dom-git

## Getting Started
1. Start the WebSocket Server
In the server/ directory:

bash ´´
cd server
node index.js
´´

Make sure you have installed the ws package:
npm install (if package.json exists) or npm install ws

2. Open the Frontend with Live Server
From the project root (or wherever your index.html is):

Right-click index.html in VS Code

Select "Open with Live Server"

### Notes
index.html connects to the WebSocket server at ws://localhost:3000

Make sure the server is running before opening the HTML in browser