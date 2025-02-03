import { toJson } from "@std/streams/to-json";

import { taskDataSchema } from "./schemas.ts";
import type { Task, TaskData } from "./types.ts";

export const postHandler = async (
  req: Request,
  kv: Deno.Kv,
): Promise<Response> => {
  // Exceção: Existência do corpo da requisição
  if (!req.body) {
    return new Response(
      JSON.stringify({ error: "O corpo da requisição está ausente" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }
  const body = await toJson(req.body);
  const isBodyValid = taskDataSchema.safeParse(body).success;
  // Exceção: Validade dos dados do corpo da requisição
  if (!isBodyValid) {
    return new Response(
      JSON.stringify({ error: "O corpo da requisição está inválido" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }
  const taskId = crypto.randomUUID();
  const task: Task = {
    id: taskId,
    data: body as TaskData,
  };
  // Rotina: Criação da tarefa no banco de dados
  const result = await kv.set(["tasks", taskId], task);
  // Exceção: Processo no banco de dados
  if (!result.ok) {
    return new Response(
      JSON.stringify({ error: "A tarefa não pôde ser criada" }),
      { status: 404, headers: { "Content-Type": "application/json" } },
    );
  }
  return new Response(
    JSON.stringify({ message: "A tarefa foi criada com sucesso", data: task }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
};

export const getHandler = async (
  params: URLPatternResult | null | undefined,
  kv: Deno.Kv,
): Promise<Response> => {
  const taskId = params?.pathname.groups.id;
  // Rotina: Buscar todas as tarefas se não existir "id" no pathname da URL
  if (!taskId) {
    const taskEntries = kv.list({ prefix: ["tasks"] });
    const tasks: Task[] = [];
    for await (const taskEntry of taskEntries) {
      tasks.push(taskEntry.value as Task);
    }
    return new Response(
      JSON.stringify({ data: tasks }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }
  // Rotina: Buscar a tarefa requisitada se existir o "id" no pathname da URL
  const taskEntry = await kv.get(["tasks", taskId]);
  const task = taskEntry.value as Task | null;
  // Exceção: Existência da tarefa no banco de dados
  if (!task) {
    return new Response(
      JSON.stringify({ error: "Nenhum tarefa encontrada" }),
      { status: 404, headers: { "Content-Type": "application/json" } },
    );
  }
  return new Response(
    JSON.stringify({ data: task }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
};

export const putHandler = async (
  req: Request,
  params: URLPatternResult | null | undefined,
  kv: Deno.Kv,
): Promise<Response> => {
  const taskId = params?.pathname.groups.id;
  // Exceção: Existência do "id" no pathname da URL
  if (!taskId) {
    return new Response(
      JSON.stringify({ error: "O 'id' da tarefa não foi fornecido" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }
  // Exceção: Existência do corpo da requisição
  if (!req.body) {
    return new Response(
      JSON.stringify({ error: "O corpo da requisição está ausente" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }
  const body = await toJson(req.body);
  const isBodyValid = taskDataSchema.safeParse(body).success;
  // Exceção: Validade dos dados do corpo da requisição
  if (!isBodyValid) {
    return new Response(
      JSON.stringify({ error: "O corpo da requisição está inválido" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }
  const task: Task = {
    id: taskId,
    data: body as TaskData,
  };
  // Rotina: Atualização da tarefa no banco de dados
  const result = await kv.set(["tasks", taskId], task);
  // Exceção: Processo no banco de dados
  if (!result.ok) {
    return new Response(
      JSON.stringify({ error: "A tarefa não pôde ser atualizada" }),
      { status: 404, headers: { "Content-Type": "application/json" } },
    );
  }
  return new Response(
    JSON.stringify({
      message: "A tarefa foi atualizada com sucesso",
      data: task,
    }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
};

export const deleteHandler = async (
  params: URLPatternResult | null | undefined,
  kv: Deno.Kv,
): Promise<Response> => {
  const taskId = params?.pathname.groups.id;
  // Exceção: Existência do "id" no pathname da URL
  if (!taskId) {
    return new Response(
      JSON.stringify({ error: "O 'id' da tarefa não foi fornecido" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }
  // Rotina: Deleção da tarefa no banco de dados
  await kv.delete(["tasks", taskId]);
  return new Response(
    JSON.stringify({ message: "A tarefa foi deletada com sucesso" }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
};

export const defaultHandler = () => {
  return new Response(
    JSON.stringify({ error: "O recurso não foi encontrado" }),
    { status: 404, headers: { "Content-Type": "application/json" } },
  );
};
