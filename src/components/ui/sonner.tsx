
import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group flex w-full items-center border-border bg-background p-4 pr-8 shadow-lg rounded-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          closeButton: "group-[.toast]:text-foreground/50 hover:text-foreground",
        },
      }}
      // Set default duration for all toasts to 5 seconds
      duration={5000}
      position="top-center"
      richColors
      closeButton
      {...props}
    />
  );
};

export { Toaster };
