//TODO use dotenv 
const peerPort = 54824;

export const peerData = {
  encryptedKey: 'mpxZAUfRREHJjcVBYBQuczHMIsJH41+4xdfcYsPAFS18RERf85PPO9tUTwYjzlOveIh5LH86podgmCX8YkgtwW+VMhh+/b229nC4Ii3Bqegw',
  password: 'oTVtCt/fYE0ojUlc',
  peerId: '16Uiu2HAmKsh1U5QKRRe3KBQdXQT6LGGHanSMGrsawmC119mHN25F',
  port: peerPort,
  ma: [
    `/ip4/127.0.0.1/tcp/${peerPort}/p2p/16Uiu2HAmKsh1U5QKRRe3KBQdXQT6LGGHanSMGrsawmC119mHN25F`,
    `/ip4/192.168.29.107/tcp/${peerPort}/p2p/16Uiu2HAmKsh1U5QKRRe3KBQdXQT6LGGHanSMGrsawmC119mHN25F`,
    // `/ip4/3.234.61.236/tcp/${peerPort}/p2p/16Uiu2HAmKsh1U5QKRRe3KBQdXQT6LGGHanSMGrsawmC119mHN25F`
  ]
};

export const swarmKey = '/key/swarm/psk/1.0.0/\n/base16/\na8f9e73f544d06f5d4e28bae4647236e12d75670eaafa72597b2957bcb265164';
