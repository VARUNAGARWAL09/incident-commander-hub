import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Send, X, Minimize2, Sparkles, MessageSquare, ChevronRight, AlertTriangle, ShieldCheck, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useIncidents } from '@/context/IncidentsContext';
import { useSimulation } from '@/context/SimulationContext';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    type?: 'text' | 'data' | 'action';
    data?: any;
}

export function AssistantChatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Connect to app state
    const { incidents } = useIncidents();
    const { alerts, isRunning } = useSimulation();

    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'welcome',
            role: 'assistant',
            content: "Hello, I'm IRIS, your SOC Assistant. I can help you monitor incidents, analyze alerts, or check system status. How can I assist you today?",
            timestamp: new Date(),
        }
    ]);

    // Auto-scroll to bottom of chat
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping, isOpen]);

    const handleSendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!inputValue.trim()) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: inputValue,
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMsg]);
        setInputValue('');
        setIsTyping(true);

        // Simulate AI processing delay
        setTimeout(() => {
            const response = generateResponse(userMsg.content);
            setMessages(prev => [...prev, response]);
            setIsTyping(false);
        }, 1000 + Math.random() * 1000);
    };

    const generateResponse = (query: string): Message => {
        const lowerQuery = query.toLowerCase();
        const timestamp = new Date();

        // If no incidents loaded yet
        if (incidents.length === 0 && (lowerQuery.includes('incident') || lowerQuery.includes('case') || lowerQuery.includes('show') || lowerQuery.includes('find'))) {
            return {
                id: Date.now().toString(),
                role: 'assistant',
                content: `📋 No incidents in the system yet.\n\n💡 To get started:\n• Navigate to the Incidents page\n• Click "New Incident" to create one\n• Ask me about "alerts" or "system status" instead`,
                timestamp,
            };
        }

        // SPECIFIC INCIDENT LOOKUP by case_number  
        const incidentMatch = query.match(/INC-(\d+)|incident\s+(\d+)|case\s+(\d+)/i);
        if (incidentMatch && incidents.length > 0) {
            const searchTerm = (incidentMatch[1] || incidentMatch[2] || incidentMatch[3]).padStart(3, '0');
            const incident = incidents.find(i =>
                i.case_number?.toUpperCase() === `INC-${searchTerm}` ||
                i.case_number?.toUpperCase().includes(searchTerm) ||
                i.id === searchTerm
            );

            if (incident) {
                return {
                    id: Date.now().toString(),
                    role: 'assistant',
                    content: `📋 **${incident.title}** (${incident.case_number || incident.id})\n\n🔴 Severity: ${incident.severity.toUpperCase()}\n📊 Status: ${incident.status}\n📅 Created: ${format(new Date(incident.created_at), 'MMM dd, yyyy HH:mm')}\n⏱️ Last Updated: ${format(new Date(incident.updated_at), 'MMM dd, yyyy HH:mm')}${incident.closed_at ? `\n✅ Closed: ${format(new Date(incident.closed_at), 'MMM dd HH:mm')}` : ''}\n\n📝 Description:\n${incident.description || 'No description available'}\n\n🔗 Alerts: ${incident.alert_count || 0}\n🔍 Evidence: ${incident.evidence_count || 0} item(s)${incident.tags?.length ? `\n🏷️ Tags: ${incident.tags.join(', ')}` : ''}`,
                    timestamp,
                    type: 'data',
                };
            } else {
                const recentIncidents = incidents.slice(0, 5);
                return {
                    id: Date.now().toString(),
                    role: 'assistant',
                    content: `❌ Incident not found.\n\n📋 Recent incidents you can ask about:\n\n${recentIncidents.map((inc, i) => `${i + 1}. **${inc.case_number || inc.id}** - ${inc.title}\n   ${inc.severity} | ${inc.status}`).join('\n\n')}\n\nTry: "Show ${recentIncidents[0]?.case_number || recentIncidents[0]?.id}"`,
                    timestamp,
                };
            }
        }

        // SEARCH INCIDENTS BY KEYWORD
        if ((lowerQuery.includes('find') || lowerQuery.includes('search') || lowerQuery.includes('look for')) && incidents.length > 0) {
            const keywords = lowerQuery.replace(/(find|search|look for|incident|case|about)/g, '').trim();
            if (keywords.length > 2) {
                const matched = incidents.filter(i =>
                    i.title.toLowerCase().includes(keywords) ||
                    (i.description && i.description.toLowerCase().includes(keywords)) ||
                    i.tags?.some(tag => tag.toLowerCase().includes(keywords))
                );

                if (matched.length > 0) {
                    return {
                        id: Date.now().toString(),
                        role: 'assistant',
                        content: `🔍 Found ${matched.length} incident(s) matching "${keywords}":\n\n${matched.slice(0, 5).map((inc, i) => `${i + 1}. **${inc.case_number || inc.id}** - ${inc.title}\n   ${inc.severity} | ${inc.status}`).join('\n\n')}${matched.length > 5 ? `\n\n...and ${matched.length - 5} more.` : ''}`,
                        timestamp,
                        type: 'data',
                    };
                } else {
                    return {
                        id: Date.now().toString(),
                        role: 'assistant',
                        content: `❌ No incidents found matching "${keywords}". Try "show incidents" to see all.`,
                        timestamp,
                    };
                }
            }
        }

        // INCIDENT QUERIES - General
        if ((lowerQuery.includes('incident') || lowerQuery.includes('case')) && incidents.length > 0) {
            const criticalIncidents = incidents.filter(i => i.severity === 'critical');
            const highIncidents = incidents.filter(i => i.severity === 'high');
            const openIncidents = incidents.filter(i => i.status === 'open' || i.status === 'investigating');
            const resolvedIncidents = incidents.filter(i => i.status === 'resolved');

            if (lowerQuery.includes('critical') || lowerQuery.includes('urgent')) {
                if (criticalIncidents.length === 0) {
                    return {
                        id: Date.now().toString(),
                        role: 'assistant',
                        content: `✅ Good news! No critical incidents. There are ${highIncidents.length} high-severity cases.`,
                        timestamp,
                    };
                }
                return {
                    id: Date.now().toString(),
                    role: 'assistant',
                    content: `⚠️ Found ${criticalIncidents.length} critical incident(s):\n\n${criticalIncidents.slice(0, 3).map((inc, i) => `${i + 1}. **${inc.case_number || inc.id}** - ${inc.title}\n   Status: ${inc.status}\n   Created: ${format(new Date(inc.created_at), 'MMM dd HH:mm')}`).join('\n\n')}`,
                    timestamp,
                    type: 'data',
                };
            }

            if (lowerQuery.includes('list') || lowerQuery.includes('all') || lowerQuery.includes('show')) {
                return {
                    id: Date.now().toString(),
                    role: 'assistant',
                    content: `📊 All Incidents (${incidents.length} total):\n\n${incidents.slice(0, 8).map((inc, i) => `${i + 1}. **${inc.case_number || inc.id}** - ${inc.title}\n   ${inc.severity} | ${inc.status}`).join('\n\n')}${incidents.length > 8 ? `\n\n...and ${incidents.length - 8} more.` : ''}`,
                    timestamp,
                    type: 'data',
                };
            }

            return {
                id: Date.now().toString(),
                role: 'assistant',
                content: `📊 Incident Overview:\n• ${openIncidents.length} active\n• ${criticalIncidents.length} critical, ${highIncidents.length} high\n• ${resolvedIncidents.length} resolved\n• ${incidents.length} total\n\nAsk about a case number for details.`,
                timestamp,
                type: 'data',
            };
        }

        // ALERT QUERIES
        if (lowerQuery.includes('alert') || lowerQuery.includes('threat') || lowerQuery.includes('detection')) {
            const pendingAlerts = alerts.filter(a => a.status === 'pending');
            const acknowledgedAlerts = alerts.filter(a => a.status === 'acknowledged');

            if (lowerQuery.includes('pending') || lowerQuery.includes('new')) {
                if (pendingAlerts.length === 0) {
                    return {
                        id: Date.now().toString(),
                        role: 'assistant',
                        content: `✅ All alerts acknowledged. ${acknowledgedAlerts.length} being investigated.`,
                        timestamp,
                    };
                }
                return {
                    id: Date.now().toString(),
                    role: 'assistant',
                    content: `🔔 ${pendingAlerts.length} pending alert(s):\n\n${pendingAlerts.slice(0, 5).map((alert, i) => `${i + 1}. ${alert.title}\n   Source: ${alert.source} | ${alert.severity}\n   Time: ${format(new Date(alert.timestamp), 'HH:mm:ss')}`).join('\n\n')}`,
                    timestamp,
                    type: 'data',
                };
            }

            if (lowerQuery.includes('recent') || lowerQuery.includes('latest')) {
                return {
                    id: Date.now().toString(),
                    role: 'assistant',
                    content: `🔍 Recent Alerts:\n\n${alerts.slice(0, 8).map((alert, i) => `${i + 1}. ${alert.title}\n   ${alert.severity} | ${alert.status}`).join('\n\n')}`,
                    timestamp,
                    type: 'data',
                };
            }

            return {
                id: Date.now().toString(),
                role: 'assistant',
                content: `🚨 Alert Summary:\n• Total: ${alerts.length}\n• Pending: ${pendingAlerts.length}\n• Acknowledged: ${acknowledgedAlerts.length}`,
                timestamp,
            };
        }

        // TEAM QUERIES
        if (lowerQuery.includes('team') || lowerQuery.includes('analyst') || lowerQuery.includes('member')) {
            return {
                id: Date.now().toString(),
                role: 'assistant',
                content: `👥 SOC Team:\n• Navigate to /team page for full roster\n• Team members manage incident response\n• Check assignments on Incidents page`,
                timestamp,
            };
        }

        // SYSTEM STATUS
        if (lowerQuery.includes('status') || lowerQuery.includes('health') || lowerQuery.includes('system')) {
            return {
                id: Date.now().toString(),
                role: 'assistant',
                content: `💻 System Health:\n• Status: ${isRunning ? '🟢 Operational' : '🟡 Paused'}\n• Active Incidents: ${incidents.filter(i => i.status !== 'resolved').length}\n• Pending Alerts: ${alerts.filter(a => a.status === 'pending').length}\n• All sensors active\n\n✅ All systems nominal.`,
                timestamp,
            };
        }

        // SUMMARY/OVERVIEW
        if (lowerQuery.includes('summary') || lowerQuery.includes('overview') || lowerQuery.includes('dashboard')) {
            const criticalCount = incidents.filter(i => i.severity === 'critical').length;
            const openCount = incidents.filter(i => i.status === 'open' || i.status === 'investigating').length;
            const pendingCount = alerts.filter(a => a.status === 'pending').length;

            return {
                id: Date.now().toString(),
                role: 'assistant',
                content: `📈 SOC Dashboard Summary:\n\n🎯 **Incidents**\n• ${openCount} active\n• ${criticalCount} critical\n• ${incidents.length} total\n\n🔔 **Alerts**\n• ${alerts.length} detections\n• ${pendingCount} pending\n\n💻 **System**: ${isRunning ? 'Active ✅' : 'Standby ⚠️'}`,
                timestamp,
                type: 'data',
            };
        }

        // HELP
        if (lowerQuery.includes('help') || lowerQuery.includes('what can you') || lowerQuery === '?') {
            const sampleIncident = incidents[0];
            return {
                id: Date.now().toString(),
                role: 'assistant',
                content: `🤖 **I can help with:**\n\n📋 **Incidents**${sampleIncident ? `\n• "Show ${sampleIncident.case_number}"` : ''}\n• "Show incidents"\n• "Critical incidents"\n\n🚨 **Alerts**\n• "Recent alerts"\n• "Pending alerts"\n\n📊 **System**\n• "System status"\n• "Summary"\n\nJust ask naturally!`,
                timestamp,
            };
        }

        // GREETINGS
        if (lowerQuery.includes('hello') || lowerQuery.includes('hi') || lowerQuery.includes('hey')) {
            return {
                id: Date.now().toString(),
                role: 'assistant',
                content: `Hi! Monitoring ${incidents.length} incidents and ${alerts.length} alerts. How can I help?`,
                timestamp,
            };
        }

        // THANKS
        if (lowerQuery.includes('thank')) {
            return {
                id: Date.now().toString(),
                role: 'assistant',
                content: "You're welcome! Stay vigilant. 🛡️",
                timestamp,
            };
        }

        // DEFAULT
        return {
            id: Date.now().toString(),
            role: 'assistant',
            content: `I can help! Try:\n${incidents.length > 0 ? `• "Show ${incidents[0].case_number || incidents[0].id}"\n` : ''}• "Show incidents"\n• "Recent alerts"\n• "System status"\n• "Summary"\n\nWhat would you like to know?`,
            timestamp,
        };
    };

    const suggestions = [
        { label: incidents.length > 0 ? "Show incidents" : "System status", query: incidents.length > 0 ? "Show incidents" : "System status" },
        { label: "Recent alerts", query: "Recent alerts" },
        { label: "Dashboard summary", query: "Summary" },
    ];

    return (
        <>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="fixed bottom-24 right-6 w-[380px] h-[600px] bg-card border border-border shadow-2xl rounded-2xl flex flex-col z-50 overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
                                    <div className="relative bg-primary/10 p-2 rounded-full border border-primary/20">
                                        <Bot className="h-5 w-5 text-primary" />
                                    </div>
                                    <span className="absolute bottom-0 right-0 h-2.5 w-2.5 bg-emerald-500 border-2 border-card rounded-full" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-sm">IRIS Assistant</h3>
                                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                        Online • v2.4.0
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => setIsOpen(false)}>
                                    <Minimize2 className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-destructive/10 hover:text-destructive" onClick={() => setIsOpen(false)}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        {/* Chat Area */}
                        <div className="flex-1 overflow-hidden relative bg-card/50">
                            <ScrollArea className="h-full p-4" ref={scrollRef}>
                                <div className="flex flex-col gap-4 pb-4">
                                    {messages.map((msg) => (
                                        <div
                                            key={msg.id}
                                            className={cn(
                                                "flex gap-3 max-w-[85%]",
                                                msg.role === 'user' ? "self-end flex-row-reverse" : "self-start"
                                            )}
                                        >
                                            {msg.role === 'assistant' && (
                                                <Avatar className="h-8 w-8 border border-border mt-1">
                                                    <AvatarFallback className="bg-primary/10 text-primary text-xs">AI</AvatarFallback>
                                                </Avatar>
                                            )}

                                            <div className={cn(
                                                "rounded-2xl px-4 py-2.5 text-sm shadow-sm whitespace-pre-line",
                                                msg.role === 'user'
                                                    ? "bg-primary text-primary-foreground rounded-br-none"
                                                    : "bg-muted/50 border border-border text-foreground rounded-bl-none"
                                            )}>
                                                {msg.content}
                                                <p className={cn(
                                                    "text-[10px] mt-1 opacity-70",
                                                    msg.role === 'user' ? "text-primary-foreground/70" : "text-muted-foreground"
                                                )}>
                                                    {format(msg.timestamp, 'HH:mm')}
                                                </p>
                                            </div>
                                        </div>
                                    ))}

                                    {isTyping && (
                                        <div className="flex gap-3 max-w-[85%] self-start">
                                            <Avatar className="h-8 w-8 border border-border mt-1">
                                                <AvatarFallback className="bg-primary/10 text-primary text-xs">AI</AvatarFallback>
                                            </Avatar>
                                            <div className="bg-muted/50 border border-border rounded-2xl rounded-bl-none px-4 py-3 shadow-sm flex items-center gap-1">
                                                <span className="h-1.5 w-1.5 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                                <span className="h-1.5 w-1.5 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                                <span className="h-1.5 w-1.5 bg-muted-foreground/40 rounded-full animate-bounce" />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </ScrollArea>

                            {/* Floating suggestions */}
                            {messages.length === 1 && !isTyping && (
                                <div className="absolute bottom-4 left-4 right-4 flex flex-col gap-2">
                                    {suggestions.map((suggestion) => (
                                        <button
                                            key={suggestion.label}
                                            onClick={() => {
                                                setInputValue(suggestion.query);
                                                setTimeout(() => handleSendMessage(), 0);
                                            }}
                                            className="text-left text-xs bg-background/80 hover:bg-muted/80 backdrop-blur-sm border border-border/50 rounded-lg p-2.5 transition-colors flex items-center justify-between group"
                                        >
                                            <span>{suggestion.label}</span>
                                            <ChevronRight className="h-3 w-3 text-muted-foreground group-hover:text-primary transition-colors" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Input Area */}
                        <div className="p-4 bg-background border-t border-border">
                            <form onSubmit={handleSendMessage} className="flex gap-2">
                                <Input
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    placeholder="Ask about incidents..."
                                    className="bg-secondary/20 focus-visible:ring-primary/20"
                                />
                                <Button
                                    type="submit"
                                    size="icon"
                                    disabled={!inputValue.trim() || isTyping}
                                    className={cn(
                                        "transition-all duration-200",
                                        inputValue.trim() ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                                    )}
                                >
                                    <Send className="h-4 w-4" />
                                </Button>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Floating Toggle Button */}
            {!isOpen && (
                <motion.button
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/25 flex items-center justify-center z-50 group transition-all hover:shadow-xl hover:shadow-primary/40"
                >
                    <div className="relative">
                        <Bot className="h-7 w-7 transition-transform group-hover:rotate-12" />
                        {(incidents.filter(i => i.status === 'open').length > 0 || alerts.filter(a => a.status === 'pending').length > 0) && (
                            <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full border-2 border-primary animate-pulse" />
                        )}
                    </div>
                </motion.button>
            )}
        </>
    );
}
