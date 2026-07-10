import { useCallback, useRef, useState } from "react";
import { useLocation, Link } from "wouter";
import { motion } from "framer-motion";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Building2, Plus, X, Loader2, CheckCircle, ArrowLeft, ImageIcon, Upload, Info, Phone } from "lucide-react";
import { getApiBase } from "@/lib/utils";

const BASE = getApiBase();
const authHeader = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("streetly_token") ?? ""}`,
});

function compressImage(file: File, maxW = 1200, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > maxW) { height = Math.round((height * maxW) / width); width = maxW; }
      const canvas = document.createElement("canvas");
      canvas.width = width; canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas error"));
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = reject;
    img.src = url;
  });
}

export default function PropertySubmitPage() {
  const [, navigate] = useLocation();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    address: "",
    sizeSqft: "",
    priceAmount: "",
    priceType: "rent" as "rent" | "lease" | "sale",
    contactName: "",
    contactPhone: "",
  });

  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!localStorage.getItem("streetly_token")) {
      navigate("/auth/login?redirect=/properties/submit");
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch(`${BASE}/api/properties`, {
        method: "POST",
        headers: authHeader(),
        body: JSON.stringify({
          ...form,
          sizeSqft: form.sizeSqft ? Number(form.sizeSqft) : undefined,
          priceAmount: form.priceAmount ? Number(form.priceAmount) : undefined,
          photos: photoUrls,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to submit property");

      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const MAX_PHOTOS = 8;

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const remaining = MAX_PHOTOS - photoUrls.length;
    if (remaining <= 0) return;
    setUploadingPhotos(true);
    setError(null);
    try {
      const items = Array.from(files).slice(0, remaining);
      const compressed = await Promise.all(items.map((f) => compressImage(f)));
      setPhotoUrls((prev) => [...prev, ...compressed]);
    } catch {
      setError("Failed to process one or more photos. Please try again.");
    } finally {
      setUploadingPhotos(false);
    }
  }, [photoUrls.length]);

  const removePhoto = (idx: number) => {
    setPhotoUrls(photoUrls.filter((_, i) => i !== idx));
  };

  if (success) {
    return (
      <Layout>
        <div className="min-h-[80vh] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-card border border-border rounded-3xl p-8 text-center shadow-xl"
          >
            <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-10 w-10 text-emerald-500" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-4">Submission Successful!</h2>
            <p className="text-muted-foreground mb-8">
              Your property listing has been submitted and is currently pending review. 
              An admin will review it shortly.
            </p>
            <div className="flex flex-col gap-3">
              <Link href="/properties">
                <Button className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 font-bold">
                  Browse Properties
                </Button>
              </Link>
              <Button 
                variant="outline" 
                className="w-full h-12 rounded-xl"
                onClick={() => {
                  setSuccess(false);
                  setForm({
                    title: "",
                    description: "",
                    address: "",
                    sizeSqft: "",
                    priceAmount: "",
                    priceType: "rent",
                    contactName: "",
                    contactPhone: "",
                  });
                  setPhotoUrls([]);
                }}
              >
                List Another Property
              </Button>
            </div>
          </motion.div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="bg-muted/30 min-h-screen py-12 px-4">
        <div className="container mx-auto max-w-3xl">
          <Link href="/properties" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-6 group">
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Back to Listings
          </Link>

          <div className="bg-card border border-border rounded-3xl shadow-sm overflow-hidden">
            <div className="bg-[#0547B6] p-8 text-white relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl" />
               <div className="relative z-10">
                 <h1 className="text-2xl font-black mb-2">List a Property</h1>
                 <p className="text-blue-100/80 text-sm">Fill out the details below to list a vacant commercial space.</p>
               </div>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-8">
              {error && (
                <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium flex items-center gap-2">
                  <X className="h-4 w-4" />
                  {error}
                </div>
              )}

              {/* Property Details */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <h2 className="text-lg font-bold text-foreground">Property Details</h2>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="title">Property Title <span className="text-destructive">*</span></Label>
                    <Input 
                      id="title"
                      placeholder="e.g. Spacious Shop at Lekki Phase 1"
                      required
                      value={form.title}
                      onChange={(e) => setForm({...form, title: e.target.value})}
                      className="rounded-xl h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Full Address <span className="text-destructive">*</span></Label>
                    <Input 
                      id="address"
                      placeholder="Street name, Area, City"
                      required
                      value={form.address}
                      onChange={(e) => setForm({...form, address: e.target.value})}
                      className="rounded-xl h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea 
                      id="description"
                      placeholder="Tell potential tenants about the space, amenities, and location advantages..."
                      rows={4}
                      value={form.description}
                      onChange={(e) => setForm({...form, description: e.target.value})}
                      className="rounded-xl resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="size">Size (sqft)</Label>
                      <Input 
                        id="size"
                        type="number"
                        placeholder="e.g. 1200"
                        value={form.sizeSqft}
                        onChange={(e) => setForm({...form, sizeSqft: e.target.value})}
                        className="rounded-xl h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Price Type</Label>
                      <RadioGroup 
                        value={form.priceType} 
                        onValueChange={(v: any) => setForm({...form, priceType: v})}
                        className="flex gap-4 pt-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="rent" id="rent" />
                          <Label htmlFor="rent" className="font-medium cursor-pointer">Rent</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="lease" id="lease" />
                          <Label htmlFor="lease" className="font-medium cursor-pointer">Lease</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="sale" id="sale" />
                          <Label htmlFor="sale" className="font-medium cursor-pointer">Sale</Label>
                        </div>
                      </RadioGroup>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="price">Price Amount (₦)</Label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">₦</span>
                      <Input 
                        id="price"
                        type="number"
                        placeholder="e.g. 2500000"
                        value={form.priceAmount}
                        onChange={(e) => setForm({...form, priceAmount: e.target.value})}
                        className="rounded-xl h-11 pl-8"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <hr className="border-border/50" />

              {/* Photos */}
              <div className="space-y-6">
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <ImageIcon className="h-4 w-4" />
                    </div>
                    <h2 className="text-lg font-bold text-foreground">Property Photos</h2>
                  </div>
                  <Badge variant="outline" className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Optional</Badge>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {photoUrls.map((url, idx) => (
                    <div key={idx} className="aspect-square rounded-2xl overflow-hidden relative group border border-border">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      <button 
                        type="button"
                        onClick={() => removePhoto(idx)}
                        className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  {photoUrls.length < MAX_PHOTOS && (
                    <div
                      onClick={() => !uploadingPhotos && fileInputRef.current?.click()}
                      className="aspect-square rounded-2xl border-2 border-dashed border-muted flex flex-col items-center justify-center text-muted-foreground text-[10px] font-medium text-center p-2 cursor-pointer hover:border-primary/60 hover:text-primary transition-colors"
                    >
                      {uploadingPhotos ? (
                        <Loader2 className="h-5 w-5 animate-spin mb-1" />
                      ) : (
                        <Upload className="h-5 w-5 mb-1" />
                      )}
                      <span>{uploadingPhotos ? "Uploading…" : "Upload from device"}</span>
                    </div>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => { handleFiles(e.target.files); e.target.value = ""; }}
                />

                <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Info className="h-3 w-3" />
                  {photoUrls.length === 0
                    ? `Upload up to ${MAX_PHOTOS} photos directly from your device.`
                    : `${photoUrls.length} of ${MAX_PHOTOS} photo(s) added.`}
                </p>
              </div>

              <hr className="border-border/50" />

              {/* Contact Info */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                    <Phone className="h-4 w-4" />
                  </div>
                  <h2 className="text-lg font-bold text-foreground">Contact Information</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="contactName">Contact Name <span className="text-destructive">*</span></Label>
                    <Input 
                      id="contactName"
                      placeholder="Name of the agent or owner"
                      required
                      value={form.contactName}
                      onChange={(e) => setForm({...form, contactName: e.target.value})}
                      className="rounded-xl h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactPhone">Phone Number <span className="text-destructive">*</span></Label>
                    <Input 
                      id="contactPhone"
                      placeholder="e.g. 08012345678"
                      required
                      value={form.contactPhone}
                      onChange={(e) => setForm({...form, contactPhone: e.target.value})}
                      className="rounded-xl h-11"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-8">
                <Button 
                  type="submit" 
                  disabled={submitting}
                  className="w-full h-14 bg-[#0547B6] hover:bg-[#0437a0] text-white rounded-2xl text-lg font-black shadow-lg shadow-blue-500/20"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Listing for Approval"
                  )}
                </Button>
                <p className="text-center text-[10px] text-muted-foreground mt-4">
                  By clicking submit, you agree to our terms for listing commercial properties.
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
}
