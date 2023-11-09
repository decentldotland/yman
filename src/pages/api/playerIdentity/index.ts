import { player1Buffer, player2Buffer, player3Buffer, player4Buffer } from '@/constants';
import EthCrypto from 'eth-crypto';
export default (req: any, res: any) => {
  const choice = req.body.player;

  switch (choice) {
    case "1":
      const player1 = EthCrypto.createIdentity(player1Buffer);
      res.status(200).json({...player1});
      break;
    case "2":
      const player2 = EthCrypto.createIdentity(player2Buffer);
      res.status(200).json({...player2});
      break;
    case "3":
      const player3 = EthCrypto.createIdentity(player3Buffer);
      res.status(200).json({...player3});
      break;
    default:
      const player4 = EthCrypto.createIdentity(player4Buffer);
      res.status(200).json({...player4});
  } 

};


