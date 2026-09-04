import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User, Sparkles, AlertCircle, HardDrive, RefreshCw } from 'lucide-react';
import { KnowledgeDoc } from '../types';
import { KNOWLEDGE_FOLDER_ID } from '../services/googleDriveService';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
}

interface AgentChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  documentContext?: string;
  knowledgeDocs?: KnowledgeDoc[];
  onOpenKnowledgeBase?: () => void;
  currentUserEmail?: string;
  onChatSent?: () => void;
}

export const AgentChatDrawer: React.FC<AgentChatDrawerProps> = ({
  isOpen,
  onClose,
  documentContext,
  knowledgeDocs = [],
  onOpenKnowledgeBase,
  currentUserEmail,
  onChatSent,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      content: `반갑습니다. 정보통신설비 설계도서 기술 검토 Agent입니다.

「정보통신설비 설계기준」 및 「표준품셈」, 그리고 구글 드라이브 지식 폴더(${KNOWLEDGE_FOLDER_ID})에 업로드된 지식 문서에 근거하여 조문 해석, 수량산출 기준, 폐지 조항 확인 등을 실시간으로 지원합니다.

본 답변은 검토 초안이며 기술사의 확인 후 사용해야 합니다.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg.content,
          contextDoc: documentContext || '',
          userEmail: currentUserEmail,
          knowledgeDocs: knowledgeDocs.map((d) => ({
            name: d.name,
            content: d.content,
            mimeType: d.mimeType,
          })),
          conversationHistory: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || '답변 생성에 실패했습니다.');
      }

      onChatSent?.();

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: data.reply || '답변을 생성하지 못했습니다.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: `[오류] ${err.message || '기술 검토원 응답 처리 중 오류가 발생했습니다.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickQuestions = [
    '통신실 최소 바닥면적 기준은?',
    '배관 여유율 산출 기준과 제12조 조항은?',
    '2024 전부개정으로 폐지된 구 조항 목록은?',
    '종합접지방식과 단독접지의 저항값 기준은?',
  ];

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full max-w-md bg-[#E4E3E0] border-l-2 border-[#141414] shadow-2xl flex flex-col font-sans">
      {/* Header */}
      <div className="px-3.5 py-3 bg-[#141414] text-white flex items-center justify-between border-b border-[#141414]">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 bg-white text-[#141414] flex items-center justify-center font-mono font-bold text-xs">
            <Bot className="w-3.5 h-3.5 text-[#141414]" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-[10px] font-mono uppercase tracking-widest text-white/70">AGENT_CHAT</span>
              <span className="bg-white text-[#141414] text-[9px] font-mono px-1 font-bold">ONLINE</span>
            </div>
            <h3 className="text-xs font-bold text-white tracking-tight">기술 검토 Agent 실시간 상담소</h3>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-white/80 hover:text-white hover:bg-neutral-800 transition-colors font-mono text-xs border border-white/30"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Drive Knowledge Banner */}
      <div className="px-3 py-1.5 bg-emerald-950 text-emerald-200 border-b border-[#141414] flex items-center justify-between text-[10px] font-mono">
        <div className="flex items-center space-x-1.5 truncate">
          <HardDrive className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="truncate">
            GDrive 지식 베이스: <strong>{knowledgeDocs.length}건</strong> 연동됨
          </span>
        </div>
        {onOpenKnowledgeBase && (
          <button
            onClick={onOpenKnowledgeBase}
            className="text-emerald-300 hover:text-white underline shrink-0 ml-2"
          >
            동기화/관리
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 text-xs bg-[#E4E3E0]">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[88%] p-2.5 space-y-1 border border-[#141414] font-mono text-xs ${
                m.role === 'user'
                  ? 'bg-[#141414] text-white'
                  : 'bg-white text-[#141414]'
              }`}
            >
              <div className="flex items-center justify-between text-[10px] opacity-75 mb-0.5 border-b border-current/20 pb-0.5">
                <span className="font-bold">{m.role === 'user' ? 'USER_REVIEWER' : 'AGENT_TECH'}</span>
                <span>{m.timestamp}</span>
              </div>
              <p className="whitespace-pre-line leading-relaxed font-sans text-xs">{m.content}</p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white text-[#141414] p-2.5 border border-[#141414] font-mono text-xs flex items-center space-x-2">
              <div className="w-3 h-3 border-2 border-[#141414] border-t-transparent rounded-full animate-spin" />
              <span>SEARCHING_KNOWLEDGE_BASE...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts */}
      <div className="p-2.5 bg-white border-t border-[#141414]">
        <div className="text-[10px] text-[#141414]/70 font-mono font-bold uppercase mb-1">
          QUICK_PROMPTS (자주 묻는 조문 질의):
        </div>
        <div className="flex flex-wrap gap-1">
          {quickQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => setInputText(q)}
              className="px-2 py-0.5 text-[10px] font-mono bg-[#E4E3E0] hover:bg-[#141414] hover:text-white text-[#141414] border border-[#141414] transition-colors line-clamp-1"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="p-2.5 bg-[#E4E3E0] border-t border-[#141414] flex gap-1.5">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="조문 번호, 규격, 수량 관련 질의..."
          className="flex-1 px-2.5 py-1.5 text-xs font-mono bg-white border border-[#141414] focus:outline-none"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || isLoading}
          className="px-3 py-1.5 bg-[#141414] hover:bg-black disabled:bg-neutral-400 text-white font-mono text-xs font-bold transition-colors flex items-center justify-center border border-[#141414]"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
