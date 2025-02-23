import { toJson } from "@std/streams/to-json";

import { JsonResponse } from "./utils.ts";
import { taskDataSchema } from "./schemas.ts";
import type { Task, TaskData } from "./types.ts";

export const postHandler = async (
  req: Request,
  kv: Deno.Kv,
): Promise<Response> => {
  // Exceção: Existência do corpo da requisição
  if (!req.body) {
    return new JsonResponse(
      { error: "O corpo da requisição está ausente" },
      { status: 400 },
    );
  }
  const body = await toJson(req.body);
  const isBodyValid = taskDataSchema.safeParse(body).success;
  // Exceção: Validade dos dados do corpo da requisição
  if (!isBodyValid) {
    return new JsonResponse(
      { error: "O corpo da requisição está inválido" },
      { status: 400 },
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
    return new JsonResponse(
      { error: "A tarefa não pôde ser criada" },
      { status: 404 },
    );
  }
  return new JsonResponse(
    { message: "A tarefa foi criada com sucesso", data: task },
    { status: 200 },
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
    return new JsonResponse(
      { data: tasks },
      { status: 200 },
    );
  }
  // Rotina: Buscar a tarefa requisitada se existir o "id" no pathname da URL
  const taskEntry = await kv.get(["tasks", taskId]);
  const task = taskEntry.value as Task | null;
  // Exceção: Existência da tarefa no banco de dados
  if (!task) {
    return new JsonResponse(
      { error: "Nenhuma tarefa encontrada" },
      { status: 404 },
    );
  }
  return new JsonResponse(
    { data: task },
    { status: 200 },
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
    return new JsonResponse(
      { error: "O 'id' da tarefa não foi fornecido" },
      { status: 400 },
    );
  }
  // Exceção: Existência do corpo da requisição
  if (!req.body) {
    return new JsonResponse(
      { error: "O corpo da requisição está ausente" },
      { status: 400 },
    );
  }
  const body = await toJson(req.body);
  const isBodyValid = taskDataSchema.safeParse(body).success;
  // Exceção: Validade dos dados do corpo da requisição
  if (!isBodyValid) {
    return new JsonResponse(
      { error: "O corpo da requisição está inválido" },
      { status: 400 },
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
    return new JsonResponse(
      { error: "A tarefa não pôde ser atualizada" },
      { status: 404 },
    );
  }
  return new JsonResponse(
    { message: "A tarefa foi atualizada com sucesso", data: task },
    { status: 200 },
  );
};

export const deleteHandler = async (
  params: URLPatternResult | null | undefined,
  kv: Deno.Kv,
): Promise<Response> => {
  const taskId = params?.pathname.groups.id;
  // Exceção: Existência do "id" no pathname da URL
  if (!taskId) {
    return new JsonResponse(
      { error: "O 'id' da tarefa não foi fornecido" },
      { status: 400 },
    );
  }
  // Rotina: Deleção da tarefa no banco de dados
  await kv.delete(["tasks", taskId]);
  return new JsonResponse(
    { message: "A tarefa foi deletada com sucesso" },
    { status: 200 },
  );
};

export const defaultHandler = () => {
  return new JsonResponse(
    { error: "O recurso não foi encontrado" },
    { status: 404 },
  );
};
