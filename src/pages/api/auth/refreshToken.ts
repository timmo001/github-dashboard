import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";

const allowedMethods = ["HEAD", "POST"];

async function handler(req: NextApiRequest, res: NextApiResponse<unknown>) {
  res.setHeader("Allow", allowedMethods);
  const { body, method, url } = req;

  if (method !== "POST") {
    res.status(405).end(`Method ${method} Not Allowed`);
    return;
  }

  try {
    const data = {
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      grant_type: "refresh_token",
      refresh_token: body.refreshToken,
    };
    console.log("data:", data);
    const response = await axios.post<any>(
      "https://github.com/login/oauth/access_token",
      data,
      {
        headers: {
          Accept: "application/json",
        },
      }
    );
    console.log(
      "response:",
      response.status,
      response.statusText,
      response.data
    );
    res.status(200).json(response.data);
  } catch (e: any) {
    console.error(e);
    res.status(500).json({
      status: 500,
      message: e.message,
      request: {
        body,
        method,
        url,
      },
    });
  }
}

export default handler;
