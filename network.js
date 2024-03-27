import { createHelia } from 'helia';
import { json } from '@helia/json';
import { noise } from '@chainsafe/libp2p-noise';
import { yamux } from '@chainsafe/libp2p-yamux';
import { bootstrap } from '@libp2p/bootstrap';
import { floodsub } from '@libp2p/floodsub';
import { gossipsub } from '@chainsafe/libp2p-gossipsub';
import { identify } from '@libp2p/identify';
import { mplex } from '@libp2p/mplex';
import { pubsubPeerDiscovery } from '@libp2p/pubsub-peer-discovery';
import { tcp } from '@libp2p/tcp';
import { createLibp2p } from 'libp2p';
import { multiaddr } from '@multiformats/multiaddr';
import { webSockets } from '@libp2p/websockets';
import { messageToStream, streamToLog } from './util/stream.js';
import { peerData, swarmKey } from './util/config.js';
import axios from 'axios';
import { EventEmitter } from 'events';
import { preSharedKey, generateKey } from '@libp2p/pnet';
import { toString as uint8ArrayToString } from 'uint8arrays/to-string';
import { fromString as uint8ArrayFromString } from 'uint8arrays/from-string';
import { circuitRelayTransport } from '@libp2p/circuit-relay-v2';

const psk = uint8ArrayFromString(swarmKey);
console.log('[psk]', swarmKey);
console.log('[psk]', uint8ArrayFromString(swarmKey));

EventEmitter.defaultMaxListeners = 100;

const helia = await createHelia();
const ipfs = json(helia);
const mockIPFS = {};

const conns = {};
const createNode = async (bootstrappers = [], opts = {}) => {
  const config = {
    addresses: {
      listen: ['/ip4/0.0.0.0/tcp/0'],
    },
    transports: [
      tcp(),
      webSockets(),
      circuitRelayTransport({
        discoverRelays: 2,
      }),
    ],
    streamMuxers: [yamux(), mplex()],
    connectionEncryption: [noise()],
    peerDiscovery: [
      pubsubPeerDiscovery({
        interval: 1000,
      }),
    ],
    services: {
      pubsub: gossipsub(),
      identify: identify(),
    },
    // connectionManager: {
    //   maxConnections: Infinity,
    //   minConnections: 5,
    // },
    connectionProtector: preSharedKey({
      psk,
    }),
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
  if (peer.id.toString() && peer.id.toString() === '16Uiu2HAmKsh1U5QKRRe3KBQdXQT6LGGHanSMGrsawmC119mHN25F') {
    const relayAddr = multiaddr(peerData.ma[1]);
    const conn = await node.dial(relayAddr);
    console.log(`Connected to the relay ${conn.remotePeer.toString()}`);
  } else if (peer.id.toString() && peer.id.toString() !== '16Uiu2HAmKsh1U5QKRRe3KBQdXQT6LGGHanSMGrsawmC119mHN25F') {
    try {
      const sendStream = await node.dialProtocol(peer.id, '/mdip/p2p/1.0.0', { maxOutboundStreams: Infinity });
      sendStream.peerId = peer.id;
      conns[peer.id.toString()] = sendStream;
    } catch (error) {
      console.log('[initial dial] error', error);
    }
  }
});

node.addEventListener('peer:connect', (evt) => {
  const remotePeer = evt.detail;
  console.log('connected to: ', remotePeer.toString());
});

node.addEventListener('peer:disconnect', (evt) => {
  const remotePeer = evt.detail;
  conns[remotePeer.toString()] = '';
});

node.addEventListener('self:peer:update', (evt) => {
  console.log(`Advertising with a relay address of ${node.getMultiaddrs()[0].toString()}`);
});

await node.handle('/mdip/p2p/1.0.0', async ({ stream }) => {
  streamToLog(stream, logJoke);
});

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
    await logJoke(cid, 'local', joke);

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
    if (stream && stream.peerId) {
      try {
        const sendStream = await node.dialProtocol(stream.peerId, '/mdip/p2p/1.0.0', { maxOutboundStreams: Infinity, force: true });
        messageToStream(json, sendStream);
      } catch (error) {
        console.log('[check relayJoke error]', error);
      }
    }
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

async function logJoke(cid, name, joke) {
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
}, 9e4);

process.on('uncaughtException', (err, origin) => {
  console.log('uncaughtException observed');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('unhandledRejection observed');
});
