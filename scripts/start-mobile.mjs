import { findFreePort, printExpoBanner, startExpo } from './expo-utils.mjs';

const extraArgs = process.argv.slice(2);
const port = await findFreePort();

printExpoBanner({ port });
startExpo(extraArgs, { port });
