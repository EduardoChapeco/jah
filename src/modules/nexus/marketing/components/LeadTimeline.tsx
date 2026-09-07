import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
    MessageSquare, 
    Phone, 
    Mail, 
    Calendar, 
    FileText, 
    Settings, 
    CheckCircle2,
    Clock
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface LeadTimelineProps {
    leadId: string;
    pessoaId?: string;
}

const activityIcons: Record<string, any> = {
    call: Phone,
    email: Mail,
    chat: MessageSquare,
    note: FileText,
    task: Clock,
    system: Settings,
};

const activityColors: Record<string, string> = {
    call: "bg-blue-50 text-blue-600",
    email: "bg-yellow-50 text-yellow-600",
    chat: "bg-emerald-50 text-emerald-600",
    note: "bg-orange-50 text-orange-600",
    task: "bg-purple-50 text-purple-600",
    system: "bg-slate-50 text-slate-600",
};

export function LeadTimeline({ leadId, pessoaId }: LeadTimelineProps) {
    const { data: timelineItems, isLoading } = useQuery({
        queryKey: ["lead-timeline", leadId, pessoaId],
        queryFn: async () => {
            // Fetch Activities
            const activitiesPromise = supabase
                .from("lead_activities")
                .select("*")
                .eq("lead_id", leadId)
                .order("created_at", { ascending: false });

            // Fetch Chats if pessoaId exists
            const chatsPromise = pessoaId ? supabase
                .from("chat_messages")
                .select(`
                    *,
                    conversation:chat_conversations(*)
                `)
                .or(`sender_id.eq.${pessoaId}`)
                .order("created_at", { ascending: false })
                .limit(20) : Promise.resolve({ data: [], error: null });

            const [activitiesRes, chatsRes] = await Promise.all([activitiesPromise, chatsPromise]);

            if (activitiesRes.error) throw activitiesRes.error;
            if (chatsRes.error) throw chatsRes.error;

            const activities = activitiesRes.data.map(a => ({
                ...a,
                is_chat: false
            }));

            const chats = (chatsRes.data || []).map(c => ({
                id: c.id,
                created_at: c.created_at,
                tipo: 'chat',
                content: c.content,
                metadata: { 
                    conversation_tipo: (c.conversation as any)?.tipo,
                    is_sender: c.sender_id === pessoaId
                },
                is_chat: true
            }));

            // Merge and sort
            return [...activities, ...chats].sort((a, b) => 
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );
        },
        enabled: !!leadId,
    });

    if (isLoading) {
        return (
            <div className="space-y-6 mt-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="flex gap-4">
                        <Skeleton className="h-10 w-10 rounded-xl" />
                        <div className="space-y-2 flex-1">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-12 w-full" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (!timelineItems || timelineItems.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 opacity-30">
                <Clock className="h-12 w-12 mb-4" />
                <p className="font-bold uppercase text-[10px] tracking-widest text-center">
                    Nenhuma atividade ou conversa registrada
                </p>
            </div>
        );
    }

    return (
        <div className="relative space-y-8 mt-6">
            <div className="absolute left-5 top-2 bottom-2 w-0.5 bg-slate-100" />
            
            {timelineItems.map((item) => {
                const Icon = activityIcons[item.tipo] || Settings;
                const colorClass = activityColors[item.tipo] || activityColors.system;
                const isChat = (item as any).is_chat;
                const isSender = (item.metadata as any)?.is_sender;

                return (
                    <div key={item.id} className="relative flex gap-4 animate-in fade-in slide-in-from-left-2 duration-300">
                        <div className={cn(
                            "z-10 w-10 h-10 rounded-xl flex items-center justify-center transition-transform hover:scale-110",
                            colorClass
                        )}>
                            <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 pt-1">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    {format(new Date(item.created_at), "dd 'de' MMM, HH:mm", { locale: ptBR })}
                                    {isChat && " • Chat"}
                                </span>
                            </div>
                            <div className={cn(
                                "border p-4 rounded-xl shadow-sm transition-all hover:shadow-md",
                                isChat 
                                    ? (isSender ? "bg-emerald-50 border-emerald-100 italic" : "bg-blue-50 border-blue-100") 
                                    : "bg-white border-slate-100"
                            )}>
                                <p className={cn(
                                    "text-sm font-medium leading-relaxed",
                                    isChat ? "text-slate-600" : "text-slate-700"
                                )}>
                                    {item.content}
                                </p>
                                {item.metadata && Object.keys(item.metadata).length > 0 && !isChat && (
                                    <div className="mt-2 pt-2 border-t border-slate-50">
                                        <pre className="text-[10px] text-slate-400 font-mono overflow-x-auto">
                                            {JSON.stringify(item.metadata, null, 2)}
                                        </pre>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
