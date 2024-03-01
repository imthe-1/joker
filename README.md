# joker

## Goal

Fork and improve this repo so that anyone can clone and run their own server node that
* automatically joins the network of joker nodes (OK to use a hard-coded bootstrap node)
* publishes the CID of a joke every minute
* logs the jokes of every other node on the network

If 10 joker nodes join the network, then every node should log the same 10 jokes per minute.

## Getting Started

```
fork this repo
clone your fork
cd joker
npm install // pure libp2p requires nodejs v20.x
```

To run the hyperswarm based joker network
```
npm run server
```

To run the pure libp2p based joker network:

Start a single bootstrapper node. Then start peer nodes in different terminals using the next command.
```
npm run bootstrapper:libp2p // execute once
npm run server:libp2p // starts a peer node
```
