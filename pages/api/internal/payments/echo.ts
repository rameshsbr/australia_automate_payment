import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("content-type", "application/json");
  res.status(200).send(
    JSON.stringify(
      {
        method: req.method,
        body: req.body ?? null,
        headers: {
          "content-type": req.headers["content-type"],
          cookie: req.headers.cookie ?? null,
        },
      },
      null,
      2,
    ),
  );
}
