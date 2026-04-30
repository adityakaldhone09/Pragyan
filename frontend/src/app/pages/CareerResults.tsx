import { Navbar } from '../components/Navbar';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { ProgressBar } from '../components/ProgressBar';
import { Tag } from '../components/Tag';

interface CareerResultsProps {
  userName: string;
  onLogout: () => void;
  onBack: () => void;
  onNavigate?: (page: 'dashboard' | 'profile' | 'roadmap') => void;
}

export function CareerResults({ userName, onLogout, onBack, onNavigate }: CareerResultsProps) {
  const careers = [
    {
      title: 'Software Engineer',
      match: 92,
      description: 'Design, develop, and maintain software applications and systems.',
      why: 'Your strong analytical thinking, problem-solving skills, and interest in technology align perfectly with this role. You excel at logical reasoning and enjoy building solutions.',
      skills: ['Python', 'JavaScript', 'Problem Solving', 'Data Structures', 'Git']
    },
    {
      title: 'Data Scientist',
      match: 87,
      description: 'Analyze complex data to help companies make better decisions.',
      why: 'Your mathematical aptitude and curiosity about patterns make you a great fit. You enjoy working with numbers and deriving insights from data.',
      skills: ['Python', 'Statistics', 'Machine Learning', 'SQL', 'Data Visualization']
    },
    {
      title: 'Product Manager',
      match: 79,
      description: 'Lead product development from conception to launch.',
      why: 'Your communication skills and strategic thinking complement your technical knowledge. You understand both user needs and technical feasibility.',
      skills: ['Product Strategy', 'Communication', 'Analytics', 'User Research', 'Agile']
    }
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Navbar userName={userName} onLogout={onLogout} onNavigate={onNavigate} />

      <div className="max-w-5xl mx-auto p-6">
        <div className="mb-8">
          <Button variant="ghost" onClick={onBack} className="mb-4">
            ← Back to Dashboard
          </Button>
          <h2 className="text-3xl font-semibold text-[#0F172A] mb-2">
            Your Personalized Career Matches
          </h2>
          <p className="text-[#475569]">
            Based on your assessment, here are the top careers that align with your skills and interests.
          </p>
        </div>

        <div className="space-y-6">
          {careers.map((career, index) => (
            <Card key={index} className="p-8">
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-2xl font-semibold text-[#0F172A]">{career.title}</h3>
                    {index === 0 && (
                      <span className="px-3 py-1 bg-[#FEF3C7] text-[#92400E] rounded-full text-sm">
                        Best Match
                      </span>
                    )}
                  </div>
                  <p className="text-[#475569]">{career.description}</p>
                </div>
                <div className="ml-6 text-right">
                  <span className="text-4xl font-semibold text-[#2563EB]">{career.match}%</span>
                  <p className="text-sm text-[#475569]">match</p>
                </div>
              </div>

              <ProgressBar value={career.match} className="mb-6" />

              <div className="mb-6">
                <h4 className="font-semibold text-[#0F172A] mb-3">Why this fits you</h4>
                <p className="text-[#475569] leading-relaxed">{career.why}</p>
              </div>

              <div>
                <h4 className="font-semibold text-[#0F172A] mb-3">Skills required</h4>
                <div className="flex flex-wrap gap-2">
                  {career.skills.map((skill, skillIndex) => (
                    <Tag key={skillIndex} variant="primary">{skill}</Tag>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-[#E2E8F0]">
                <Button variant="primary">View Learning Roadmap</Button>
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Card className="p-6">
            <h3 className="font-semibold text-[#0F172A] mb-2">Want more personalized guidance?</h3>
            <p className="text-[#475569] mb-4">
              Complete your profile to get tailored recommendations and learning paths.
            </p>
            <Button variant="secondary">Complete Your Profile</Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
