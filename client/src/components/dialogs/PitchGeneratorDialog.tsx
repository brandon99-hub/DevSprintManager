import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { SprintWithTasks } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Presentation, 
  Download, 
  Copy, 
  FileText, 
  Check, 
  Loader2 
} from 'lucide-react';

interface PitchGeneratorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  sprintId: number;
}

export default function PitchGeneratorDialog({ isOpen, onClose, sprintId }: PitchGeneratorDialogProps) {
  const [activeTab, setActiveTab] = useState('summary');
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  
  // Fetch sprint and tasks data
  const { data: sprint } = useQuery<SprintWithTasks>({
    queryKey: ['/api/sprints', sprintId.toString()],
  });
  
  // All the text sections for the pitch
  const [pitchContent, setPitchContent] = useState({
    summary: '',
    problemStatement: '',
    solution: '',
    features: '',
    techStack: '',
    demo: '',
    teamInfo: '',
    futureWork: '',
  });
  
  // Generate the pitch content based on sprint and tasks
  const generatePitch = () => {
    if (!sprint) return;
    
    setIsGenerating(true);
    
    // In a real app, we might use AI to generate this content
    // For now, we'll use a template based on the sprint and task data
    
    setTimeout(() => {
      const completedTasks = sprint.tasks.filter(task => task.status === 'done');
      const inProgressTasks = sprint.tasks.filter(task => task.status === 'inprogress' || task.status === 'review');
      
      const frontendTasks = sprint.tasks.filter(task => task.type === 'frontend');
      const backendTasks = sprint.tasks.filter(task => task.type === 'backend');
      const designTasks = sprint.tasks.filter(task => task.type === 'design');
      
      // Generate summary
      const summary = `${sprint.name} is a ${sprint.description || 'innovative solution'} developed during our ${sprint.hackathonMode ? 'hackathon' : 'sprint'}. Our team has completed ${completedTasks.length} features and has ${inProgressTasks.length} more in progress.`;
      
      // Generate problem statement
      const problemStatement = `The problem we're solving is the need for better tools to manage development sprints and hackathons. Teams need a way to track tasks, monitor progress, and collaborate effectively during fast-paced development cycles.`;
      
      // Generate solution
      const solution = `Our solution, ${sprint.name}, provides a comprehensive platform for managing development sprints with features like Kanban boards, GitHub integration, and real-time collaboration tools. It's designed specifically for developers who need to move quickly while maintaining code quality.`;
      
      // Generate features
      const featuresText = completedTasks.length > 0 
        ? `Key features we've built include:\n\n${completedTasks.map(task => `• ${task.title}${task.description ? ': ' + task.description : ''}`).join('\n')}`
        : `We're working on the following features:\n\n${sprint.tasks.map(task => `• ${task.title}${task.description ? ': ' + task.description : ''}`).join('\n')}`;
      
      // Generate tech stack
      const techStack = `Our technology stack includes:\n\n• Frontend: React, TypeScript, Tailwind CSS\n• Backend: Node.js, Express\n• Database: PostgreSQL\n• Real-time communication: WebSockets\n• Version control: GitHub`;
      
      // Generate demo script
      const demo = `For our demo, we'll show:\n\n1. Task creation and management on our Kanban board\n2. Real-time updates and team collaboration\n3. GitHub PR integration for code review\n4. Focus Mode for individual productivity`;
      
      // Generate team info
      const teamInfo = `Our team consists of ${sprint.tasks.reduce((acc, task) => {
        if (task.assignee && !acc.includes(task.assignee.name)) {
          acc.push(task.assignee.name);
        }
        return acc;
      }, [] as string[]).join(', ') || 'talented developers'} who worked collaboratively to build this solution.`;
      
      // Generate future work
      const futureWork = `Future plans include:\n\n• Enhanced analytics and reporting\n• AI-assisted task prioritization\n• Mobile application\n• Offline mode support`;
      
      setPitchContent({
        summary,
        problemStatement,
        solution,
        features: featuresText,
        techStack,
        demo,
        teamInfo,
        futureWork,
      });
      
      setIsGenerating(false);
      
      toast({
        title: 'Pitch generated',
        description: 'Your pitch has been created based on your sprint data.',
      });
    }, 1500);
  };
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    
    toast({
      title: 'Copied to clipboard',
      description: 'The pitch content has been copied to your clipboard.',
    });
  };
  
  const generateFullPitch = () => {
    return `# ${sprint?.name || 'Sprint'} - Pitch Deck

## Summary
${pitchContent.summary}

## Problem Statement
${pitchContent.problemStatement}

## Our Solution
${pitchContent.solution}

## Key Features
${pitchContent.features}

## Technology Stack
${pitchContent.techStack}

## Demo
${pitchContent.demo}

## Our Team
${pitchContent.teamInfo}

## Future Work
${pitchContent.futureWork}
`;
  };
  
  // Handle download pitch as markdown
  const downloadPitch = () => {
    const fullPitch = generateFullPitch();
    const blob = new Blob([fullPitch], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${sprint?.name || 'sprint'}-pitch.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: 'Pitch downloaded',
      description: 'Your pitch has been downloaded as a Markdown file.',
    });
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Presentation className="h-5 w-5" />
            Pitch Generator
          </DialogTitle>
          <DialogDescription>
            Generate a pitch deck for your hackathon project based on your sprint data.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="flex justify-between mb-4">
            <Button onClick={generatePitch} disabled={isGenerating}>
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Pitch
                </>
              )}
            </Button>
            
            <div className="space-x-2">
              <Button
                variant="outline"
                onClick={() => copyToClipboard(generateFullPitch())}
                disabled={isGenerating || !pitchContent.summary}
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy All
                  </>
                )}
              </Button>
              
              <Button
                variant="outline"
                onClick={downloadPitch}
                disabled={isGenerating || !pitchContent.summary}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
          
          {!pitchContent.summary ? (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                <p>Click "Generate Pitch" to create content based on your sprint data.</p>
              </CardContent>
            </Card>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="summary">Summary</TabsTrigger>
                <TabsTrigger value="problem">Problem</TabsTrigger>
                <TabsTrigger value="solution">Solution</TabsTrigger>
                <TabsTrigger value="features">Features</TabsTrigger>
                <TabsTrigger value="tech">Tech Stack</TabsTrigger>
                <TabsTrigger value="demo">Demo</TabsTrigger>
                <TabsTrigger value="team">Team</TabsTrigger>
                <TabsTrigger value="future">Future</TabsTrigger>
              </TabsList>
              
              <TabsContent value="summary">
                <Textarea 
                  value={pitchContent.summary} 
                  onChange={(e) => setPitchContent({...pitchContent, summary: e.target.value})}
                  rows={6}
                  className="resize-none"
                />
              </TabsContent>
              
              <TabsContent value="problem">
                <Textarea 
                  value={pitchContent.problemStatement} 
                  onChange={(e) => setPitchContent({...pitchContent, problemStatement: e.target.value})}
                  rows={6}
                  className="resize-none"
                />
              </TabsContent>
              
              <TabsContent value="solution">
                <Textarea 
                  value={pitchContent.solution} 
                  onChange={(e) => setPitchContent({...pitchContent, solution: e.target.value})}
                  rows={6}
                  className="resize-none"
                />
              </TabsContent>
              
              <TabsContent value="features">
                <Textarea 
                  value={pitchContent.features} 
                  onChange={(e) => setPitchContent({...pitchContent, features: e.target.value})}
                  rows={10}
                  className="resize-none"
                />
              </TabsContent>
              
              <TabsContent value="tech">
                <Textarea 
                  value={pitchContent.techStack} 
                  onChange={(e) => setPitchContent({...pitchContent, techStack: e.target.value})}
                  rows={8}
                  className="resize-none"
                />
              </TabsContent>
              
              <TabsContent value="demo">
                <Textarea 
                  value={pitchContent.demo} 
                  onChange={(e) => setPitchContent({...pitchContent, demo: e.target.value})}
                  rows={8}
                  className="resize-none"
                />
              </TabsContent>
              
              <TabsContent value="team">
                <Textarea 
                  value={pitchContent.teamInfo} 
                  onChange={(e) => setPitchContent({...pitchContent, teamInfo: e.target.value})}
                  rows={4}
                  className="resize-none"
                />
              </TabsContent>
              
              <TabsContent value="future">
                <Textarea 
                  value={pitchContent.futureWork} 
                  onChange={(e) => setPitchContent({...pitchContent, futureWork: e.target.value})}
                  rows={8}
                  className="resize-none"
                />
              </TabsContent>
            </Tabs>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}