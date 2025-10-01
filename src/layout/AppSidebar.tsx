"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSidebar } from "../context/SidebarContext";
import { Search, Plus } from "lucide-react";
import { useAppTab } from "@/context/AppTabContext";
import ChatSidebar from "@/components/ui/sidebars/ChatSidebar";


const AppSidebar = () => {
    const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
    const { activeTab } = useAppTab();

    return (
        <aside
            className={`fixed top-0 left-0 bg-gray-100 dark:bg-stone-900 dark:border-stone-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 shadow-lg 
        ${isExpanded
                    ? "w-[290px]"
                    : isHovered
                        ? "w-[290px]"
                        : isMobileOpen
                            ? "w-[230px]"
                            : "w-[90px]"
                }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
            onMouseEnter={() => !isExpanded && setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="py-6 flex justify-center items-center">
                <Link href="/chat">
                    {isExpanded || isHovered || isMobileOpen ? (
                        <>
                            <Image
                                className="dark:hidden"
                                src="/images/logo/chatty-dark.svg"
                                alt="Logo"
                                width={150}
                                height={40}
                            />
                            <Image
                                className="hidden dark:block"
                                src="/images/logo/chatty-light.svg"
                                alt="Logo"
                                width={150}
                                height={40}
                            />
                        </>
                    ) : (
                        <>
                            <div>
                                <Image
                                    className="dark:hidden"
                                    src="/images/logo/msg-light.svg"
                                    alt="Logo"
                                    width={40}
                                    height={20}
                                />
                                <Image
                                    className="hidden dark:block"
                                    src="/images/logo/msg-dark.svg"
                                    alt="Logo"
                                    width={40}
                                    height={20}
                                />
                            </div>
                        </>
                    )}
                </Link>
            </div>


            {/* Render correct sidebar based on activeTab */}
            <div className="h-[86vh] overflow-y-auto no-scrollbar py-2">
                {activeTab === "messages" && <ChatSidebar />}
                {/* {activeTab === "calls" && <CallsSidebar />}
                {activeTab === "statuses" && <StatusesSidebar />} */}
            </div>



        </aside>
    );
};

export default AppSidebar;