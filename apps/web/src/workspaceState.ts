export function ticketFilterStorageKey(userId: string | undefined, organizationId: string, workspaceType: string | undefined, staff: boolean) {
  return userId ? `jupiter.ticket-filters.${userId}.${organizationId}.${workspaceType ?? 'ORGANIZATION'}.${staff ? 'staff' : 'requester'}` : null;
}

/** Each operation gets a completion predicate; unmount invalidates every operation. */
export function createLatestResultGuard() {
  let generation=0;
  return {
    begin() { const current=++generation;return()=>current===generation; },
    invalidate() { generation++; },
  };
}

export function summarizeSetupSteps(states: Record<string,string>, steps: {key:string;optional?:boolean}[]) {
  const completed=steps.filter(step=>states[step.key]==='COMPLETE').length;
  const skipped=steps.filter(step=>step.optional&&states[step.key]==='SKIPPED').length;
  return {completed,skipped,pending:steps.length-completed-skipped,total:steps.length};
}
