import { createHelia } from 'helia';
import { json } from '@helia/json';
import { noise } from '@chainsafe/libp2p-noise';
import { yamux } from '@chainsafe/libp2p-yamux';
import { bootstrap } from '@libp2p/bootstrap';
import { floodsub } from '@libp2p/floodsub';
import { identify } from '@libp2p/identify';
import { mplex } from '@libp2p/mplex';
import { pubsubPeerDiscovery } from '@libp2p/pubsub-peer-discovery';
import { tcp } from '@libp2p/tcp';
import { createLibp2p } from 'libp2p';
import { multiaddr } from '@multiformats/multiaddr';
import { webSockets } from '@libp2p/websockets';
import { messageToStream, streamToLog } from './util/stream.js';
import { peerData } from './util/config.js';
import axios from 'axios';
import { EventEmitter } from 'events';

EventEmitter.defaultMaxListeners = 100;

const helia = await createHelia();
const ipfs = json(helia);
const mockIPFS = {};
const nodes = {};

const conns = {};
const createNode = async (bootstrappers = [], opts = {}) => {
  const config = {
    addresses: {
      listen: ['/ip4/0.0.0.0/tcp/0'],
    },
    transports: [tcp(), webSockets()],
    streamMuxers: [yamux(), mplex()],
    connectionEncryption: [noise()],
    peerDiscovery: [
      pubsubPeerDiscovery({
        interval: 1000,
      }),
    ],
    services: {
      pubsub: floodsub(),
      identify: identify(),
    },
    ...opts,
  };

  if (bootstrappers.length > 0) {
    config.peerDiscovery.push(
      bootstrap({
        list: bootstrappers,
      })
    );
  }
  return await createLibp2p(config);
};

const bootsMA = peerData.ma;
console.log('[bootstrapper MA]', bootsMA);

const node = await createNode(bootsMA);
node.addEventListener('peer:discovery', async (evt) => {
  const peer = evt.detail;
  console.log(`Peer ${node.peerId.toString()} discovered: ${peer.id.toString()}`);

  let peerMA = peer.multiaddrs[1]?.toString();
  if (peerMA) {
    const sendStream = await node.dialProtocol(multiaddr(peerMA), '/mdip/p2p/1.0.0');
    conns[peer.id.toString()] = sendStream;
  }
});

node.addEventListener('peer:connect', (evt) => {
  const remotePeer = evt.detail;
  console.log('connected to: ', remotePeer.toString());
});

node.addEventListener('peer:disconnect', (evt) => {
  const remotePeer = evt.detail;
  console.log('disconnected from: ', remotePeer.toString());
  conns[remotePeer.toString()] = '';
});

await node.handle('/mdip/p2p/1.0.0', async ({ stream }) => {
  streamToLog(stream);
});
console.log('[past handler]');

console.log('node ready, listening on:');
console.log(node.getMultiaddrs());

async function getJoke() {
  const response = await axios.get('https://icanhazdadjoke.com/', {
    headers: {
      'User-Agent': 'joker (https://github.com/macterra/joker)',
      Accept: 'application/json',
    },
  });

  return {
    ...response.data,
    time: new Date().toISOString(),
  };
}

async function publishJoke1(joke) {
  try {
    const cid = await ipfs.add(joke);

    mockIPFS[cid] = joke;
    await logJoke(cid, 'local');

    const msg = {
      cid: cid.toString(),
      data: joke,
      relays: [],
    };

    await relayJoke(msg);
  } catch (error) {
    console.log(error);
  }
}

async function relayJoke(msg) {
  const json = JSON.stringify(msg);

  for (const conn in conns) {
    const stream = conns[conn];
    messageToStream(json, stream);
  }
}

const getPeerCount = (conns) => {
  let count = 0;
  for (const conn in conns) {
    if (conns[conn]) {
      count++;
    }
  }
  return count;
};

async function logJoke(cid, name) {
  const joke = mockIPFS[cid];

  console.log(`from: ${name}`);
  console.log(cid);
  console.log(joke.joke);
  const activeConns = getPeerCount(conns);
  console.log(`--- ${activeConns} nodes connected, ${Object.keys(conns).length} nodes detected`);
}

async function main() {
  const joke = await getJoke();
  await publishJoke1(joke);
}

setInterval(async () => {
  try {
    await main();
  } catch (error) {
    console.error(`Error: ${error}`);
  }
}, 1e4);
