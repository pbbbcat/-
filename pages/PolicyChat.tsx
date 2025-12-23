
import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, BookOpen, ExternalLink, Loader2, Database } from 'lucide-react';
import { Message, MessageRole } from '../types';
import { sendMessageToGemini } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';

const PolicyChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: MessageRole.MODEL,
      content: '您好！我是您的专属公考政策解读顾问。我有15年人社局审核经验。\n\n无论您是对应届生身份认定有疑问，还是想了解目前有哪些适合您的真实岗位，都可以问我。请问有什么可以帮您？',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: MessageRole.USER,
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // The sendMessageToGemini function now handles context history
      const responseText = await sendMessageToGemini(messages, input);
      
      // Dynamic extraction of citations in format 《...》 to generate visual chips
      // The text itself will contain the full citations via Markdown as enforced by System Instructions
      const citationRegex = /《([^》]+)》/g;
      const foundCitations = responseText.match(citationRegex);
      const uniqueCitations = foundCitations ? Array.from(new Set(foundCitations)) : [];

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: MessageRole.MODEL,
        content: responseText,
        timestamp: new Date(),
        citations: uniqueCitations.length > 0 ? uniqueCitations : undefined
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      console.error(error);
      const errorMsg: Message = {
          id: Date.now().toString(),
          role: MessageRole.MODEL,
          content: "抱歉，系统暂时繁忙，请稍后再试。",
          timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white z-10">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Bot className="w-6 h-6 text-primary" />
            政策解读专家 (RAG)
          </h1>
          <p className="text-xs text-slate-400 mt-1">基于知识库 • 引用真实数据 • 拒绝信息幻觉</p>
        </div>
        <div className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            已连接法规库
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex w-full ${msg.role === MessageRole.USER ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex max-w-[85%] gap-4 ${msg.role === MessageRole.USER ? 'flex-row-reverse' : 'flex-row'}`}>
              
              {/* Avatar */}
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                msg.role === MessageRole.USER ? 'bg-indigo-500 text-white' : 'bg-white text-primary border border-gray-100'
              }`}>
                {msg.role === MessageRole.USER ? <User className="w-5 h-5" /> : <Bot className="w-6 h-6" />}
              </div>

              {/* Bubble */}
              <div className="flex flex-col gap-2 min-w-0">
                <div className={`p-5 rounded-2xl shadow-sm ${
                    msg.role === MessageRole.USER 
                    ? 'bg-primary text-white rounded-tr-none' 
                    : 'bg-white text-slate-700 rounded-tl-none border border-gray-100'
                }`}>
                    <div className="prose prose-sm max-w-none prose-p:my-1 prose-pre:bg-slate-800 prose-pre:text-white prose-blockquote:border-l-4 prose-blockquote:border-emerald-500 prose-blockquote:bg-emerald-50 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded-r-lg prose-blockquote:not-italic prose-blockquote:text-slate-600">
                         <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                </div>

                {/* Citations (Only for Model) - Visual Chips extracted from text */}
                {msg.role === MessageRole.MODEL && msg.citations && (
                    <div className="flex flex-wrap gap-2 animate-fade-in">
                        {msg.citations.map((cite, i) => (
                            <div key={i} className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-indigo-100 text-[10px] text-indigo-600 cursor-default shadow-sm">
                                <BookOpen className="w-3 h-3" />
                                <span>{cite}</span>
                            </div>
                        ))}
                    </div>
                )}
                
                <span className="text-[10px] text-slate-400 px-1">
                    {msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
            <div className="flex justify-start w-full">
                <div className="flex max-w-[80%] gap-4">
                    <div className="w-10 h-10 rounded-full bg-white text-primary border border-gray-100 flex items-center justify-center shadow-sm">
                        <Loader2 className="w-5 h-5 animate-spin" />
                    </div>
                    <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-gray-100 shadow-sm flex items-center">
                        <div className="flex items-center space-x-2 text-xs text-slate-500">
                             <Database className="w-3 h-3 text-emerald-500 animate-pulse" />
                             <span className="animate-pulse">正在检索 RAG 法规库并验证条款...</span>
                        </div>
                    </div>
                </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-gray-100">
        <div className="max-w-4xl mx-auto relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="请输入您的问题，例如：往届生是否有基层经历限制？"
            className="w-full bg-slate-50 border border-gray-200 rounded-2xl pl-4 pr-14 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary resize-none h-14"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="absolute right-2 top-2 p-2 bg-primary text-white rounded-xl hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <p className="text-center text-[10px] text-slate-300 mt-2">
            AI 自动标注法规出处，仅供参考。重要决策请查阅官方公告原文。
        </p>
      </div>
    </div>
  );
};

export default PolicyChat;
