/** Centralised TanStack Query key management. */
export const queryKeys = {
  tasks: ['tasks'] as const,
  users: ['users'] as const,
  sprints: ['sprints'] as const,
  comments: (taskId: number) => ['comments', taskId] as const,
  notificationsInitial: ['notifications', 'initial'] as const,
  notificationsPoll: ['notifications', 'poll'] as const,
}
