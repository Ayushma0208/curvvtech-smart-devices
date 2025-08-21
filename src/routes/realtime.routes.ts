import { Request, Response, Router } from "express";
import { auth } from "../middlewares/auth";

type Client = { id: string; res: Response; orgId?: string; };
const clients: Client[] = [];

export const realtimeRouter = Router();

realtimeRouter.get("/stream", auth(true), (req: Request, res: Response) => {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive"
  });
  const user = (req as any).user as { id: string; role: string };
  const client: Client = { id: user.id, res, orgId: undefined };
  clients.push(client);
  const ping = setInterval(() => res.write(`event: ping\ndata: ${Date.now()}\n\n`), 15000);
  req.on("close", () => { clearInterval(ping); const i = clients.indexOf(client); if (i>=0) clients.splice(i,1); });
});

// helper to broadcast
export function broadcast(event: string, data: any) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const c of clients) c.res.write(payload);
}
