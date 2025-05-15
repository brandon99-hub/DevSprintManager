import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Task } from '@/lib/types';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface ConnectPRDialogProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  onPRConnected: () => void;
}

const prLinkRegex = /^https:\/\/github\.com\/[\w-]+\/[\w-]+\/pull\/\d+$/;

const connectPRSchema = z.object({
  taskId: z.string().min(1, 'Please select a task'),
  prUrl: z.string().url('Must be a valid URL').regex(prLinkRegex, 'Must be a valid GitHub PR URL'),
  prNumber: z.string().regex(/^\d+$/, 'Must be a number'),
  ciStatus: z.string().optional()
});

type FormValues = z.infer<typeof connectPRSchema>;

export default function ConnectPRDialog({ isOpen, onClose, tasks, onPRConnected }: ConnectPRDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(connectPRSchema),
    defaultValues: {
      taskId: '',
      prUrl: '',
      prNumber: '',
      ciStatus: 'pending'
    }
  });

  const extractPRNumberFromUrl = (url: string) => {
    const match = url.match(/\/pull\/(\d+)$/);
    return match ? match[1] : '';
  };

  const handlePRUrlChange = (value: string) => {
    const prNumber = extractPRNumberFromUrl(value);
    form.setValue('prNumber', prNumber);
  };

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      await apiRequest(
        'PATCH',
        `/api/tasks/${data.taskId}`,
        {
          githubPrUrl: data.prUrl,
          githubPrNumber: Number(data.prNumber),
          ciStatus: data.ciStatus || 'pending'
        }
      );
      
      // Update the task in the cache
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      
      toast({
        title: 'Success',
        description: 'Pull request connected to task'
      });
      
      onPRConnected();
      onClose();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to connect PR to task',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Connect GitHub Pull Request</DialogTitle>
          <DialogDescription>
            Link a GitHub pull request to an existing task
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="taskId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Task</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a task" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {tasks
                        .filter(task => !task.githubPrUrl)
                        .map(task => (
                          <SelectItem key={task.id} value={task.id.toString()}>
                            {task.title}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="prUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>GitHub PR URL</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="https://github.com/org/repo/pull/123" 
                      {...field} 
                      onChange={(e) => {
                        field.onChange(e);
                        handlePRUrlChange(e.target.value);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="prNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>PR Number</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="ciStatus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CI Status</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="running">Running</SelectItem>
                      <SelectItem value="success">Success</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                      <SelectItem value="merged">Merged</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Connecting...' : 'Connect PR'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}