import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Code2, Heart, Star, BookOpen, Briefcase, User, BarChart2, Pencil, Plus, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { authService } from "@/services/authService";

export default function Skills() {
  const { user } = useAuth();
  const [isEditingSkills, setIsEditingSkills] = useState(false);
  const [skills, setSkills] = useState(user?.skills || []);
  const [interests, setInterests] = useState(user?.interests || []);
  const [newSkill, setNewSkill] = useState("");
  const [newInterest, setNewInterest] = useState("");

  const userProfile = useMemo(() => ({
    skills: user?.skills || [],
    interests: user?.interests || [],
    education: user?.education || user?.currentCourse || "Not specified",
    experience: user?.experience || "Not specified",
    skillLevel: user?.skillLevel || "Beginner",
    experienceType: user?.experienceType || "Fresher",
    currentTitle: user?.currentTitle || "Not specified",
    careerTrack: user?.careerTrack || "Not selected",
  }), [user]);

  const handleAddSkill = () => {
    if (newSkill.trim()) {
      setSkills([...skills, newSkill]);
      setNewSkill("");
    }
  };

  const handleRemoveSkill = (index: number) => {
    setSkills(skills.filter((_, i) => i !== index));
  };

  const handleAddInterest = () => {
    if (newInterest.trim()) {
      setInterests([...interests, newInterest]);
      setNewInterest("");
    }
  };

  const handleRemoveInterest = (index: number) => {
    setInterests(interests.filter((_, i) => i !== index));
  };

  const handleSaveChanges = async () => {
    try {
      await authService.updateProfile({
        skills,
        interests,
      });
      setIsEditingSkills(false);
    } catch (error) {
      console.error("Failed to save skills:", error);
    }
  };

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Skills, Interest and Education</h1>
          <p className="text-muted-foreground mt-1">These fields drive matching quality, readiness scoring, and roadmap suggestions.</p>
        </div>
        <Button 
          variant="outline" 
          className="rounded-xl px-5 flex items-center gap-2"
          onClick={() => setIsEditingSkills(!isEditingSkills)}
          data-testid="button-edit-skills"
        >
          <Pencil className="w-4 h-4" /> {isEditingSkills ? "Done" : "Edit"}
        </Button>
      </div>

      <div className="bg-card border border-border rounded-[20px] shadow-sm overflow-hidden mb-6">
        <div className="flex items-center gap-5 px-7 py-5 border-b border-border">
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
            <Code2 className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-foreground">Skills</p>
            {isEditingSkills ? (
              <div className="mt-2 space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add a skill..."
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddSkill()}
                    className="flex-1 px-3 py-1 rounded border border-border text-sm"
                  />
                  <Button 
                    size="sm" 
                    onClick={handleAddSkill}
                    className="rounded px-3"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm">
                      {skill}
                      <button 
                        onClick={() => handleRemoveSkill(idx)}
                        className="text-primary/60 hover:text-primary"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground mt-0.5">{userProfile.skills.join(", ") || "No skills added yet"}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-5 px-7 py-5 border-b border-border">
          <div className="w-10 h-10 rounded-xl bg-red-100 text-red-500 flex items-center justify-center flex-shrink-0">
            <Heart className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-foreground">Interests</p>
            {isEditingSkills ? (
              <div className="mt-2 space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add an interest..."
                    value={newInterest}
                    onChange={(e) => setNewInterest(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddInterest()}
                    className="flex-1 px-3 py-1 rounded border border-border text-sm"
                  />
                  <Button 
                    size="sm" 
                    onClick={handleAddInterest}
                    className="rounded px-3"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {interests.map((interest, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-red-100/50 text-red-600 px-3 py-1 rounded-full text-sm">
                      {interest}
                      <button 
                        onClick={() => handleRemoveInterest(idx)}
                        className="text-red-600/60 hover:text-red-600"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground mt-0.5">{userProfile.interests.join(", ") || "No interests added yet"}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-5 px-7 py-5">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-500 flex items-center justify-center flex-shrink-0">
            <Star className="w-5 h-5" />
          </div>
          <div>
            <p className="font-semibold text-foreground">Preferences</p>
            <p className="text-sm text-muted-foreground mt-0.5">Remote work, team projects, fast-paced learning</p>
          </div>
        </div>
      </div>

      {isEditingSkills && (
        <div className="flex gap-3 mb-6">
          <Button 
            onClick={handleSaveChanges}
            className="rounded-xl"
          >
            Save Changes
          </Button>
          <Button 
            variant="outline"
            onClick={() => {
              setIsEditingSkills(false);
              setSkills(user?.skills || []);
              setInterests(user?.interests || []);
            }}
            className="rounded-xl"
          >
            Cancel
          </Button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {[
          { icon: BookOpen, iconBg: "bg-blue-100 text-blue-600", label: "Education", value: userProfile.education },
          { icon: Briefcase, iconBg: "bg-purple-100 text-purple-600", label: "Experience", value: userProfile.experience },
          { icon: User, iconBg: "bg-green-100 text-green-600", label: "Experience Type", value: userProfile.experienceType },
          { icon: BarChart2, iconBg: "bg-amber-100 text-amber-600", label: "Skill Level", value: userProfile.skillLevel },
        ].map(({ icon: Icon, iconBg, label, value }) => (
          <div key={label} className="bg-card border border-border rounded-[20px] p-6 shadow-sm flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-foreground">{label}</p>
              <p className="text-sm text-muted-foreground mt-0.5">{value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
