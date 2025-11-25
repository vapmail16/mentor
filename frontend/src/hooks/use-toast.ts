import { toast as sonnerToast } from 'sonner';

export const useToast = () => {
  return {
    toast: (options: {
      title?: string;
      description?: string;
      variant?: 'default' | 'destructive' | 'success';
    }) => {
      if (options.variant === 'destructive') {
        sonnerToast.error(options.title || 'Error', {
          description: options.description,
        });
      } else if (options.variant === 'success') {
        sonnerToast.success(options.title || 'Success', {
          description: options.description,
        });
      } else {
        sonnerToast.info(options.title || 'Info', {
          description: options.description,
        });
      }
    },
  };
};

export default useToast;

