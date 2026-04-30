import { useState } from 'react';
import { GlassCard } from '../components/GlassCard';
import { GlassButton } from '../components/GlassButton';
import { GlassInput } from '../components/GlassInput';
import { AnimatedProgress } from '../components/AnimatedProgress';
import { SkillTag } from '../components/SkillTag';
import { Icons } from '../components/Icons';

interface CareerDashboardProps {
  careerId: string;
  onBack: () => void;
}

export function CareerDashboard({ careerId, onBack }: CareerDashboardProps) {
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{ role: 'user' | 'ai'; message: string }>>([
    { role: 'ai', message: 'Hi! Ask me anything about the Software Engineer career path. I\'m here to help!' }
  ]);

  const career = {
    title: 'Software Engineer',
    match: 94,
    tags: ['High Demand', 'Tech', 'Problem Solving'],
    salary: '$80k - $150k',
    growth: '+22%',
    icon: '💻'
  };

  const skills = [
    { name: 'Technical Skills', current: 75, required: 85, color: 'primary' as const },
    { name: 'Problem Solving', current: 90, required: 80, color: 'success' as const },
    { name: 'Collaboration', current: 70, required: 75, color: 'secondary' as const },
    { name: 'Communication', current: 65, required: 70, color: 'accent' as const }
  ];

  const roadmap = [
    { stage: 'Beginner', title: 'Learn Fundamentals', status: 'completed', tasks: ['HTML/CSS', 'JavaScript Basics', 'Git'] },
    { stage: 'Intermediate', title: 'Build Projects', status: 'in-progress', tasks: ['React', 'Node.js', '3 Portfolio Projects'] },
    { stage: 'Advanced', title: 'Specialize', status: 'locked', tasks: ['System Design', 'Advanced Algorithms', 'Cloud Platforms'] },
    { stage: 'Professional', title: 'Get Hired', status: 'locked', tasks: ['Interview Prep', 'Resume Building', 'Apply to Jobs'] }
  ];

  const dayInLife = [
    '9:00 AM - Team standup meeting',
    '9:30 AM - Code review and feedback',
    '10:30 AM - Feature development',
    '12:00 PM - Lunch break',
    '1:00 PM - Debugging and testing',
    '3:00 PM - Collaboration with designers',
    '4:30 PM - Learning new technologies',
    '5:30 PM - Wrap up and planning'
  ];

  const requiredSkills = [
    'JavaScript', 'React', 'Node.js', 'Git', 'Problem Solving',
    'Data Structures', 'Algorithms', 'REST APIs', 'Database', 'Testing'
  ];

  const skillGaps = [
    { skill: 'System Design', importance: 'High', action: 'Take online course' },
    { skill: 'Cloud Platforms', importance: 'Medium', action: 'AWS certification' },
    { skill: 'Advanced Testing', importance: 'Medium', action: 'Practice TDD' }
  ];

  const handleSendMessage = () => {
    if (!chatMessage.trim()) return;

    setChatHistory([...chatHistory, { role: 'user', message: chatMessage }]);
    setChatMessage('');

    setTimeout(() => {
      setChatHistory(prev => [
        ...prev,
        {
          role: 'ai',
          message: 'Based on your profile, I recommend starting with JavaScript fundamentals and then moving to React. This aligns with your strong problem-solving skills!'
        }
      ]);
    }, 1000);
  };

  return (
    <div className="min-h-screen pb-20">
      <nav className="glass-strong border-b border-white/10 px-6 py-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button onClick={onBack} className="text-gray-400 hover:text-white transition-colors flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Matches
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center text-xl">
              {career.icon}
            </div>
            <div>
              <div className="text-sm font-semibold text-white">{career.title}</div>
              <div className="text-xs text-gray-400">{career.match}% Match</div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-6">
        <GlassCard strong className="p-8 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 gradient-primary rounded-2xl flex items-center justify-center text-4xl">
                {career.icon}
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">{career.title}</h1>
                <div className="flex items-center gap-2 flex-wrap">
                  {career.tags.map((tag, i) => (
                    <span key={i} className="px-3 py-1 glass rounded-full text-sm text-gray-300">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-5xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                {career.match}%
              </div>
              <div className="text-sm text-gray-500">Match Score</div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="glass rounded-xl p-4">
              <div className="text-xs text-gray-500 mb-1">💰 Salary Range</div>
              <div className="text-lg font-semibold text-white">{career.salary}</div>
            </div>
            <div className="glass rounded-xl p-4">
              <div className="text-xs text-gray-500 mb-1">📈 Job Growth</div>
              <div className="text-lg font-semibold text-green-400">{career.growth}</div>
            </div>
            <div className="glass rounded-xl p-4">
              <div className="text-xs text-gray-500 mb-1">⏰ Demand</div>
              <div className="text-lg font-semibold text-indigo-400">Very High</div>
            </div>
          </div>
        </GlassCard>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2 space-y-6">
            <GlassCard strong className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Icons.Sparkles />
                <h2 className="text-2xl font-bold text-white">Why This Fits YOU</h2>
              </div>
              <p className="text-gray-300 leading-relaxed mb-4">
                Based on your assessment responses, you demonstrated exceptional problem-solving abilities and logical thinking.
                Your interest in technology and systematic approach to challenges align perfectly with software engineering.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="glass rounded-xl p-4">
                  <div className="text-indigo-400 mb-2">✓ Strengths Detected</div>
                  <ul className="text-sm text-gray-400 space-y-1">
                    <li>• Analytical thinking</li>
                    <li>• Problem-solving</li>
                    <li>• Technical aptitude</li>
                  </ul>
                </div>
                <div className="glass rounded-xl p-4">
                  <div className="text-purple-400 mb-2">🎯 Interests Match</div>
                  <ul className="text-sm text-gray-400 space-y-1">
                    <li>• Building solutions</li>
                    <li>• Continuous learning</li>
                    <li>• Innovation</li>
                  </ul>
                </div>
              </div>
            </GlassCard>

            <GlassCard strong className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <Icons.Chart />
                <h2 className="text-2xl font-bold text-white">Skill Breakdown</h2>
              </div>
              <div className="space-y-5">
                {skills.map((skill, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-medium">{skill.name}</span>
                      <span className="text-sm text-gray-400">{skill.current}% / {skill.required}%</span>
                    </div>
                    <AnimatedProgress value={skill.current} max={skill.required} color={skill.color} />
                  </div>
                ))}
              </div>
            </GlassCard>

            <GlassCard strong className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <Icons.Target />
                <h2 className="text-2xl font-bold text-white">Career Roadmap</h2>
              </div>
              <div className="space-y-4">
                {roadmap.map((stage, i) => (
                  <div key={i} className={`relative ${i < roadmap.length - 1 ? 'pb-8' : ''}`}>
                    {i < roadmap.length - 1 && (
                      <div className="absolute left-6 top-12 bottom-0 w-0.5 bg-white/10"></div>
                    )}
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                        stage.status === 'completed' ? 'gradient-primary' :
                        stage.status === 'in-progress' ? 'bg-indigo-500/30 border-2 border-indigo-500' :
                        'bg-white/5 border-2 border-white/10'
                      }`}>
                        {stage.status === 'completed' ? (
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : stage.status === 'in-progress' ? (
                          <div className="w-3 h-3 bg-indigo-400 rounded-full animate-pulse"></div>
                        ) : (
                          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="text-xs text-gray-500 mb-1">{stage.stage}</div>
                        <div className="text-lg font-semibold text-white mb-2">{stage.title}</div>
                        <div className="flex gap-2 flex-wrap">
                          {stage.tasks.map((task, j) => (
                            <span key={j} className="px-2 py-1 glass rounded text-xs text-gray-400">
                              {task}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>

            <GlassCard strong className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">📅</span>
                <h2 className="text-2xl font-bold text-white">A Day in the Life</h2>
              </div>
              <div className="space-y-3">
                {dayInLife.map((item, i) => (
                  <div key={i} className="flex items-start gap-3 glass rounded-xl p-3">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2"></div>
                    <span className="text-gray-300">{item}</span>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>

          <div className="space-y-6">
            <GlassCard strong className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">🎯</span>
                <h3 className="text-xl font-bold text-white">Required Skills</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {requiredSkills.map((skill, i) => (
                  <SkillTag key={i} variant="primary">{skill}</SkillTag>
                ))}
              </div>
            </GlassCard>

            <GlassCard strong className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">📊</span>
                <h3 className="text-xl font-bold text-white">Skill Gap Analysis</h3>
              </div>
              <div className="space-y-3">
                {skillGaps.map((gap, i) => (
                  <div key={i} className="glass rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-white">{gap.skill}</span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        gap.importance === 'High' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {gap.importance}
                      </span>
                    </div>
                    <div className="text-sm text-gray-400">→ {gap.action}</div>
                  </div>
                ))}
              </div>
            </GlassCard>

            <GlassCard strong className="p-6">
              <h3 className="text-xl font-bold text-white mb-4">Next Steps</h3>
              <div className="space-y-3">
                <GlassButton variant="primary" className="w-full">
                  <Icons.Book />
                  <span className="ml-2">Start Learning</span>
                </GlassButton>
                <GlassButton variant="secondary" className="w-full">
                  <Icons.Star />
                  <span className="ml-2">View Courses</span>
                </GlassButton>
                <GlassButton variant="outline" className="w-full">
                  <Icons.Target />
                  <span className="ml-2">Find Jobs</span>
                </GlassButton>
              </div>
            </GlassCard>
          </div>
        </div>

        <GlassCard strong className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Icons.Brain />
            <h2 className="text-2xl font-bold text-white">AI Career Assistant</h2>
          </div>
          <div className="glass rounded-xl p-4 mb-4 h-64 overflow-y-auto">
            {chatHistory.map((msg, i) => (
              <div key={i} className={`mb-3 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                <div className={`inline-block px-4 py-2 rounded-xl max-w-[80%] ${
                  msg.role === 'user' ? 'gradient-primary text-white' : 'glass text-gray-300'
                }`}>
                  {msg.message}
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <GlassInput
              placeholder="Ask anything about this career..."
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              className="flex-1"
            />
            <GlassButton variant="primary" onClick={handleSendMessage}>
              Send
            </GlassButton>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
