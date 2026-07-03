import { motion } from "framer-motion";
import { Layout } from "@/components/layout/Layout";
import { Badge } from "@/components/ui/badge";
import { Phone, Mail, MapPin, MessageCircle, Facebook, Twitter, Instagram, Linkedin } from "lucide-react";

export default function ContactPage() {
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
      value: "support@streetly.ng",
      href: "mailto:support@streetly.ng",
    },
    {
      icon: MessageCircle,
      title: "WhatsApp",
      value: "+44 7577 077622",
      href: "https://wa.me/447577077622",
    },
  ];

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
