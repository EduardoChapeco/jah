import { useState } from "react";
import { QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { toggleLeadChecklist, updateLeadDetails } from "@/services/crm.functions";

export function useLeadChecklist(leadId: string | undefined, qc: QueryClient) {
  const [checklistInput, setChecklistInput] = useState("");

  async function toggleChecklistItem(list: any[] | undefined, itemId: string, done: boolean) {
    if (!leadId) return;
    try {
      await toggleLeadChecklist({ data: { leadId, itemId } });
      qc.invalidateQueries({ queryKey: ["lead-detail", leadId] });
      qc.invalidateQueries({ queryKey: ["leads-crm"] });
    } catch (e) {
      toast.error("Falha ao salvar checklist");
    }
  }

  async function addChecklistItem(list: any[] | undefined, e: React.FormEvent) {
    e.preventDefault();
    if (!leadId || !checklistInput.trim()) return;
    const currentList = list || [];
    const newItem = {
      id: crypto.randomUUID(),
      text: checklistInput.trim(),
      done: false,
    };
    const updated = [...currentList, newItem];
    try {
      await updateLeadDetails({ data: { leadId, checklist: updated } });
      setChecklistInput("");
      qc.invalidateQueries({ queryKey: ["lead-detail", leadId] });
      qc.invalidateQueries({ queryKey: ["leads-crm"] });
      toast.success("Item adicionado ao checklist!");
    } catch (e) {
      toast.error("Falha ao adicionar item");
    }
  }

  async function deleteChecklistItem(list: any[] | undefined, itemId: string) {
    if (!leadId) return;
    const currentList = list || [];
    const updated = currentList.filter((item) => item.id !== itemId);
    try {
      await updateLeadDetails({ data: { leadId, checklist: updated } });
      qc.invalidateQueries({ queryKey: ["lead-detail", leadId] });
      qc.invalidateQueries({ queryKey: ["leads-crm"] });
    } catch (e) {
      toast.error("Falha ao remover item");
    }
  }

  return {
    checklistInput,
    setChecklistInput,
    toggleChecklistItem,
    addChecklistItem,
    deleteChecklistItem,
  };
}
