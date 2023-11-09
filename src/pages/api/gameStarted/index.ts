import { CONTRACT_ADDR, MEM_READ_URL } from '@/constants';
import axios from 'axios';
export default async (req: any, res: any) => {
  const url = MEM_READ_URL+CONTRACT_ADDR
  const counter = await axios(url);

  res.status(200).json(counter.data.is_game_started);
};