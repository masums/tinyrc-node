# tinyRC

tinyRC is a cross-platform screensharing and remote desktop tool, with an emphasis on remotely playing desktop games and emulators on a mobile device.
This repo hosts the signaling server for the project. For the desktop client, see the [tinyrc-electron](https://github.com/iffyloop/tinyrc-electron) repo, and for the mobile client, visit the [tinyrcapp](https://github.com/iffyloop/tinyrcapp) repo.

## Getting Started

### Prerequisites

Node.js and npm are required to run this software. The latest versions of both should be fine.

### Installing

Clone the repository

```
git clone https://github.com/iffyloop/tinyrc-node.git && cd tinyrc-node
```

Install dependencies from npm

```
npm install
```

## Running the server

```
node .
```

## Coding style

This project adheres to [JS Standard Style](https://standardjs.com).

## Deployment

You should enable secure WebSockets with Let's Encrypt if you plan on using this seriously (in any situation where a Man-in-the-Middle Attack is likely, e.g., using someone else's network to control your device). Using self-signed certificates makes React Native debugging difficult. See index.js for instructions.

## License

This project is Unlicensed - see [LICENSE](LICENSE) for details.
