import { toJson } from "@std/streams/to-json";

import { todoDataSchema } from "./schemas.ts";
import type { Todo, TodoData } from "./types.ts";

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
  const isBodyValid = todoDataSchema.safeParse(body).success;
  // Exceção: Validade dos dados do corpo da requisição
  if (!isBodyValid) {
    return new Response(
      JSON.stringify({ error: "O corpo da requisição está inválido" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }
  const todoId = crypto.randomUUID();
  const todo: Todo = {
    id: todoId,
    data: body as TodoData,
  };
  // Rotina: Criação da tarefa no banco de dados
  const result = await kv.set(["todos", todoId], todo);
  // Exceção: Processo no banco de dados
  if (!result.ok) {
    return new Response(
      JSON.stringify({ error: "A tarefa não pôde ser criada" }),
      { status: 404, headers: { "Content-Type": "application/json" } },
    );
  }
  return new Response(
    JSON.stringify({ message: "A tarefa foi criada com sucesso", data: todo }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
};

export const getHandler = async (
  params: URLPatternResult | null | undefined,
  kv: Deno.Kv,
): Promise<Response> => {
  const todoId = params?.pathname.groups.id;
  // Rotina: Buscar todas as tarefas se não existir "id" no pathname da URL
  if (!todoId) {
    const todoEntries = kv.list({ prefix: ["todos"] });
    const todos: Todo[] = [];
    for await (const todoEntry of todoEntries) {
      todos.push(todoEntry.value as Todo);
    }
    return new Response(
      JSON.stringify({ data: todos }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }
  // Rotina: Buscar a tarefa requisitada se existir o "id" no pathname da URL
  const todoEntry = await kv.get(["todos", todoId]);
  const todo = todoEntry.value as Todo | null;
  // Exceção: Existência da tarefa no banco de dados
  if (!todo) {
    return new Response(
      JSON.stringify({ error: "Nenhum tarefa encontrada" }),
      { status: 404, headers: { "Content-Type": "application/json" } },
    );
  }
  return new Response(
    JSON.stringify({ data: todo }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
};

export const putHandler = async (
  req: Request,
  params: URLPatternResult | null | undefined,
  kv: Deno.Kv,
): Promise<Response> => {
  const todoId = params?.pathname.groups.id;
  // Exceção: Existência do "id" no pathname da URL
  if (!todoId) {
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
  const isBodyValid = todoDataSchema.safeParse(body).success;
  // Exceção: Validade dos dados do corpo da requisição
  if (!isBodyValid) {
    return new Response(
      JSON.stringify({ error: "O corpo da requisição está inválido" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }
  const todo: Todo = {
    id: todoId,
    data: body as TodoData,
  };
  // Rotina: Atualização da tarefa no banco de dados
  const result = await kv.set(["todos", todoId], todo);
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
      data: todo,
    }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
};

export const deleteHandler = async (
  params: URLPatternResult | null | undefined,
  kv: Deno.Kv,
): Promise<Response> => {
  const todoId = params?.pathname.groups.id;
  // Exceção: Existência do "id" no pathname da URL
  if (!todoId) {
    return new Response(
      JSON.stringify({ error: "O 'id' da tarefa não foi fornecido" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }
  // Rotina: Deleção da tarefa no banco de dados
  await kv.delete(["todos", todoId]);
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
