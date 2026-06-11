import { useState, memo } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Copy, Check, Github, Zap, Shield, Workflow, Code2, Terminal, ChevronRight } from 'lucide-react';
import { CliDemo } from '@/components/CliDemo';
import { Header } from '@/components/Header';

/**
 * PERFORMANCE OPTIMIZATION:
 * 1. Hoisted static animation variants and data lists to the module level to prevent
 *    re-creation on every render cycle.
 * 2. Memoized CliDemo to prevent unnecessary re-renders when Home's local state
 *    (e.g., copiedIndex) changes.
 * 3. Isolated Header state (mobile menu, theme toggle) into a dedicated component
 *    to prevent full-page re-renders during common UI interactions.
 */

const CONTAINER_VARIANTS = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const ITEM_VARIANTS = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
};

const FEATURES = [
  {icon: <Terminal className="h-8 w-8" />, title: 'Fast CLI', description: 'Lightning-quick command-line interface for power users and automation workflows.'},
  {icon: <Shield className="h-8 w-8" />, title: 'Threat Detection', description: 'Real-time vulnerability scanning and security analysis across your infrastructure.'},
  {icon: <Workflow className="h-8 w-8" />, title: 'Workflow Automation', description: 'Orchestrate complex tasks and manage MCP servers with intuitive automation.'},
  {icon: <Code2 className="h-8 w-8" />, title: 'Developer Friendly', description: 'Comprehensive API and SDK for seamless integration into your projects.'},
  {icon: <Zap className="h-8 w-8" />, title: 'High Performance', description: 'Optimized for speed with minimal resource consumption and instant feedback.'},
  {icon: <ChevronRight className="h-8 w-8" />, title: 'Extensible', description: 'Build custom plugins and extensions to tailor ECHOMEN to your needs.'},
];

const MemoizedCliDemo = memo(CliDemo);

export default function Home() {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <Header />

      <section className="relative overflow-hidden py-20 md:py-32" role="region" aria-label="Hero">
        <div className="absolute inset-0 -z-10 opacity-30" style={{backgroundImage: 'url(https://d2xsxph8kpxj0f.cloudfront.net/310519663568704090/Fz7rAXkQCqMwwVoPUWcS4j/echomen_hero_premium-FbzwPmrNYC8U8XbZVfsMzS.webp)', backgroundSize: 'cover', backgroundPosition: 'center'}} />
        <div className="container mx-auto px-4">
          <motion.div variants={CONTAINER_VARIANTS} initial="hidden" animate="visible" className="max-w-3xl">
            <motion.h1 variants={ITEM_VARIANTS} className="text-4xl md:text-6xl font-bold leading-tight text-foreground mb-6">
              The Autonomous Agent Ecosystem Built for <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Action</span>
            </motion.h1>
            <motion.p variants={ITEM_VARIANTS} className="text-lg text-muted-foreground mb-8 max-w-2xl">
              Seamlessly switch between a high-speed CLI and a powerful Web UI. Execute tasks, manage MCP servers, and automate your workflow with ECHOMEN.
            </motion.p>
            <motion.div variants={ITEM_VARIANTS} className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-white font-semibold" aria-label="Get Started" onClick={() => document.getElementById('installation')?.scrollIntoView({ behavior: 'smooth' })}>
                <Terminal className="mr-2 h-5 w-5" /> Get Started
              </Button>
              <Button size="lg" variant="outline" className="border-border hover:bg-muted" aria-label="View on GitHub">
                <Github className="mr-2 h-5 w-5" /> View on GitHub
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section id="demo" className="py-20 md:py-32 bg-muted/30" role="region" aria-label="Interactive CLI Demo">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <MemoizedCliDemo />
          </motion.div>
        </div>
      </section>

      <section id="features" className="py-20 md:py-32" role="region" aria-label="Features">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">Powerful Features</h2>
            <p className="text-muted-foreground text-lg max-w-2xl">Everything you need to manage autonomous agents and secure your infrastructure.</p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-8">
            {FEATURES.map((feature, idx) => (
              <motion.div key={idx} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.1, duration: 0.5 }} whileHover={{ y: -5 }} className="p-6 rounded-xl border border-border bg-card hover:shadow-lg transition-all duration-300">
                <div className="text-primary mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold mb-2 text-foreground">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="installation" className="py-20 md:py-32 bg-muted/30" role="region" aria-label="Installation">
        <div className="container max-w-3xl mx-auto px-4">
          ...installation section content...
        </div>
      </section>

      <section id="faq" className="py-20 md:py-32" role="region" aria-label="Frequently Asked Questions">
        <div className="container max-w-3xl mx-auto px-4">
          ...faq section content...
        </div>
      </section>

      <section id="community" className="py-20 md:py-32 bg-muted/30" role="region" aria-label="Community">
        <div className="container mx-auto px-4">
          ...community section content...
        </div>
      </section>

      <footer className="border-t border-border bg-muted/50 py-12">
        <div className="container mx-auto px-4">
          ...footer content...
          <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-muted-foreground">
            <p>&copy; {currentYear} ECHOMEN. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
