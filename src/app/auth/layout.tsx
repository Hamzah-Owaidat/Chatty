import GridShape from "@/components/common/GridShape";
import ThemeTogglerTwo from "@/components/common/ThemeTogglerTwo";
import ThemeResponsiveLogo from "@/components/common/ThemeResponsiveLogo";
import { ThemeProvider } from "@/context/ThemeContext";
import Image from "next/image";
import React from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative bg-[#fcfcfd] z-1 dark:bg-[#1c1917] sm:p-0">
      <ThemeProvider>
        <div className="relative flex lg:flex-row w-full h-screen justify-center flex-col dark:bg-[#1c1917] p-10 md:p-0">
          {children}

          <div className="hidden lg:flex lg:w-[42%] h-full items-center justify-center border-l border-gray-200/70 bg-gray-100 dark:border-stone-800/70 dark:bg-stone-900">
            <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
              {/* Layer 1: masked grid */}
              <GridShape />

              {/* Layer 2: soft teal glow */}
              <div
                className="pointer-events-none absolute inset-0 z-0"
                style={{
                  background:
                    "radial-gradient(500px 320px at 50% 38%, rgba(26,123,155,.1), transparent 70%)",
                }}
              />

              {/* Layer 3: logo + tagline + avatar stack */}
              <div className="relative z-10 flex flex-col items-center gap-6 px-8 text-center">
                <div className="h-[150px] w-[500px]">
                  <ThemeResponsiveLogo className="h-full w-full" />
                </div>
                <p className="max-w-xs text-gray-500 dark:text-stone-400">
                  Connect, Chat, and Create Meaningful Conversations with Chatty
                </p>

                <div className="flex items-center">
                  {["user-01", "user-02", "user-03"].map((avatar, index) => (
                    <span
                      key={avatar}
                      className={`h-[38px] w-[38px] overflow-hidden rounded-full ring-[3px] ring-gray-100 dark:ring-stone-900 ${index > 0 ? "-ml-2.5" : ""}`}
                    >
                      <Image
                        src={`/images/user/${avatar}.jpg`}
                        alt="Chatty user"
                        width={38}
                        height={38}
                        className="h-full w-full object-cover"
                      />
                    </span>
                  ))}
                  <span className="-ml-2.5 flex h-[38px] w-[38px] items-center justify-center rounded-full bg-[#1a7b9b] text-[11px] font-semibold text-white ring-[3px] ring-gray-100 dark:bg-[#2596bb] dark:ring-stone-900">
                    +9
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="fixed bottom-6 right-6 z-50">
            <ThemeTogglerTwo />
          </div>
        </div>
      </ThemeProvider>
    </div>
  );
}
