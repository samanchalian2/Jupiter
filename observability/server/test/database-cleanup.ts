/** pg Pool.end() can resolve before server-side sockets finish disconnecting.
 * Wait for the generated fixture's actual sessions; never kill a closing client
 * or silence a Pool error to make a test green. */
export async function waitForFixtureDisconnect(readConnections:()=>Promise<number>,timeoutMs=5000,pollMs=25){
 const deadline=Date.now()+timeoutMs;
 for(;;){const count=await readConnections();if(!Number.isSafeInteger(count)||count<0)throw Error('Invalid fixture connection observation');if(count===0)return;if(Date.now()>=deadline)throw Error('Fixture database still has open connections after pool shutdown');await new Promise(done=>setTimeout(done,pollMs));}
}
