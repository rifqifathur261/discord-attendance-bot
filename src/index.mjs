import '@blackprint/engine';
import '@blackprint/remote-control';

import { createServer } from "http";
import { Server } from "socket.io";
import dotenv from 'dotenv';
import fs from 'fs';

// Setup the environment, make sure you have inputted your bot token on .env file
dotenv.config();
Blackprint.Environment.import({
	DISCORD_TOKEN: process.env.DISCORD_TOKEN,
});

// Allow module imports from URL
Blackprint.allowModuleOrigin('*'); // Allow load from any URL (localhost/https only)

// JSON exports from the Blackprint Editor
let jsonFromEditor = fs.readFileSync('./src/exported-blackprint.json');

// Create Blackprint instance and import our JSON
let instance = new Blackprint.Engine();
await instance.importJSON(jsonFromEditor);

// Press our button with node ID: connectButton
await instance.iface.connectButton.clicked();

// Export the instance if you want
export { instance };






// ====== Remove code below if you don't want to remote control this Node.js from the editor
let port = 2345;
let httpServer = createServer();
let io = new Server(httpServer, {
  cors: {
    origin: [
		"https://blackprint.github.io", // Online Blackprint Editor
		"http://localhost:6789", // Local Blackprint Editor
	],
  }
});


let remote = new Blackprint.RemoteEngine(instance);
remote.on('module.add', ({ list }) => {
	console.log(`Adding ${list.length} new module, triggered by remote sync`);
});
remote.on('module.added', ({ list, failed }) =>{
	console.log(`${list.length} new module has been added`)

	if(failed.length !== 0)
		console.log(`Failed to add ${failed.length} new module`)
});
remote.on('module.remove', ({ list }) => {
	console.log(`${list.length} module has been removed, triggered by remote sync`);
});
remote.on('disabled', ()=> console.log('Due to some reason, remote control was disabled'));

// Allow import/module sync (return true = allow, false = disable sync)
remote.onImport = v=> console.log("Remote import is allowed") || true;
remote.onModule = v=> console.log("Remote module is allowed") || true;


let engineStartup = Date.now();
io.on('connection', client => {
	client.on('relay', data => remote.onSyncIn(data));
	remote.onSyncOut = data => client.emit('relay', data);

	console.log('Remote control: connected');
	client.on('disconnect', () => console.log('Remote control: disconnected'));

	setTimeout(() => {
		client.emit('startup-time', engineStartup);
	}, 1000);
});

console.log(`Waiting connection on port: ${port}`);
httpServer.listen(port);
// ======
