import GridShape from "@/components/common/GridShape";
import ThemeTogglerTwo from "@/components/common/ThemeTogglerTwo";
import ThemeResponsiveLogo from "@/components/common/ThemeResponsiveLogo";
import { ThemeProvider } from "@/context/ThemeContext";
import React from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative bg-white z-1 dark:bg-gray-900 sm:p-0">
      <ThemeProvider>
        <div className="relative flex lg:flex-row w-full h-screen justify-center flex-col dark:bg-stone-950 p-10 md:p-0">
          {children}
          <div className="lg:w-1/2 w-full h-full bg-gray-100 dark:bg-stone-900 flex items-center justify-center hidden lg:flex">
            <div className="relative flex items-center justify-center z-1 w-full">
              {/* <!-- ===== Common Grid Shape Start ===== --> */}
              <GridShape />
              <div className="flex flex-col items-center max-w-xs gap-20">
                {/* Replace Image with ThemeResponsiveLogo */}
                <div className="w-[250px] h-[50px]">
                  <ThemeResponsiveLogo />
                </div>
                <p className="text-center text-gray-400 dark:text-white/60">
                  Connect, Chat, and Create Meaningful Conversations with Chatty
                </p>
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