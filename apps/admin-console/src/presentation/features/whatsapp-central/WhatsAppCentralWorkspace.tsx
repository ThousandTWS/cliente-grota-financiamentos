"use client";

import { useMemo, useState } from "react";
import { AppRail } from "./components/AppRail";
import { ConversationList } from "./components/ConversationList";
import { ConversationWorkspace } from "./components/ConversationWorkspace";
import { ContextPanel } from "./components/ContextPanel";
import { mockConversations, mockEmployees } from "./mock-data";

export function WhatsAppCentralWorkspace() {
  const [activeConversationId, setActiveConversationId] = useState(
    mockConversations[0]?.id ?? "",
  );

  const activeConversation = useMemo(
    () =>
      mockConversations.find((conversation) => conversation.id === activeConversationId) ??
      mockConversations[0],
    [activeConversationId],
  );

  if (!activeConversation) {
    return null;
  }

  return (
    <div className="h-[calc(100vh-64px)] overflow-hidden bg-[#0b141a]">
      <div className="grid h-full min-h-0 grid-cols-[72px_420px_minmax(0,1fr)] 2xl:grid-cols-[72px_420px_minmax(0,1fr)_320px]">
        <AppRail />
        <div className="min-h-0">
          <ConversationList
            conversations={mockConversations}
            activeConversationId={activeConversation.id}
            onSelect={setActiveConversationId}
          />
        </div>
        <div className="min-h-0">
          <ConversationWorkspace conversation={activeConversation} />
        </div>
        <div className="hidden min-h-0 2xl:block">
          <ContextPanel
            conversation={activeConversation}
            employees={mockEmployees}
          />
        </div>
      </div>
    </div>
  );
}
