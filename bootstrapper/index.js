import { noise } from '@chainsafe/libp2p-noise';
import { yamux } from '@chainsafe/libp2p-yamux';
import { bootstrap } from '@libp2p/bootstrap';
import { floodsub } from '@libp2p/floodsub';
import { identify } from '@libp2p/identify';
import { mplex } from '@libp2p/mplex';
import { pubsubPeerDiscovery } from '@libp2p/pubsub-peer-discovery';
import { tcp } from '@libp2p/tcp';
import { createLibp2p } from 'libp2p';
import { webSockets } from '@libp2p/websockets';
import { createFromPrivKey } from '@libp2p/peer-id-factory';
import { generateKeyPair, importKey } from '@libp2p/crypto/keys';
import { EventEmitter } from 'events';
import { peerData } from '../util/config.js';

EventEmitter.defaultMaxListeners = 100;

// const newKeypair = await generateKeyPair('secp256k1');
// const exported = await newKeypair.export('');
// console.log('[exported]', exported);
const keypair = await importKey(peerData.encryptedKey, peerData.password);
const peerId = await createFromPrivKey(keypair);

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

const bootstrapper = await createNode([], { peerId, addresses: { listen: [`/ip4/0.0.0.0/tcp/${peerData.port}`] } });
console.log(`libp2p bootstrapper started with id: ${bootstrapper.peerId.toString()}`);

const bootstrapperMultiaddrs = bootstrapper.getMultiaddrs().map((m) => m.toString());
console.log(bootstrapperMultiaddrs);
