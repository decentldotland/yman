import EthCrypto from 'eth-crypto';
export default (req: any, res: any) => {
  // Replace these with your actual private key and address
  const privateKey = req.body.privvy;
  const address = req.body.addy;
  
  const signerIdentity = EthCrypto.createIdentity();
  const message = EthCrypto.hash.keccak256([
  {type: "string",value: "Hello World!"}
  ]);
  const signature = EthCrypto.sign(privateKey, message);
  console.log(`message: ${message}`);
  console.log(`signature: ${signature}`);
  res.status(200).json({message: message, signature: signature});
};