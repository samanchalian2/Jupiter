import { BadRequestException } from '@nestjs/common';

export type TicketStatus = 'DRAFT' | 'OPEN' | 'IN_PROGRESS' | 'WAITING_FOR_REQUESTER' | 'RESOLVED' | 'CLOSED';

const transitions: Record<TicketStatus, readonly TicketStatus[]> = {
  DRAFT: ['OPEN'],
  OPEN: ['IN_PROGRESS', 'RESOLVED'],
  IN_PROGRESS: ['WAITING_FOR_REQUESTER', 'RESOLVED'],
  WAITING_FOR_REQUESTER: ['IN_PROGRESS'],
  RESOLVED: ['CLOSED', 'OPEN'],
  CLOSED: ['OPEN'],
};

export function assertTransition(from: TicketStatus, to: TicketStatus) {
  if (!transitions[from].includes(to)) throw new BadRequestException('Invalid ticket status transition');
}
