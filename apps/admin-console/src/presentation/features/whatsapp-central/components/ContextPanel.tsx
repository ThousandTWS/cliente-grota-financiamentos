"use client";

import { BarChart3, Clock3, PhoneCall, UserRoundCog, Wifi } from "lucide-react";
import type { Conversation, EmployeeSummary } from "../types";

type ContextPanelProps = {
  conversation: Conversation;
  employees: EmployeeSummary[];
};

const employeeStatusClass = {
  online: "bg-emerald-400",
  ocupado: "bg-amber-400",
  offline: "bg-slate-500",
};

export function ContextPanel({ conversation, employees }: ContextPanelProps) {
  return (
    <aside className="flex h-full min-h-0 flex-col gap-3 border-l border-white/6 bg-[#111b21] p-3">
      <section className="rounded-2xl border border-white/6 bg-[#202c33] p-4">
        <p className="text-xs uppercase tracking-[0.28em] text-white/32">
          Cliente ativo
        </p>
        <h3 className="mt-3 text-xl font-semibold text-white">
          {conversation.customerName}
        </h3>
        <p className="mt-1 text-sm text-white/52">{conversation.vehicleLabel}</p>

        <div className="mt-5 space-y-3 text-sm text-white/70">
          <div className="flex items-center justify-between">
            <span>Codigo da proposta</span>
            <span className="font-semibold text-white">{conversation.proposalCode}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Telefone</span>
            <span className="font-semibold text-white">{conversation.customerPhone}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Status</span>
            <span className="font-semibold capitalize text-white">
              {conversation.stage.replaceAll("_", " ")}
            </span>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {conversation.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-sky-400/18 bg-sky-400/8 px-3 py-1 text-xs font-medium text-sky-200"
            >
              {tag}
            </span>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-white/6 bg-[#202c33] p-4">
        <div className="flex items-center gap-2">
          <UserRoundCog className="size-4 text-sky-300" />
          <h4 className="text-sm font-semibold uppercase tracking-[0.22em] text-white/78">
            Funcionarios
          </h4>
        </div>

        <div className="mt-4 space-y-3">
          {employees.map((employee) => (
            <div
              key={employee.id}
              className={`rounded-2xl border px-4 py-3 ${
                employee.id === conversation.assignedTo.id
                  ? "border-[#2a3942] bg-[#111b21]"
                  : "border-white/6 bg-[#111b21]"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">{employee.name}</p>
                  <p className="text-xs text-white/45">{employee.role}</p>
                </div>
                <span className="flex items-center gap-2 text-xs text-white/52">
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${employeeStatusClass[employee.status]}`}
                  />
                  {employee.status}
                </span>
              </div>
              <div className="mt-3">
                <div className="mb-2 flex items-center justify-between text-xs text-white/45">
                  <span>Carga atual</span>
                  <span>{employee.load} chats</span>
                </div>
                <div className="h-2 rounded-full bg-white/8">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-[#00a884] to-[#25d366]"
                    style={{ width: `${Math.min(employee.load * 8, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3">
        {[
          { label: "Tempo medio", value: "06m 42s", icon: Clock3 },
          { label: "SLAs hoje", value: "94%", icon: BarChart3 },
          { label: "Chamadas", value: "12", icon: PhoneCall },
          { label: "Online", value: "3", icon: Wifi },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-white/6 bg-[#202c33] p-4"
          >
            <item.icon className="size-4 text-sky-300" />
            <p className="mt-3 text-xs uppercase tracking-[0.2em] text-white/34">
              {item.label}
            </p>
            <p className="mt-1 text-lg font-semibold text-white">{item.value}</p>
          </div>
        ))}
      </section>
    </aside>
  );
}
