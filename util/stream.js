import * as lp from 'it-length-prefixed';
import map from 'it-map';
import { pipe } from 'it-pipe';
import { fromString as uint8ArrayFromString } from 'uint8arrays/from-string';
import { toString as uint8ArrayToString } from 'uint8arrays/to-string';

export function messageToStream(message, stream) {
  pipe(
    [message],
    (source) => map(source, (string) => uint8ArrayFromString(string)),
    (source) => lp.encode(source),
    stream.sink
  );
}

export function streamToLog(stream, logJoke) {
  pipe(
    stream.source,
    (source) => lp.decode(source),
    (source) => map(source, (buf) => uint8ArrayToString(buf.subarray())),
    async function (source) {
      // console.log('[source]', source);
      for await (const msg of source) {
        // console.log('> ' + msg.toString().replace('\n', ''));
        const data = JSON.parse(msg.toString().replace('\n', ''));
        // console.log('[check parsed data]', data);
        logJoke(data.cid, 'remotePeer', data.data)
      }
    }
  );
}
