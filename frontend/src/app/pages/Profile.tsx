import { useState } from 'react';
import { Navbar } from '../components/Navbar';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Tag } from '../components/Tag';
import { ProgressBar } from '../components/ProgressBar';

interface ProfileProps {
  userName: string;
  onLogout: () => void;
  onNavigate?: (page: 'dashboard' | 'profile' | 'roadmap') => void;
}

export function Profile({ userName, onLogout, onNavigate }: ProfileProps) {
  const [skills, setSkills] = useState(['Python', 'React', 'Machine Learning']);
  const [newSkill, setNewSkill] = useState('');

  const handleAddSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter(skill => skill !== skillToRemove));
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Navbar userName={userName} onLogout={onLogout} onNavigate={onNavigate} />

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h2 className="text-3xl font-semibold text-[#0F172A] mb-2">Profile</h2>
              <p className="text-[#475569]">Manage your personal information and credentials</p>
            </div>

            <Card className="p-6">
              <h3 className="text-xl font-semibold text-[#0F172A] mb-6">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Input label="Full Name" defaultValue={userName} />
                <Input label="Email" type="email" defaultValue="john@example.com" />
                <Input label="Phone" type="tel" placeholder="+1 (555) 000-0000" />
                <Input label="LinkedIn Profile" placeholder="linkedin.com/in/username" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-[#0F172A]">Education</h3>
                <Button variant="outline" size="sm">+ Add</Button>
              </div>
              <div className="space-y-4">
                <div className="p-5 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-[#0F172A]">Bachelor of Science in Computer Science</h4>
                      <p className="text-[#475569]">Stanford University</p>
                    </div>
                    <button className="text-[#94A3B8] hover:text-[#475569]">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                  </div>
                  <p className="text-sm text-[#475569]">2020 - 2024 • GPA: 3.8/4.0</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-[#0F172A]">Experience</h3>
                <Button variant="outline" size="sm">+ Add</Button>
              </div>
              <div className="space-y-4">
                <div className="p-5 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-[#0F172A]">Software Engineering Intern</h4>
                      <p className="text-[#475569]">Tech Corp Inc.</p>
                    </div>
                    <button className="text-[#94A3B8] hover:text-[#475569]">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                  </div>
                  <p className="text-sm text-[#475569] mb-3">Jun 2023 - Aug 2023</p>
                  <p className="text-sm text-[#0F172A]">
                    Developed features for the main web application using React and Node.js. Collaborated with cross-functional teams to deliver user-facing features.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-[#0F172A]">Projects</h3>
                <Button variant="outline" size="sm">+ Add</Button>
              </div>
              <div className="space-y-4">
                <div className="p-5 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-[#0F172A]">AI Chatbot Application</h4>
                      <p className="text-sm text-[#475569] mt-2">
                        Built a conversational AI chatbot using Python and natural language processing. Implemented sentiment analysis and context management.
                      </p>
                    </div>
                    <button className="text-[#94A3B8] hover:text-[#475569]">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Tag variant="primary">Python</Tag>
                    <Tag variant="primary">NLP</Tag>
                    <Tag variant="primary">Flask</Tag>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-xl font-semibold text-[#0F172A] mb-6">Skills</h3>
              <div className="flex flex-wrap gap-2 mb-4">
                {skills.map((skill, index) => (
                  <Tag key={index} variant="primary" onRemove={() => handleRemoveSkill(skill)}>
                    {skill}
                  </Tag>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Add a skill"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()}
                />
                <Button variant="primary" onClick={handleAddSkill}>Add</Button>
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="font-semibold text-[#0F172A] mb-4">Profile Strength</h3>
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-3xl font-semibold text-[#2563EB]">65%</span>
                  <span className="text-sm text-[#475569]">Good</span>
                </div>
                <ProgressBar value={65} />
              </div>
              <p className="text-sm text-[#475569] mb-4">
                Complete your profile to get better career recommendations
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-5 h-5 bg-[#10B981] rounded-full flex items-center justify-center text-white">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-[#0F172A]">Personal information</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-5 h-5 bg-[#10B981] rounded-full flex items-center justify-center text-white">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-[#0F172A]">Education</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-5 h-5 bg-[#F59E0B] rounded-full flex items-center justify-center text-white text-xs">
                    1
                  </div>
                  <span className="text-[#475569]">Add more experience</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-5 h-5 bg-[#F59E0B] rounded-full flex items-center justify-center text-white text-xs">
                    2
                  </div>
                  <span className="text-[#475569]">Add certifications</span>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold text-[#0F172A] mb-4">AI Suggestions</h3>
              <div className="space-y-3">
                <div className="p-3 bg-[#EFF6FF] rounded-lg">
                  <p className="text-sm text-[#2563EB]">
                    💼 Add your internship details to showcase real-world experience
                  </p>
                </div>
                <div className="p-3 bg-[#EFF6FF] rounded-lg">
                  <p className="text-sm text-[#2563EB]">
                    🏆 Include your hackathon wins to stand out
                  </p>
                </div>
                <div className="p-3 bg-[#EFF6FF] rounded-lg">
                  <p className="text-sm text-[#2563EB]">
                    📝 Add project descriptions with measurable impact
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline">Cancel</Button>
          <Button variant="primary">Save Changes</Button>
        </div>
      </div>
    </div>
  );
}
