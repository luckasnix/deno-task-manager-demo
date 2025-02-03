export type TaskData = {
  text: string;
  completed: boolean;
};

export type Task = {
  id: string;
  data: TaskData;
};
