"use client";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { getIncomingRequests, acceptChatRequest, rejectChatRequest } from "@/lib/api/chatRequest";
import { ChatRequestDto } from "@/types/chat/chat.models";
import { getErrorMessage } from "@/utils/error";
import { showToast } from "@/utils/toast";
import { useChat } from "@/context/ChatContext";

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [requests, setRequests] = useState<ChatRequestDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingOnId, setActingOnId] = useState<string | null>(null);
  const { refreshChatList } = useChat();

  const fetchIncoming = async () => {
    try {
      setLoading(true);
      const incoming = await getIncomingRequests();
      setRequests(incoming);
    } catch (err) {
      console.error("Error fetching chat requests:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncoming();
  }, []);

  function toggleDropdown() {
    setIsOpen((prev) => {
      const next = !prev;
      if (next) fetchIncoming(); // keep the list fresh each time it's opened
      return next;
    });
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  const handleAccept = async (request: ChatRequestDto) => {
    setActingOnId(request.id);
    try {
      await acceptChatRequest(request.id);
      showToast.success(`You're now chatting with ${request.sender.displayName}`);
      setRequests((prev) => prev.filter((r) => r.id !== request.id));
      refreshChatList();
    } catch (err) {
      showToast.error(getErrorMessage(err));
    } finally {
      setActingOnId(null);
    }
  };

  const handleReject = async (request: ChatRequestDto) => {
    setActingOnId(request.id);
    try {
      await rejectChatRequest(request.id);
      setRequests((prev) => prev.filter((r) => r.id !== request.id));
    } catch (err) {
      showToast.error(getErrorMessage(err));
    } finally {
      setActingOnId(null);
    }
  };

  return (
    <div className="relative">
      <button
        aria-label="Chat requests"
        className="relative dropdown-toggle flex h-10 w-10 items-center justify-center rounded-[14px] border border-gray-200/70 bg-white text-stone-600 shadow-[0_1px_2px_rgba(16,24,40,.04)] transition-all duration-200 ease-[cubic-bezier(.2,.8,.2,1)] hover:-translate-y-0.5 hover:text-[#1a7b9b] hover:shadow-[0_10px_20px_-14px_rgba(16,24,40,.35)] dark:border-stone-700/70 dark:bg-[#292524] dark:text-stone-300 dark:hover:text-[#60c7e3]"
        onClick={toggleDropdown}
      >
        <span
          className={`absolute right-0 top-0.5 z-10 h-2 w-2 rounded-full bg-orange-400 ${
            requests.length > 0 ? "flex" : "hidden"
          }`}
        >
          <span className="absolute inline-flex w-full h-full bg-orange-400 rounded-full opacity-75 animate-ping"></span>
        </span>
        <svg
          className="fill-current"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M10.75 2.29248C10.75 1.87827 10.4143 1.54248 10 1.54248C9.58583 1.54248 9.25004 1.87827 9.25004 2.29248V2.83613C6.08266 3.20733 3.62504 5.9004 3.62504 9.16748V14.4591H3.33337C2.91916 14.4591 2.58337 14.7949 2.58337 15.2091C2.58337 15.6234 2.91916 15.9591 3.33337 15.9591H4.37504H15.625H16.6667C17.0809 15.9591 17.4167 15.6234 17.4167 15.2091C17.4167 14.7949 17.0809 14.4591 16.6667 14.4591H16.375V9.16748C16.375 5.9004 13.9174 3.20733 10.75 2.83613V2.29248ZM14.875 14.4591V9.16748C14.875 6.47509 12.6924 4.29248 10 4.29248C7.30765 4.29248 5.12504 6.47509 5.12504 9.16748V14.4591H14.875ZM8.00004 17.7085C8.00004 18.1228 8.33583 18.4585 8.75004 18.4585H11.25C11.6643 18.4585 12 18.1228 12 17.7085C12 17.2943 11.6643 16.9585 11.25 16.9585H8.75004C8.33583 16.9585 8.00004 17.2943 8.00004 17.7085Z"
            fill="currentColor"
          />
        </svg>
      </button>
      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="absolute -right-[240px] mt-[17px] flex h-[480px] w-[350px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-stone-700 dark:bg-stone-950 sm:w-[361px] lg:right-0"
      >
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100 dark:border-gray-700">
          <h5 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Chat requests
          </h5>
          <button
            onClick={closeDropdown}
            className="text-gray-500 transition dropdown-toggle dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          >
            <svg
              className="fill-current"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M6.21967 7.28131C5.92678 6.98841 5.92678 6.51354 6.21967 6.22065C6.51256 5.92775 6.98744 5.92775 7.28033 6.22065L11.999 10.9393L16.7176 6.22078C17.0105 5.92789 17.4854 5.92788 17.7782 6.22078C18.0711 6.51367 18.0711 6.98855 17.7782 7.28144L13.0597 12L17.7782 16.7186C18.0711 17.0115 18.0711 17.4863 17.7782 17.7792C17.4854 18.0721 17.0105 18.0721 16.7176 17.7792L11.999 13.0607L7.28033 17.7794C6.98744 18.0722 6.51256 18.0722 6.21967 17.7794C5.92678 17.4865 5.92678 17.0116 6.21967 16.7187L10.9384 12L6.21967 7.28131Z"
                fill="currentColor"
              />
            </svg>
          </button>
        </div>
        <ul className="flex flex-col h-auto overflow-y-auto custom-scrollbar">
          {loading ? (
            <li className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">Loading...</li>
          ) : requests.length === 0 ? (
            <li className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
              No pending chat requests
            </li>
          ) : (
            requests.map((request) => (
              <li key={request.id}>
                <div className="flex items-center gap-3 rounded-lg border-b border-gray-100 p-3 px-4.5 py-3 dark:border-gray-800">
                  <span className="relative block h-10 w-10 shrink-0 rounded-full">
                    <Image
                      width={40}
                      height={40}
                      src={request.sender.image || "/images/user/user-01.jpg"}
                      alt={request.sender.displayName}
                      className="w-full overflow-hidden rounded-full object-cover"
                    />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-theme-sm text-gray-700 dark:text-gray-300">
                      <span className="font-medium text-gray-800 dark:text-white/90">
                        {request.sender.displayName}
                      </span>{" "}
                      wants to start a chat
                    </span>
                  </span>

                  <span className="flex shrink-0 items-center gap-1.5">
                    <button
                      onClick={() => handleAccept(request)}
                      disabled={actingOnId === request.id}
                      aria-label={`Accept chat request from ${request.sender.displayName}`}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-success-500/10 text-success-600 transition-colors hover:bg-success-500/20 disabled:opacity-50 dark:text-success-400"
                    >
                      <Check size={16} />
                    </button>
                    <button
                      onClick={() => handleReject(request)}
                      disabled={actingOnId === request.id}
                      aria-label={`Reject chat request from ${request.sender.displayName}`}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-error-500/10 text-error-600 transition-colors hover:bg-error-500/20 disabled:opacity-50 dark:text-error-400"
                    >
                      <X size={16} />
                    </button>
                  </span>
                </div>
              </li>
            ))
          )}
        </ul>
      </Dropdown>
    </div>
  );
}
