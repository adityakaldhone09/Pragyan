import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, ChevronRight } from "lucide-react";
import { profileService } from "@/services/profileService";

interface CertificationForm {
  title: string;
  issuer: string;
  issued: string;
  credential: string;
  expires: string;
}

export default function Certificates() {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CertificationForm>({
    title: "",
    issuer: "",
    issued: "",
    credential: "",
    expires: "",
  });

  const { data: profile, refetch } = useQuery({
    queryKey: ["profile"],
    queryFn: profileService.getProfile,
    retry: false,
  });

  const createCertMutation = useMutation({
    mutationFn: (data: CertificationForm) =>
      profileService.createCertification(data as any),
    onSuccess: () => {
      refetch();
      setFormData({ title: "", issuer: "", issued: "", credential: "", expires: "" });
      setIsAdding(false);
    },
  });

  const handleAddCertification = async () => {
    if (formData.title && formData.issuer) {
      await createCertMutation.mutateAsync(formData);
    }
  };

  const certifications = profile?.certifications || [];

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-3xl font-bold text-foreground tracking-tight">Certificates</h1>
        <Button 
          className="rounded-xl px-5"
          onClick={() => setIsAdding(!isAdding)}
          data-testid="button-add-certification"
        >
          <Plus className="w-4 h-4 mr-2" /> Add Certification
        </Button>
      </div>

      <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-8">
        <Link href="/resources" className="hover:text-foreground transition-colors">Resources</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-primary font-medium">Certifications</span>
      </div>

      <p className="text-muted-foreground text-sm mb-6 -mt-4">Add and manage your certifications.</p>

      {isAdding && (
        <div className="bg-card border border-border rounded-[20px] p-6 shadow-sm mb-6">
          <h3 className="font-semibold text-foreground mb-4">Add New Certification</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <input
              type="text"
              placeholder="Certification Title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="px-4 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <input
              type="text"
              placeholder="Issuer"
              value={formData.issuer}
              onChange={(e) => setFormData({ ...formData, issuer: e.target.value })}
              className="px-4 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <input
              type="date"
              placeholder="Issued Date"
              value={formData.issued}
              onChange={(e) => setFormData({ ...formData, issued: e.target.value })}
              className="px-4 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <input
              type="text"
              placeholder="Credential ID"
              value={formData.credential}
              onChange={(e) => setFormData({ ...formData, credential: e.target.value })}
              className="px-4 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <input
              type="date"
              placeholder="Expiration Date"
              value={formData.expires}
              onChange={(e) => setFormData({ ...formData, expires: e.target.value })}
              className="px-4 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              col-span={2}
            />
          </div>
          <div className="flex gap-3">
            <Button
              onClick={handleAddCertification}
              disabled={createCertMutation.isPending}
              className="rounded-xl"
            >
              {createCertMutation.isPending ? "Adding..." : "Add Certification"}
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsAdding(false)}
              className="rounded-xl"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {certifications.length > 0 ? (
          certifications.map((cert: any) => (
            <div key={cert.id} className="bg-card border border-border rounded-[20px] p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start gap-5">
                <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 text-lg font-bold text-primary">
                  {cert.issuer?.slice(0, 2).toUpperCase() || "C"}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <h3 className="font-bold text-foreground text-lg leading-tight">{cert.title}</h3>
                    <div className="flex items-center gap-2 ml-4">
                      <button 
                        className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary transition-colors"
                        onClick={() => setEditingId(cert.id)}
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button 
                        className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-destructive hover:border-destructive transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-x-12 gap-y-3">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Issuer</p>
                      <p className="text-sm font-semibold text-foreground mt-0.5">{cert.issuer}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Credential ID</p>
                      <p className="text-sm font-semibold text-foreground mt-0.5">{cert.credential}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Issue Date</p>
                      <p className="text-sm font-semibold text-foreground mt-0.5">{new Date(cert.issued).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Expires</p>
                      <p className="text-sm font-semibold text-foreground mt-0.5">{new Date(cert.expires).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-card border border-border rounded-[20px] p-12 shadow-sm text-center">
            <p className="text-muted-foreground mb-4">No certifications added yet.</p>
            <Button 
              onClick={() => setIsAdding(true)}
              className="rounded-xl"
            >
              <Plus className="w-4 h-4 mr-2" /> Add Your First Certification
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
