import { useState } from "react";
import { motion } from "framer-motion";
import { useSeo } from "@/hooks/useSeo";
import { Layout } from "@/components/layout/Layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Phone, Mail, MapPin, MessageCircle, Facebook, Twitter, Instagram, Linkedin, CheckCircle2, Loader2 } from "lucide-react";
import { useSubmitContact } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

export default function ContactPage() {
  const { toast } = useToast();

  useSeo({
    title: "Contact Us",
    description: "Get in touch with the Streetly team. We're here to help with questions about listing your business, partnerships, or anything else.",
    canonicalPath: "/contact",
  });
  const submitContact = useSubmitContact();
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });

  const channels = [
    {
      icon: Phone,
      title: "Call Us",
      value: "+44 7577 077622",
      href: "tel:+447577077622",
    },
    {
      icon: Mail,
      title: "Email Us",
      value: "support@mystreetly.app",
      href: "mailto:support@mystreetly.app",
    },
    {
      icon: MessageCircle,
      title: "WhatsApp",
      value: "+44 7577 077622",
      href: "https://wa.me/447577077622",
    },
  ];

  const handleChange = (field: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitContact.mutate(
      { data: form },
      {
        onSuccess: () => {
          toast({
            title: "Message sent",
            description: "Thanks for reaching out — our team will get back to you shortly.",
          });
          setForm({ name: "", email: "", subject: "", message: "" });
        },
        onError: () => {
          toast({
            title: "Something went wrong",
            description: "We couldn't send your message. Please try again.",
            variant: "destructive",
          });
        },
      }
    );
  };

  return (
    <Layout>
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#0547B6] via-[#0a5cd8] to-[#1a6de8] text-white py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto text-center"
          >
            <Badge className="mb-6 bg-yellow-400/20 text-yellow-300 border-yellow-400/30">
              Get In Touch
            </Badge>
            <h1 className="text-4xl md:text-5xl font-extrabold mb-6 leading-tight">
              We'd Love to <span className="text-yellow-300">Hear From You</span>
            </h1>
            <p className="text-blue-100 text-xl max-w-2xl mx-auto leading-relaxed">
              Whether you're a business owner, a Street Scout, or just curious about Streetly —
              reach out and our team will get back to you.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Channels */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto mb-16">
            {channels.map((c, i) => (
              <motion.a
                key={c.title}
                href={c.href}
                target={c.href.startsWith("http") ? "_blank" : undefined}
                rel={c.href.startsWith("http") ? "noreferrer" : undefined}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="bg-card border rounded-2xl p-6 text-center hover:border-[#0547B6]/40 hover:shadow-md transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-[#0547B6]/10 flex items-center justify-center mx-auto mb-4">
                  <c.icon className="h-5 w-5 text-[#0547B6]" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">{c.title}</h3>
                <p className="text-sm text-muted-foreground break-words">{c.value}</p>
              </motion.a>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-2xl mx-auto bg-card border rounded-2xl p-8 mb-16"
          >
            <h3 className="text-xl font-semibold text-foreground mb-1 text-center">Send Us a Message</h3>
            <p className="text-sm text-muted-foreground text-center mb-6">
              Fill out the form below and our team will respond as soon as possible.
            </p>

            {submitContact.isSuccess ? (
              <div className="flex flex-col items-center text-center py-8">
                <CheckCircle2 className="h-10 w-10 text-green-500 mb-3" />
                <h4 className="font-semibold text-foreground mb-1">Message sent!</h4>
                <p className="text-sm text-muted-foreground">
                  Thanks for reaching out — we'll get back to you shortly.
                </p>
                <Button
                  variant="outline"
                  className="mt-6"
                  onClick={() => submitContact.reset()}
                >
                  Send another message
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      required
                      value={form.name}
                      onChange={handleChange("name")}
                      placeholder="Your name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      value={form.email}
                      onChange={handleChange("email")}
                      placeholder="you@example.com"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    required
                    value={form.subject}
                    onChange={handleChange("subject")}
                    placeholder="What's this about?"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    required
                    rows={5}
                    value={form.message}
                    onChange={handleChange("message")}
                    placeholder="Tell us more..."
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-[#0547B6] hover:bg-[#0547B6]/90"
                  disabled={submitContact.isPending}
                >
                  {submitContact.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send Message"
                  )}
                </Button>
              </form>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-2xl mx-auto bg-card border rounded-2xl p-8 text-center"
          >
            <div className="w-12 h-12 rounded-xl bg-[#0547B6]/10 flex items-center justify-center mx-auto mb-4">
              <MapPin className="h-5 w-5 text-[#0547B6]" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">Where We Operate</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Streetly is a global street-by-street business discovery platform. Our Street Scouts
              are actively mapping neighborhoods across multiple cities and countries — with more
              being added all the time.
            </p>
          </motion.div>

          <div className="flex justify-center gap-3 mt-10">
            <a href="#" aria-label="Facebook" className="w-10 h-10 rounded-full flex items-center justify-center bg-muted text-muted-foreground hover:bg-[#0547B6] hover:text-white transition-all">
              <Facebook className="h-4 w-4" />
            </a>
            <a href="#" aria-label="Twitter" className="w-10 h-10 rounded-full flex items-center justify-center bg-muted text-muted-foreground hover:bg-[#0547B6] hover:text-white transition-all">
              <Twitter className="h-4 w-4" />
            </a>
            <a href="#" aria-label="Instagram" className="w-10 h-10 rounded-full flex items-center justify-center bg-muted text-muted-foreground hover:bg-[#0547B6] hover:text-white transition-all">
              <Instagram className="h-4 w-4" />
            </a>
            <a href="#" aria-label="LinkedIn" className="w-10 h-10 rounded-full flex items-center justify-center bg-muted text-muted-foreground hover:bg-[#0547B6] hover:text-white transition-all">
              <Linkedin className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>
    </Layout>
  );
}
