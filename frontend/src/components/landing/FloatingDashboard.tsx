import { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { RadarChart, Radar, LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Zap, Target, CheckCircle } from 'lucide-react';

const careerData = [
  { skill: 'Analytics', value: 92 },
  { skill: 'Problem Solving', value: 85 },
  { skill: 'Technology', value: 78 },
  { skill: 'Communication', value: 88 },
  { skill: 'Leadership', value: 72 },
  { skill: 'Creativity', value: 95 },
];

const progressData = [
  { week: 'W1', progress: 15 },
  { week: 'W2', progress: 28 },
  { week: 'W3', progress: 42 },
  { week: 'W4', progress: 65 },
  { week: 'W5', progress: 78 },
  { week: 'W6', progress: 92 },
];

const skillDistribution = [
  { name: 'Frontend', value: 30, color: '#3B82F6' },
  { name: 'Backend', value: 25, color: '#8B5CF6' },
  { name: 'Data', value: 25, color: '#06B6D4' },
  { name: 'DevOps', value: 20, color: '#EC4899' },
];

export default function FloatingDashboard() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    // Only attach listener when actually hovering
    if (!isHovered) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotationX = (y - centerY) / 10;
      const rotationY = (centerX - x) / 10;

      setRotation({ x: rotationX, y: rotationY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isHovered]);

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotation({ x: 0, y: 0 });
  };

  return (
    <motion.div
      ref={containerRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      initial={{ opacity: 0, scale: 0.9, y: 40 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.4 }}
      style={{
        rotateX: rotation.x,
        rotateY: rotation.y,
        perspective: '1200px',
      }}
      className="relative group"
    >
      {/* Glow Effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-cyan-500/20 rounded-3xl blur-2xl group-hover:blur-3xl transition-all duration-300 -z-10" />

      {/* Main Dashboard Card */}
      <div className="relative bg-gradient-to-br from-white/80 to-white/60 dark:from-gray-900/80 dark:to-gray-800/60 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-white/10 p-8 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">95% Match</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mt-2">Data Scientist</h3>
          </div>
          <motion.div
            animate={{ rotate: [0, 5, -4, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="p-3 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg"
          >
            <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </motion.div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 gap-6">
          {/* Skill Radar */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-blue-50/50 to-purple-50/50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-2xl p-4"
          >
            <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-3">
              Skills Assessment
            </p>
            <ResponsiveContainer width="100%" height={180}>
              <RadarChart data={careerData}>
                <Radar
                  name="Skills"
                  dataKey="value"
                  stroke="#3B82F6"
                  fill="#3B82F6"
                  fillOpacity={0.3}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: '#fff' }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Progress and Stats Row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Progress Line Chart */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:from-purple-950/30 dark:to-pink-950/30 rounded-2xl p-4"
            >
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-3">
                Learning Progress
              </p>
              <ResponsiveContainer width="100%" height={100}>
                <AreaChart data={progressData}>
                  <defs>
                    <linearGradient id="colorProgress" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="progress"
                    stroke="#8B5CF6"
                    fill="url(#colorProgress)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Skill Distribution Pie */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-gradient-to-br from-cyan-50/50 to-blue-50/50 dark:from-cyan-950/30 dark:to-blue-950/30 rounded-2xl p-4"
            >
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-3">
                Skill Mix
              </p>
              <ResponsiveContainer width="100%" height={100}>
                <PieChart>
                  <Pie
                    data={skillDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={25}
                    outerRadius={40}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {skillDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </motion.div>
          </div>

          {/* Roadmap Preview */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-gradient-to-r from-white/50 to-blue-50/50 dark:from-gray-800/50 dark:to-blue-900/30 rounded-2xl p-4 border border-blue-200/50 dark:border-blue-800/30"
          >
            <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-3">
              Personalized Roadmap
            </p>
            <div className="space-y-2">
              {['Master Core Concepts', 'Build Real Projects', 'Interview Preparation'].map((item, idx) => (
                <motion.div
                  key={item}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + idx * 0.1 }}
                  className="flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs text-gray-700 dark:text-gray-300 font-medium">{item}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: Zap, label: 'XP', value: '2,450' },
              { icon: Target, label: 'Streak', value: '12 days' },
              { icon: TrendingUp, label: 'Growth', value: '+28%' },
            ].map((stat, idx) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7 + idx * 0.1 }}
                className="bg-gradient-to-br from-gray-50/50 to-gray-100/50 dark:from-gray-800/50 dark:to-gray-700/50 rounded-lg p-3 text-center"
              >
                <stat.icon className="w-4 h-4 mx-auto mb-1 text-blue-600 dark:text-blue-400" />
                <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">{stat.label}</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white">{stat.value}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Floating Animation */}
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute inset-0 pointer-events-none"
        />
      </div>
    </motion.div>
  );
}
