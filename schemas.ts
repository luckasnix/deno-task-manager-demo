import { z } from "zod";

export const taskDataSchema = z.object({
  text: z.string(),
  completed: z.boolean(),
});
