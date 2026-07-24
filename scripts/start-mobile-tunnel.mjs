import { findFreePort, printExpoBanner, startExpo } from './expo-utils.mjs';

const extraArgs = process.argv.slice(2);
const port = await findFreePort(8090);

printExpoBanner({ port, tunnel: true });
startExpo(extraArgs, { port, tunnel: true });
