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
      code: body.code,
      redirect_uri: body.redirectUri,
      state: body.state,
      scope: [
        "public_repo",
        "read:org",
        "read:public_key",
        "read:repo_hook",
        "read:user",
        "repo_deployment",
        "repo:status",
        "repo",
        "user",
        "workflow",
      ].join(" "),
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
  } catch (e) {
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
