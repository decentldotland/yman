import { MSG } from '@/constants';
import EthCrypto from 'eth-crypto';
export default (req: any, res: any) => {
  // Replace these with your actual private key and address
  const privateKey = req.body.privvy;
  const counter = req.body.counter;
  
  const message = EthCrypto.hash.keccak256([
  {type: "string", value: MSG}
  ]);
  const signature = EthCrypto.sign(privateKey, message);

  res.status(200).json({counter});
};