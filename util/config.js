//TODO use dotenv 
const peerPort = 54824;

export const peerData = {
  encryptedKey: 'mpxZAUfRREHJjcVBYBQuczHMIsJH41+4xdfcYsPAFS18RERf85PPO9tUTwYjzlOveIh5LH86podgmCX8YkgtwW+VMhh+/b229nC4Ii3Bqegw',
  password: 'oTVtCt/fYE0ojUlc',
  peerId: '16Uiu2HAmKsh1U5QKRRe3KBQdXQT6LGGHanSMGrsawmC119mHN25F',
  port: peerPort,
  ma: [
    `/ip4/127.0.0.1/tcp/${peerPort}/p2p/16Uiu2HAmKsh1U5QKRRe3KBQdXQT6LGGHanSMGrsawmC119mHN25F`,
    `/ip4/192.168.29.107/tcp/${peerPort}/p2p/16Uiu2HAmKsh1U5QKRRe3KBQdXQT6LGGHanSMGrsawmC119mHN25F`
  ]
};
