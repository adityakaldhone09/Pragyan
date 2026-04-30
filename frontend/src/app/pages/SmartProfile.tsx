import { useState } from 'react';
import { GlassCard } from '../components/GlassCard';
import { GlassButton } from '../components/GlassButton';
import { GlassInput } from '../components/GlassInput';
import { SkillTag } from '../components/SkillTag';
import { AnimatedProgress } from '../components/AnimatedProgress';
import { Icons } from '../components/Icons';

interface SmartProfileProps {
  userName: string;
  onBack: () => void;
  onSave?: () => void;
}

export function SmartProfile({ userName, onBack }: SmartProfileProps) {
  const [activeTab, setActiveTab] = useState('basic');
  const [skills, setSkills] = useState(['JavaScript', 'React', 'Python', 'Problem Solving']);
  const [newSkill, setNewSkill] = useState('');
  const [interests, setInterests] = useState(['AI/ML', 'Web Development', 'Data Science']);

  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: '👤' },
    { id: 'education', label: 'Education', icon: '🎓' },
    { id: 'skills', label: 'Skills', icon: '⚡' },
    { id: 'interests', label: 'Interests', icon: '💡' },
    { id: 'preferences', label: 'Preferences', icon: '⚙️' },
    { id: 'experience', label: 'Experience', icon: '💼' }
  ];

  const profileCompletion = 72;

  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const removeSkill = (skill: string) => {
    setSkills(skills.filter(s => s !== skill));
  };

  const interestOptions = [
    'AI/ML', 'Web Development', 'Mobile Development', 'Data Science',
    'Cybersecurity', 'Cloud Computing', 'Game Development', 'UI/UX Design',
    'Product Management', 'DevOps', 'Blockchain', 'IoT'
  ];

  const toggleInterest = (interest: string) => {
    if (interests.includes(interest)) {
      setInterests(interests.filter(i => i !== interest));
    } else {
      setInterests([...interests, interest]);
    }
  };

  return (
    <div className="min-h-screen">
      <nav className="glass-strong border-b border-white/10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button onClick={onBack} className="text-gray-400 hover:text-white transition-colors flex items-center gap-2">
            ← Dashboard
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center">
              <Icons.User />
            </div>
            <div>
              <div className="text-sm font-semibold text-white">Smart Profile</div>
              <div className="text-xs text-gray-400">{profileCompletion}% Complete</div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <GlassCard strong className="p-6 sticky top-24">
              <div className="text-center mb-6">
                <div className="w-24 h-24 gradient-primary rounded-full flex items-center justify-center mx-auto mb-4 text-4xl">
                  {userName.charAt(0).toUpperCase()}
                </div>
                <h2 className="text-xl font-bold text-white mb-1">{userName}</h2>
                <p className="text-sm text-gray-400">Student</p>
              </div>

              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Profile Strength</span>
                  <span className="text-lg font-semibold text-indigo-400">{profileCompletion}%</span>
                </div>
                <AnimatedProgress value={profileCompletion} color="primary" showLabel={false} />
              </div>

              <div className="space-y-2">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 flex items-center gap-3 ${
                      activeTab === tab.id
                        ? 'gradient-primary text-white shadow-lg'
                        : 'glass text-gray-400 hover:text-white'
                    }`}
                  >
                    <span className="text-xl">{tab.icon}</span>
                    <span className="font-medium">{tab.label}</span>
                  </button>
                ))}
              </div>

              <div className="mt-6 glass rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Icons.Sparkles />
                  <span className="text-sm font-semibold text-indigo-400">AI Suggestions</span>
                </div>
                <p className="text-xs text-gray-400">Add 3 more skills to reach 80% completion</p>
              </div>
            </GlassCard>
          </div>

          <div className="lg:col-span-3">
            {activeTab === 'basic' && (
              <GlassCard strong className="p-8">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                  <span className="text-3xl">👤</span>
                  Basic Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <GlassInput label="Full Name" defaultValue={userName} />
                  <GlassInput label="Email" type="email" defaultValue="john@example.com" />
                  <GlassInput label="Phone" type="tel" placeholder="+1 (555) 000-0000" />
                  <GlassInput label="Age" type="number" placeholder="20" />
                  <GlassInput label="Location" placeholder="New York, USA" />
                  <GlassInput label="LinkedIn" placeholder="linkedin.com/in/username" />
                </div>
                <div className="mt-6 flex justify-end">
                  <GlassButton variant="primary">Save Changes</GlassButton>
                </div>
              </GlassCard>
            )}

            {activeTab === 'education' && (
              <GlassCard strong className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <span className="text-3xl">🎓</span>
                    Education
                  </h2>
                  <GlassButton variant="primary" size="sm">+ Add Education</GlassButton>
                </div>
                <div className="space-y-4">
                  <div className="glass rounded-xl p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white mb-1">Bachelor of Science in Computer Science</h3>
                        <p className="text-indigo-400 mb-2">Stanford University</p>
                        <p className="text-sm text-gray-400">2020 - 2024 • GPA: 3.8/4.0</p>
                      </div>
                      <button className="text-gray-400 hover:text-white transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </GlassCard>
            )}

            {activeTab === 'skills' && (
              <GlassCard strong className="p-8">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                  <span className="text-3xl">⚡</span>
                  Skills
                </h2>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-300 mb-3">Your Skills</label>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {skills.map((skill, i) => (
                      <SkillTag key={i} variant="primary" onRemove={() => removeSkill(skill)}>
                        {skill}
                      </SkillTag>
                    ))}
                  </div>
                  <div className="flex gap-3">
                    <GlassInput
                      placeholder="Add a skill (e.g., Python, Leadership)"
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                      className="flex-1"
                    />
                    <GlassButton variant="primary" onClick={addSkill}>Add</GlassButton>
                  </div>
                </div>

                <div className="glass rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Icons.Sparkles />
                    <span className="text-sm font-semibold text-indigo-400">AI-Detected Skills</span>
                  </div>
                  <p className="text-xs text-gray-400 mb-3">Based on your profile, we suggest adding:</p>
                  <div className="flex flex-wrap gap-2">
                    {['TypeScript', 'Docker', 'AWS'].map((skill, i) => (
                      <button
                        key={i}
                        onClick={() => setSkills([...skills, skill])}
                        className="px-3 py-1 glass hover:glass-strong rounded-full text-sm text-gray-300 hover:text-indigo-400 transition-all"
                      >
                        + {skill}
                      </button>
                    ))}
                  </div>
                </div>
              </GlassCard>
            )}

            {activeTab === 'interests' && (
              <GlassCard strong className="p-8">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                  <span className="text-3xl">💡</span>
                  Interests
                </h2>
                <p className="text-gray-400 mb-6">Select areas that interest you</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {interestOptions.map((interest, i) => (
                    <button
                      key={i}
                      onClick={() => toggleInterest(interest)}
                      className={`p-4 rounded-xl transition-all duration-200 ${
                        interests.includes(interest)
                          ? 'gradient-primary text-white shadow-lg'
                          : 'glass text-gray-400 hover:glass-strong hover:text-white'
                      }`}
                    >
                      {interest}
                    </button>
                  ))}
                </div>
              </GlassCard>
            )}

            {activeTab === 'preferences' && (
              <GlassCard strong className="p-8">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                  <span className="text-3xl">⚙️</span>
                  Work Preferences
                </h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-4">Work Environment</label>
                    <div className="grid grid-cols-2 gap-4">
                      <button className="glass-strong p-4 rounded-xl text-left hover:border-indigo-500 transition-all">
                        <div className="text-2xl mb-2">🏢</div>
                        <div className="font-semibold text-white">Indoor</div>
                        <div className="text-xs text-gray-400">Office-based work</div>
                      </button>
                      <button className="glass p-4 rounded-xl text-left hover:border-indigo-500 transition-all">
                        <div className="text-2xl mb-2">🌳</div>
                        <div className="font-semibold text-white">Outdoor</div>
                        <div className="text-xs text-gray-400">Field-based work</div>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-4">Work Style</label>
                    <div className="grid grid-cols-2 gap-4">
                      <button className="glass-strong p-4 rounded-xl text-left hover:border-indigo-500 transition-all">
                        <div className="text-2xl mb-2">💻</div>
                        <div className="font-semibold text-white">Desk Job</div>
                        <div className="text-xs text-gray-400">Computer-focused</div>
                      </button>
                      <button className="glass p-4 rounded-xl text-left hover:border-indigo-500 transition-all">
                        <div className="text-2xl mb-2">🚀</div>
                        <div className="font-semibold text-white">Field Job</div>
                        <div className="text-xs text-gray-400">Active and mobile</div>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-4">Priority</label>
                    <div className="grid grid-cols-2 gap-4">
                      <button className="glass p-4 rounded-xl text-left hover:border-indigo-500 transition-all">
                        <div className="text-2xl mb-2">💰</div>
                        <div className="font-semibold text-white">Salary</div>
                        <div className="text-xs text-gray-400">Financial growth</div>
                      </button>
                      <button className="glass-strong p-4 rounded-xl text-left hover:border-indigo-500 transition-all">
                        <div className="text-2xl mb-2">❤️</div>
                        <div className="font-semibold text-white">Passion</div>
                        <div className="text-xs text-gray-400">Work you love</div>
                      </button>
                    </div>
                  </div>
                </div>
              </GlassCard>
            )}

            {activeTab === 'experience' && (
              <GlassCard strong className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <span className="text-3xl">💼</span>
                    Experience
                  </h2>
                  <GlassButton variant="primary" size="sm">+ Add Experience</GlassButton>
                </div>
                <div className="space-y-4">
                  <div className="glass rounded-xl p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-1">Software Engineering Intern</h3>
                        <p className="text-indigo-400">Tech Corp Inc.</p>
                      </div>
                      <button className="text-gray-400 hover:text-white transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                    </div>
                    <p className="text-sm text-gray-400 mb-3">Jun 2023 - Aug 2023</p>
                    <p className="text-gray-300 text-sm">Developed features for the main platform using React and Node.js</p>
                    <div className="flex gap-2 mt-3">
                      <SkillTag variant="primary">React</SkillTag>
                      <SkillTag variant="primary">Node.js</SkillTag>
                    </div>
                  </div>
                </div>
              </GlassCard>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
