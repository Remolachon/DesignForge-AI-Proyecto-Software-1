"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner, ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background/95 group-[.toaster]:backdrop-blur-md group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-2xl font-medium",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          success: "group-[.toaster]:bg-green-50/95 group-[.toaster]:dark:bg-green-950/95 group-[.toaster]:border-green-200 group-[.toaster]:dark:border-green-900 group-[.toaster]:text-green-800 group-[.toaster]:dark:text-green-200",
          error: "group-[.toaster]:bg-red-50/95 group-[.toaster]:dark:bg-red-950/95 group-[.toaster]:border-red-200 group-[.toaster]:dark:border-red-900 group-[.toaster]:text-red-800 group-[.toaster]:dark:text-red-200",
          warning: "group-[.toaster]:bg-yellow-50/95 group-[.toaster]:dark:bg-yellow-950/95 group-[.toaster]:border-yellow-200 group-[.toaster]:dark:border-yellow-900 group-[.toaster]:text-yellow-800 group-[.toaster]:dark:text-yellow-200",
          info: "group-[.toaster]:bg-blue-50/95 group-[.toaster]:dark:bg-blue-950/95 group-[.toaster]:border-blue-200 group-[.toaster]:dark:border-blue-900 group-[.toaster]:text-blue-800 group-[.toaster]:dark:text-blue-200",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
