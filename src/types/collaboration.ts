import {
  Collaboration as PrismaCollaboration,
  CollaborationStatus,
  Message as PrismaMessage,
} from "@prisma/client";

export { CollaborationStatus };

export interface CollaborationWithDetails extends PrismaCollaboration {
  brand: {
    id: string;
    companyName: string;
    logoUrl: string | null;
  };
  creator: {
    id: string;
    displayName: string;
    handle: string;
    avatarUrl: string | null;
  };
  messages?: PrismaMessage[];
}

export interface CreateCollaborationDto {
  brandId: string;
  creatorId: string;
  title: string;
  description: string;
  deliverables?: string;
  budgetAmount?: number;
  currency?: string;
}

export interface SendMessageDto {
  collaborationId?: string;
  senderId: string;
  receiverId: string;
  content: string;
}
