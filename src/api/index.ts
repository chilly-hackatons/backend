import { handle } from "@hono/node-server/vercel";
import { app } from "..";

export default handle(app);