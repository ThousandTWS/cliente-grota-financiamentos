export type MessageStatus = "sent" | "delivered" | "read" | "voice";

export type MessageDirection = "inbound" | "outbound";

export type ConversationStage =
  | "novo"
  | "em_atendimento"
  | "aguardando_cliente"
  | "finalizado";

export type EmployeeStatus = "online" | "ocupado" | "offline";

export type EmployeeSummary = {
  id: string;
  name: string;
  role: string;
  status: EmployeeStatus;
  load: number;
};

export type ChatPreviewItem = {
  id: string;
  type: "text" | "voice";
  content: string;
  duration?: string;
  status: MessageStatus;
  pinned?: boolean;
};

export type ChatMessage = {
  id: string;
  direction: MessageDirection;
  author: string;
  content: string;
  timestamp: string;
  status?: MessageStatus;
};

export type Conversation = {
  id: string;
  customerName: string;
  customerPhone: string;
  customerSegment: string;
  verified?: boolean;
  avatarColor: string;
  unreadCount: number;
  stage: ConversationStage;
  assignedTo: EmployeeSummary;
  lastSeenLabel: string;
  tags: string[];
  proposalCode: string;
  vehicleLabel: string;
  previews: ChatPreviewItem[];
  messages: ChatMessage[];
};
