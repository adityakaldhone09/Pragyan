import { useState } from 'react';
import { Navbar } from '../components/Navbar';
import { Card } from '../components/Card';
import { ProgressBar } from '../components/ProgressBar';
import { Checkbox } from '../components/Checkbox';

interface RoadmapProps {
  userName: string;
  onLogout: () => void;
  onNavigate?: (page: 'dashboard' | 'profile' | 'roadmap') => void;
}

interface Task {
  id: string;
  title: string;
  completed: boolean;
}

interface Stage {
  id: string;
  title: string;
  description: string;
  progress: number;
  tasks: Task[];
}

export function Roadmap({ userName, onLogout, onNavigate }: RoadmapProps) {
  const [stages, setStages] = useState<Stage[]>([
    {
      id: '1',
      title: 'Foundation Skills',
      description: 'Build your core programming fundamentals',
      progress: 75,
      tasks: [
        { id: '1-1', title: 'Complete Python basics course', completed: true },
        { id: '1-2', title: 'Learn data structures and algorithms', completed: true },
        { id: '1-3', title: 'Practice on LeetCode (20 problems)', completed: true },
        { id: '1-4', title: 'Build a simple CLI application', completed: false }
      ]
    },
    {
      id: '2',
      title: 'Web Development',
      description: 'Master modern web technologies',
      progress: 40,
      tasks: [
        { id: '2-1', title: 'Learn HTML, CSS, and JavaScript', completed: true },
        { id: '2-2', title: 'Complete React fundamentals', completed: true },
        { id: '2-3', title: 'Build a portfolio website', completed: false },
        { id: '2-4', title: 'Learn Node.js and Express', completed: false },
        { id: '2-5', title: 'Create a full-stack project', completed: false }
      ]
    },
    {
      id: '3',
      title: 'Advanced Topics',
      description: 'Dive into specialized areas',
      progress: 0,
      tasks: [
        { id: '3-1', title: 'Learn system design principles', completed: false },
        { id: '3-2', title: 'Study database optimization', completed: false },
        { id: '3-3', title: 'Explore cloud platforms (AWS/GCP)', completed: false },
        { id: '3-4', title: 'Complete a capstone project', completed: false }
      ]
    },
    {
      id: '4',
      title: 'Career Preparation',
      description: 'Get ready for job opportunities',
      progress: 20,
      tasks: [
        { id: '4-1', title: 'Update resume and LinkedIn', completed: true },
        { id: '4-2', title: 'Practice technical interviews', completed: false },
        { id: '4-3', title: 'Build GitHub portfolio', completed: false },
        { id: '4-4', title: 'Apply to internships/jobs', completed: false },
        { id: '4-5', title: 'Attend networking events', completed: false }
      ]
    }
  ]);

  const handleTaskToggle = (stageId: string, taskId: string) => {
    setStages(stages.map(stage => {
      if (stage.id === stageId) {
        const updatedTasks = stage.tasks.map(task =>
          task.id === taskId ? { ...task, completed: !task.completed } : task
        );
        const completedCount = updatedTasks.filter(t => t.completed).length;
        const progress = (completedCount / updatedTasks.length) * 100;
        return { ...stage, tasks: updatedTasks, progress };
      }
      return stage;
    }));
  };

  const overallProgress = stages.reduce((sum, stage) => sum + stage.progress, 0) / stages.length;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Navbar userName={userName} onLogout={onLogout} onNavigate={onNavigate} />

      <div className="max-w-5xl mx-auto p-6">
        <div className="mb-8">
          <h2 className="text-3xl font-semibold text-[#0F172A] mb-2">Learning Roadmap</h2>
          <p className="text-[#475569] mb-6">
            Your personalized path to becoming a Software Engineer
          </p>
          <Card className="p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-[#0F172A]">Overall Progress</h3>
              <span className="text-2xl font-semibold text-[#2563EB]">
                {Math.round(overallProgress)}%
              </span>
            </div>
            <ProgressBar value={overallProgress} showLabel />
          </Card>
        </div>

        <div className="space-y-6">
          {stages.map((stage, index) => (
            <Card key={stage.id} className="p-6">
              <div className="flex items-start gap-4 mb-6">
                <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                  stage.progress === 100
                    ? 'bg-[#10B981] text-white'
                    : stage.progress > 0
                    ? 'bg-[#2563EB] text-white'
                    : 'bg-[#E2E8F0] text-[#94A3B8]'
                }`}>
                  {stage.progress === 100 ? (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span className="text-lg font-semibold">{index + 1}</span>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-xl font-semibold text-[#0F172A] mb-1">{stage.title}</h3>
                      <p className="text-[#475569]">{stage.description}</p>
                    </div>
                    <span className="text-lg font-semibold text-[#2563EB] ml-4">
                      {Math.round(stage.progress)}%
                    </span>
                  </div>
                  <ProgressBar value={stage.progress} className="mb-4" />

                  <div className="space-y-2">
                    {stage.tasks.map(task => (
                      <div
                        key={task.id}
                        className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                          task.completed ? 'bg-[#F0FDF4]' : 'bg-[#F8FAFC] hover:bg-[#F1F5F9]'
                        }`}
                      >
                        <Checkbox
                          checked={task.completed}
                          onChange={() => handleTaskToggle(stage.id, task.id)}
                        />
                        <span className={`flex-1 ${
                          task.completed ? 'text-[#10B981] line-through' : 'text-[#0F172A]'
                        }`}>
                          {task.title}
                        </span>
                        {task.completed && (
                          <svg className="w-5 h-5 text-[#10B981]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <Card className="mt-8 p-6 bg-gradient-to-br from-[#EFF6FF] to-white border-[#BFDBFE]">
          <div className="flex items-start gap-4">
            <div className="text-4xl">🎯</div>
            <div>
              <h3 className="font-semibold text-[#0F172A] mb-2">Stay Motivated!</h3>
              <p className="text-[#475569]">
                You're making great progress! Complete your tasks consistently to reach your career goals.
                Remember, every small step counts towards your success.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
