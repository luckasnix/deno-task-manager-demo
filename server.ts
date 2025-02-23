import { type Route, route } from "@std/http/unstable-route";

import { JsonResponse } from "./utils.ts";
import {
  defaultHandler,
  deleteHandler,
  getHandler,
  postHandler,
  putHandler,
} from "./handlers.ts";

const kv = await Deno.openKv();

const routes: Route[] = [
  {
    pattern: new URLPattern({ pathname: "/tasks/:id?" }),
    method: ["POST", "GET", "PUT", "DELETE"],
    handler: (req, params) => {
      switch (req.method) {
        case "POST":
          return postHandler(req, kv);
        case "GET":
          return getHandler(params, kv);
        case "PUT":
          return putHandler(req, params, kv);
        case "DELETE":
          return deleteHandler(params, kv);
        default:
          return new JsonResponse(
            { error: "Método HTTP não permitido" },
            { status: 405 },
          );
      }
    },
  },
];

Deno.serve({ port: 3000 }, route(routes, defaultHandler));
