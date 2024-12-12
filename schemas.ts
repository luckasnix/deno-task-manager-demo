import { z } from "zod";

export const todoDataSchema = z.object({
  text: z.string(),
  completed: z.boolean(),
});
