import { CONTRACT_ADDR, MEM_WRITE_URL } from "@/constants";
import axios from "axios";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<any>
  ) {
    
    try {
      const { user } = req.body;
      const payload = {
        function: "roll",
        user
      };

      const data = await axios.post(
        MEM_WRITE_URL,
        {
          functionId: CONTRACT_ADDR,
          inputs: [
            {
              input: payload,
              tags: [
                {
                  name: "Protocol-Name",
                  value: "YoctoManji Protocol",
                },
                {
                  name: "Protocol-Action",
                  value: "EnterLobby",
                },
              ],
            },
          ],
        },
        {}
      );
      res.status(200).json(data.data);
    } catch (error) {
      console.error(error);
      //@ts-ignore
      return res.status(error.status || 500).end(error.message);
    }

    /*
    const payload = {
        function: "roll",
        ...req.body
      };
     res.status(200).json({
        functionId: CONTRACT_ADDR,
        inputs: [
          {
            input: payload,
            tags: [
              {
                name: "Protocol-Name",
                value: "YoctoManji Protocol",
              },
              {
                name: "Protocol-Action",
                value: "EnterLobby",
              },
            ],
          },
        ],
      })
      */
}