
// Re-export Shadcn UI toast functions
import { toast as shadcnToast, useToast as useShadcnToast } from "@/components/ui/toast";

export const useToast = useShadcnToast;
export const toast = shadcnToast;
