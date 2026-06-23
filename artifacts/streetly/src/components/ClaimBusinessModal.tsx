import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ShieldCheck, CheckCircle, AlertCircle } from "lucide-react";

interface ClaimBusinessModalProps {
  open: boolean;
  onClose: () => void;
  businessId: number;
  businessName: string;
}

type Step = "form" | "success" | "error";

export function ClaimBusinessModal({ open, onClose, businessId, businessName }: ClaimBusinessModalProps) {
  const [step, setStep] = useState<Step>("form");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [form, setForm] = useState({
    claimerName: "",
    claimerEmail: "",
    claimerPhone: "",
    proofNote: "",
  });

  const update = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }));

  const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    try {
      const token = localStorage.getItem("streetly_token");
      const res = await fetch(`${BASE}/api/businesses/${businessId}/claim`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data?.error ?? "Something went wrong. Please try again.");
        setStep("error");
      } else {
        setStep("success");
      }
    } catch {
      setErrorMsg("Network error. Please try again.");
      setStep("error");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep("form");
    setErrorMsg("");
    setForm({ claimerName: "", claimerEmail: "", claimerPhone: "", proofNote: "" });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        {step === "success" ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <DialogTitle className="text-xl mb-2">Claim Submitted!</DialogTitle>
            <DialogDescription className="text-base mb-6">
              Your ownership claim for <strong>{businessName}</strong> has been received.
              Our team will verify your details and respond within 24–48 hours.
            </DialogDescription>
            <Button onClick={handleClose} className="w-full">Done</Button>
          </div>
        ) : step === "error" ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <DialogTitle className="text-xl mb-2">Claim Failed</DialogTitle>
            <DialogDescription className="text-base mb-6">{errorMsg}</DialogDescription>
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleClose} className="flex-1">Cancel</Button>
              <Button onClick={() => setStep("form")} className="flex-1">Try Again</Button>
            </div>
          </div>
        ) : (
          <>
            <DialogHeader>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                </div>
                <DialogTitle className="text-xl">Claim This Business</DialogTitle>
              </div>
              <DialogDescription>
                Prove you own <strong>{businessName}</strong> to take control of the listing,
                respond to reviews, and update business details.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              <div>
                <Label htmlFor="claimerName">Your Full Name *</Label>
                <Input
                  id="claimerName"
                  value={form.claimerName}
                  onChange={e => update("claimerName", e.target.value)}
                  placeholder="As it appears on business documents"
                  required
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="claimerEmail">Business Email Address *</Label>
                <Input
                  id="claimerEmail"
                  type="email"
                  value={form.claimerEmail}
                  onChange={e => update("claimerEmail", e.target.value)}
                  placeholder="Contact email for this business"
                  required
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="claimerPhone">Business Phone Number</Label>
                <Input
                  id="claimerPhone"
                  value={form.claimerPhone}
                  onChange={e => update("claimerPhone", e.target.value)}
                  placeholder="+234..."
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="proofNote">How can we verify your ownership? *</Label>
                <Textarea
                  id="proofNote"
                  value={form.proofNote}
                  onChange={e => update("proofNote", e.target.value)}
                  placeholder="e.g. I have the CAC registration document, the business account is in my name, I can be reached at the listed phone number..."
                  rows={3}
                  required
                  className="mt-1.5"
                />
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-700">
                By submitting, you confirm you are the rightful owner of this business.
                False claims may result in account suspension.
              </div>

              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={loading || !form.claimerName || !form.claimerEmail || !form.proofNote}
                >
                  {loading ? "Submitting..." : "Submit Claim"}
                </Button>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
