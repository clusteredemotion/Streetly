import { useState } from "react";
import { useLocation } from "wouter";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useApplyAsAgent } from "@workspace/api-client-react";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

const NIGERIAN_BANKS = [
  "Access Bank", "GTBank", "First Bank", "Zenith Bank", "UBA",
  "FCMB", "Sterling Bank", "Union Bank", "Fidelity Bank", "Wema Bank",
  "Polaris Bank", "Ecobank", "Stanbic IBTC", "Citibank", "Keystone Bank",
  "Heritage Bank", "Providus Bank", "Opay", "Palmpay", "Kuda Bank"
];

export default function AgentApplyPage() {
  const [, navigate] = useLocation();
  const applyMutation = useApplyAsAgent();
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    bankName: "", accountNumber: "", accountName: "", idType: "nin", idNumber: "",
  });

  const update = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await applyMutation.mutateAsync({ data: form });
    setSuccess(true);
  };

  if (success) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 max-w-lg text-center">
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}>
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-3">Application Submitted!</h2>
            <p className="text-muted-foreground mb-8">
              Your agent application has been received. Our team will review it within 24–48 hours and notify you via email.
            </p>
            <Button onClick={() => navigate("/agents")}>Back to Agents Page</Button>
          </motion.div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-xl">
        <Button variant="ghost" onClick={() => navigate("/agents")} className="mb-6 gap-2 -ml-2">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>

        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Agent Application</h1>
          <p className="text-muted-foreground mt-2">
            Fill in your bank details and ID information to apply as a Streetly Field Agent.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Bank Details */}
          <div className="p-6 border rounded-xl bg-card">
            <h2 className="font-bold mb-5 text-foreground">Bank Details</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="bankName">Bank Name *</Label>
                <Select value={form.bankName} onValueChange={(v) => update("bankName", v)}>
                  <SelectTrigger id="bankName" className="mt-1.5">
                    <SelectValue placeholder="Select your bank" />
                  </SelectTrigger>
                  <SelectContent>
                    {NIGERIAN_BANKS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="accountNumber">Account Number *</Label>
                <Input
                  id="accountNumber"
                  value={form.accountNumber}
                  onChange={(e) => update("accountNumber", e.target.value)}
                  placeholder="10-digit account number"
                  maxLength={10}
                  pattern="[0-9]{10}"
                  required
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="accountName">Account Name *</Label>
                <Input
                  id="accountName"
                  value={form.accountName}
                  onChange={(e) => update("accountName", e.target.value)}
                  placeholder="As shown on your bank statement"
                  required
                  className="mt-1.5"
                />
              </div>
            </div>
          </div>

          {/* ID Verification */}
          <div className="p-6 border rounded-xl bg-card">
            <h2 className="font-bold mb-5 text-foreground">Identity Verification</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="idType">ID Type</Label>
                <Select value={form.idType} onValueChange={(v) => update("idType", v)}>
                  <SelectTrigger id="idType" className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nin">National ID (NIN)</SelectItem>
                    <SelectItem value="bvn">BVN</SelectItem>
                    <SelectItem value="voters_card">Voter's Card</SelectItem>
                    <SelectItem value="drivers_license">Driver's License</SelectItem>
                    <SelectItem value="intl_passport">International Passport</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="idNumber">ID Number</Label>
                <Input
                  id="idNumber"
                  value={form.idNumber}
                  onChange={(e) => update("idNumber", e.target.value)}
                  placeholder="Enter your ID number"
                  className="mt-1.5"
                />
              </div>
            </div>
          </div>

          <div className="text-sm text-muted-foreground bg-muted/40 rounded-lg p-4">
            By applying, you agree to our field agent terms of service. Commissions are paid upon approval of each business listing.
          </div>

          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={applyMutation.isPending || !form.bankName || !form.accountNumber || !form.accountName}
          >
            {applyMutation.isPending ? "Submitting Application..." : "Submit Application"}
          </Button>
        </form>
      </div>
    </Layout>
  );
}
