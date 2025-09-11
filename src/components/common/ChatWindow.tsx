"use client";
import React, { useState } from "react";
import { Send, Paperclip, Mic, Image, FileText, Camera, Check, CheckCheck } from "lucide-react";

const fakeUsers = {
    u1: { name: "Alice Johnson" },
    u2: { name: "Bob Smith" },
    u3: { name: "Charlie Brown" },
};

const fakeMessages = [
    { id: 1, text: "Hello 👋", isOwn: false, status: "seen", timestamp: "10:30" },
    { id: 2, text: "Hi Alice! How are you doing today?", isOwn: true, status: "seen", timestamp: "10:31" },
    { id: 3, text: "I'm doing great, thanks for asking!", isOwn: false, status: "seen", timestamp: "10:32" },
    { id: 4, text: "That's wonderful to hear! I was thinking we could catch up over coffee sometime this week.", isOwn: true, status: "delivered", timestamp: "10:33" },
    { id: 5, text: "Sounds perfect! I'd love that ☕", isOwn: false, status: "seen", timestamp: "10:34" },
];

export default function ChatWindow({ userId = "u1" }: { userId?: string }) {
    const [message, setMessage] = useState("");
    const [showAttachments, setShowAttachments] = useState(false);
    const [messages, setMessages] = useState(fakeMessages);
    const user = fakeUsers[userId];

    const MessageStatus = ({ status }) => {
        if (status === "sent") {
            return <Check className="w-4 h-4 text-gray-400" />;
        } else if (status === "delivered") {
            return <CheckCheck className="w-4 h-4 text-gray-400" />;
        } else if (status === "seen") {
            return <CheckCheck className="w-4 h-4 text-green-500" />;
        }
        return null;
    };

    const handleSendMessage = () => {
        if (message.trim()) {
            const newMessage = {
                id: messages.length + 1,
                text: message,
                isOwn: true,
                status: "sent",
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            setMessages([...messages, newMessage]);
            setMessage("");
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSendMessage();
        }
    };

    const attachmentOptions = [
        { icon: Camera, label: "Camera", color: "text-green-600" },
        { icon: Image, label: "Photo & Video", color: "text-blue-600" },
        { icon: FileText, label: "Document", color: "text-purple-600" },
    ];

    return (
        <div className="flex flex-col h-[80vh] rounded-lg">
            {/* Chat header */}
            <div className="p-3 border-b dark:border-stone-700 flex items-center bg-gray-100 dark:bg-stone-800 rounded-t-lg">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold mr-3">
                    {user?.name?.charAt(0) || "U"}
                </div>
                <div>
                    <span className="font-semibold text-gray-800 dark:text-gray-100 block">
                        {user?.name || "Unknown User"}
                    </span>
                    <span className="text-sm text-green-500">Typing..</span>
                </div>
            </div>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-stone-950 scrollbar-thin scrollbar-thumb-[#1a7b9b] scrollbar-track-transparent">
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}
                    >
                        <div className={`flex items-end space-x-2 max-w-[70%] ${msg.isOwn ? 'flex-row-reverse space-x-reverse' : 'flex-row'}`}>
                            {/* Avatar for other person's messages */}
                            {!msg.isOwn && (
                                <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center text-white text-xs font-semibold mb-1">
                                    {user?.name?.charAt(0) || "U"}
                                </div>
                            )}

                            <div className={`relative group`}>
                                <div
                                    className={`
                    px-2 py-1 rounded-2xl border-2
                    ${msg.isOwn
                                            ? 'bg-[#1a7b9b]/80 text-white border-blue-400 rounded-br-md'
                                            : 'bg-white dark:bg-stone-800 text-gray-800 dark:text-gray-100 border-gray-200 dark:border-stone-600 rounded-bl-md'
                                        }
                  `}
                                >
                                    <p className="text-sm leading-relaxed">{msg.text}</p>

                                    {/* Timestamp and status */}
                                    <div className={`flex items-center justify-end mt-1 space-x-1`}>
                                        <span className={`text-xs ${msg.isOwn ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}>
                                            {msg.timestamp}
                                        </span>
                                        {msg.isOwn && <MessageStatus status={msg.status} />}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Attachment dropdown */}
            {showAttachments && (
                <div className="mx-4 mb-2 bg-white dark:bg-stone-800 rounded-lg shadow-lg border dark:border-stone-600">
                    <div className="p-2">
                        {attachmentOptions.map((option, index) => (
                            <button
                                key={index}
                                className="w-full flex items-center space-x-3 p-3 hover:bg-gray-100 dark:hover:bg-stone-700 rounded-lg transition-colors"
                                onClick={() => setShowAttachments(false)}
                            >
                                <option.icon className={`w-5 h-5 ${option.color}`} />
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                    {option.label}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Input area */}
            <div className="px-3 py-1 rounded-full dark:bg-stone-800 ">
                <div className="flex items-center space-x-2">
                    {/* Attachment button */}
                    <div className="relative">
                        <button
                            onClick={() => setShowAttachments(!showAttachments)}
                            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-stone-700 rounded-full transition-colors"
                        >
                            <Paperclip className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Message input */}
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Type a message..."
                            className="w-full rounded-full px-1 py-1 focus:outline-none dark:text-white transition-colors"
                        />
                    </div>

                    {/* Voice message button */}
                    <button className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-stone-700 rounded-full transition-colors">
                        <Mic className="w-5 h-5" />
                    </button>

                    {/* Send button */}
                    <button
                        onClick={handleSendMessage}
                        className="bg-[#1a7b9b] hover:bg-[#1a7b9b]/80 text-white p-2 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={!message.trim()}
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}