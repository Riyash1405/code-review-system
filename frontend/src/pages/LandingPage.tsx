import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, Zap, GitBranch, BarChart3, Brain, Lock, 
  ArrowRight, Code2, Search, FileCode, Bell, 
  ChevronRight, Star, Users, Globe, Cpu
} from 'lucide-react';

const FEATURES = [
  {
    icon: Brain,
    title: 'AI-Powered Analysis',
    desc: 'Leverages Gemini, GPT-4, Claude & Groq to perform deep, context-aware code reviews that go beyond simple linting.',
    color: '#a855f7',
  },
  {
    icon: Shield,
    title: 'Security Auditing',
    desc: 'Detects hardcoded secrets, SQL injection, XSS vulnerabilities, insecure crypto, and exposed API keys automatically.',
    color: '#ef4444',
  },
  {
    icon: Zap,
    title: 'Performance Analysis',
    desc: 'Identifies O(n²) bottlenecks, memory leaks, N+1 queries, and suggests optimal Time & Space complexity improvements.',
    color: '#06b6d4',
  },
  {
    icon: BarChart3,
    title: 'Visual Analytics',
    desc: 'Interactive charts showing issue categories, severity distribution, and score trends across commits.',
    color: '#22c55e',
  },
  {
    icon: GitBranch,
    title: 'GitHub Integration',
    desc: 'Connect multiple GitHub accounts, analyze any repository, and get automated PR comments on every push.',
    color: '#f59e0b',
  },
  {
    icon: Bell,
    title: 'Real-time Notifications',
    desc: 'Instant notification bell with unread badges, score grades, and one-click navigation to analysis results.',
    color: '#ec4899',
  },
];

const HOW_IT_WORKS = [
  { step: '01', icon: GitBranch, title: 'Connect GitHub', desc: 'Link your GitHub account in one click via OAuth' },
  { step: '02', icon: Search, title: 'Select Repository', desc: 'Browse your repos and pick any commit to analyze' },
  { step: '03', icon: Cpu, title: 'AI Analyzes Code', desc: 'Our engine scans every file for issues & improvements' },
  { step: '04', icon: FileCode, title: 'Get Detailed Report', desc: 'View scores, severity charts, and actionable fixes' },
];

const TECH_STACK = [
  'React', 'TypeScript', 'Node.js', 'Express', 'PostgreSQL', 
  'Redis', 'BullMQ', 'Prisma', 'Gemini AI', 'GPT-4', 
  'Claude', 'Groq', 'Recharts', 'TanStack Query'
];

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div style={{ background: '#0a0a14', color: '#e2e8f0', minHeight: '100vh', fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}>
      
      {/* ───── Navbar ───── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        backdropFilter: 'blur(20px)',
        background: 'rgba(10,10,20,0.8)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #14b8a6, #0d9488)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Code2 size={20} color="#fff" />
            </div>
            <span style={{ fontWeight: 700, fontSize: 18, color: '#fff', letterSpacing: '-0.3px' }}>ICR System</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <a href="#features" style={{ fontSize: 14, color: '#94a3b8', textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
              onMouseLeave={e => (e.currentTarget.style.color = '#94a3b8')}
            >Features</a>
            <a href="#how-it-works" style={{ fontSize: 14, color: '#94a3b8', textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
              onMouseLeave={e => (e.currentTarget.style.color = '#94a3b8')}
            >How It Works</a>
            <a href="#team" style={{ fontSize: 14, color: '#94a3b8', textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
              onMouseLeave={e => (e.currentTarget.style.color = '#94a3b8')}
            >Team</a>
            <button
              onClick={() => navigate('/login')}
              style={{
                padding: '8px 20px', borderRadius: 8, border: 'none', cursor: 'pointer',
                background: 'linear-gradient(135deg, #14b8a6, #0d9488)',
                color: '#fff', fontWeight: 600, fontSize: 14,
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 8px 25px rgba(20,184,166,0.3)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* ───── Hero ───── */}
      <section style={{ position: 'relative', overflow: 'hidden', paddingTop: 100, paddingBottom: 100 }}>
        {/* Background glow */}
        <div style={{ position: 'absolute', top: -200, left: '50%', transform: 'translateX(-50%)', width: 800, height: 800, borderRadius: '50%', background: 'radial-gradient(circle, rgba(20,184,166,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: 100, right: -100, width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(168,85,247,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', textAlign: 'center', position: 'relative' }}>
          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '6px 16px', borderRadius: 50,
            background: 'rgba(20,184,166,0.1)', border: '1px solid rgba(20,184,166,0.2)',
            fontSize: 13, color: '#5eead4', fontWeight: 500, marginBottom: 32,
          }}>
            <Star size={14} /> AI-Powered Code Intelligence
          </div>

          <h1 style={{
            fontSize: 'clamp(40px, 6vw, 72px)', fontWeight: 800,
            lineHeight: 1.1, letterSpacing: '-2px', color: '#fff',
            marginBottom: 24, maxWidth: 800, marginLeft: 'auto', marginRight: 'auto',
          }}>
            Ship Better Code,{' '}
            <span style={{ background: 'linear-gradient(135deg, #14b8a6, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Faster
            </span>
          </h1>

          <p style={{
            fontSize: 'clamp(16px, 2vw, 20px)', color: '#94a3b8',
            lineHeight: 1.7, maxWidth: 640, margin: '0 auto 40px',
          }}>
            The Intelligent Code Review System uses multiple AI models to analyze your codebase for security vulnerabilities, 
            performance bottlenecks, and code quality issues — with actionable fixes for every problem found.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate('/login')}
              style={{
                padding: '14px 32px', borderRadius: 12, border: 'none', cursor: 'pointer',
                background: 'linear-gradient(135deg, #14b8a6, #0d9488)',
                color: '#fff', fontWeight: 600, fontSize: 16,
                display: 'flex', alignItems: 'center', gap: 8,
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 35px rgba(20,184,166,0.35)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              Start Analyzing <ArrowRight size={18} />
            </button>
            <button
              onClick={() => navigate('/register')}
              style={{
                padding: '14px 32px', borderRadius: 12, cursor: 'pointer',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#e2e8f0', fontWeight: 600, fontSize: 16,
                display: 'flex', alignItems: 'center', gap: 8,
                transition: 'transform 0.2s, border-color 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
            >
              Create Free Account
            </button>
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 48, marginTop: 72, flexWrap: 'wrap' }}>
            {[
              { value: '6+', label: 'Languages Supported' },
              { value: '4', label: 'AI Models Available' },
              { value: '5', label: 'Analysis Categories' },
              { value: '100%', label: 'Free & Open Source' },
            ].map((s, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 32, fontWeight: 800, color: '#14b8a6' }}>{s.value}</div>
                <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── Features ───── */}
      <section id="features" style={{ padding: '80px 24px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#14b8a6', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>Features</p>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 700, color: '#fff', letterSpacing: '-1px' }}>
            Everything You Need for Code Excellence
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20 }}>
          {FEATURES.map((f, i) => (
            <div
              key={i}
              style={{
                padding: 28, borderRadius: 16,
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
                transition: 'border-color 0.3s, transform 0.2s',
                cursor: 'default',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = f.color + '40'; e.currentTarget.style.transform = 'translateY(-4px)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <div style={{
                width: 48, height: 48, borderRadius: 12,
                background: f.color + '12',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 20,
              }}>
                <f.icon size={24} style={{ color: f.color }} />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 600, color: '#fff', marginBottom: 10 }}>{f.title}</h3>
              <p style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ───── How It Works ───── */}
      <section id="how-it-works" style={{ padding: '80px 24px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#14b8a6', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>How It Works</p>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 700, color: '#fff', letterSpacing: '-1px' }}>
            From Commit to Insight in 4 Steps
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24 }}>
          {HOW_IT_WORKS.map((item, i) => (
            <div key={i} style={{ textAlign: 'center', padding: '32px 20px', position: 'relative' }}>
              <div style={{
                fontSize: 48, fontWeight: 800, color: 'rgba(20,184,166,0.08)',
                position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)',
                letterSpacing: -2,
              }}>{item.step}</div>
              <div style={{
                width: 56, height: 56, borderRadius: 16,
                background: 'linear-gradient(135deg, rgba(20,184,166,0.15), rgba(20,184,166,0.05))',
                border: '1px solid rgba(20,184,166,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 20px', position: 'relative',
              }}>
                <item.icon size={24} style={{ color: '#5eead4' }} />
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: '#fff', marginBottom: 8 }}>{item.title}</h3>
              <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.6 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ───── AI Models Section ───── */}
      <section style={{
        padding: '80px 24px', maxWidth: 1200, margin: '0 auto',
      }}>
        <div style={{
          borderRadius: 24, padding: '56px 40px',
          background: 'linear-gradient(145deg, rgba(20,184,166,0.06) 0%, rgba(168,85,247,0.04) 100%)',
          border: '1px solid rgba(255,255,255,0.06)',
          textAlign: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 24 }}>
            <Brain size={28} style={{ color: '#a855f7' }} />
            <h2 style={{ fontSize: 28, fontWeight: 700, color: '#fff' }}>Multi-Model AI Engine</h2>
          </div>
          <p style={{ fontSize: 16, color: '#94a3b8', maxWidth: 600, margin: '0 auto 32px', lineHeight: 1.7 }}>
            Choose from multiple state-of-the-art AI providers. Each model brings unique strengths —
            use Gemini for speed, GPT-4 for depth, Claude for safety analysis, or Groq for lightning-fast inference.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
            {['Gemini 2.5 Flash', 'GPT-4o Mini', 'Claude 3.5 Sonnet', 'Llama 3.3 70B (Groq)'].map((model, i) => (
              <div key={i} style={{
                padding: '10px 20px', borderRadius: 10,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                fontSize: 13, fontWeight: 500, color: '#cbd5e1',
              }}>
                {model}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── Tech Stack ───── */}
      <section style={{ padding: '40px 24px 80px', maxWidth: 1200, margin: '0 auto', textAlign: 'center' }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 24 }}>Built With</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
          {TECH_STACK.map((tech, i) => (
            <span key={i} style={{
              padding: '6px 14px', borderRadius: 8,
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              fontSize: 12, color: '#94a3b8', fontWeight: 500,
            }}>
              {tech}
            </span>
          ))}
        </div>
      </section>

      {/* ───── Team / Creator ───── */}
      <section id="team" style={{ padding: '80px 24px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#14b8a6', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>The Creator</p>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 700, color: '#fff', letterSpacing: '-1px' }}>
            Built with Passion
          </h2>
        </div>

        <div style={{
          maxWidth: 480, margin: '0 auto',
          borderRadius: 20, padding: 40, textAlign: 'center',
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}>
          {/* Avatar circle with initials */}
          <div style={{
            width: 88, height: 88, borderRadius: '50%', margin: '0 auto 20px',
            background: 'linear-gradient(135deg, #14b8a6, #0d9488)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 32, fontWeight: 700, color: '#fff',
            boxShadow: '0 0 40px rgba(20,184,166,0.2)',
          }}>
            RP
          </div>
          <h3 style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 4 }}>Riyash Patel</h3>
          <p style={{ fontSize: 14, color: '#14b8a6', fontWeight: 500, marginBottom: 16 }}>Full-Stack Developer</p>
          <p style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.7, marginBottom: 20 }}>
            Designed and built the entire Intelligent Code Review System from scratch — 
            backend architecture, AI integration pipeline, real-time analysis engine, and the modern React dashboard.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
            <a
              href="https://github.com/Riyash1405"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: '8px 16px', borderRadius: 8,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#cbd5e1', fontSize: 13, fontWeight: 500,
                textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6,
                transition: 'border-color 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
            >
              <Globe size={14} /> GitHub
            </a>
          </div>
        </div>
      </section>

      {/* ───── CTA ───── */}
      <section style={{ padding: '80px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 700, color: '#fff', marginBottom: 16, letterSpacing: '-1px' }}>
            Ready to Improve Your Code?
          </h2>
          <p style={{ fontSize: 16, color: '#94a3b8', marginBottom: 32, lineHeight: 1.7 }}>
            Connect your GitHub, pick a repo, and get your first AI-powered review in under a minute.
          </p>
          <button
            onClick={() => navigate('/login')}
            style={{
              padding: '16px 40px', borderRadius: 14, border: 'none', cursor: 'pointer',
              background: 'linear-gradient(135deg, #14b8a6, #0d9488)',
              color: '#fff', fontWeight: 700, fontSize: 17,
              display: 'inline-flex', alignItems: 'center', gap: 10,
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 15px 40px rgba(20,184,166,0.3)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            Get Started Now <ChevronRight size={20} />
          </button>
        </div>
      </section>

      {/* ───── Footer ───── */}
      <footer style={{
        borderTop: '1px solid rgba(255,255,255,0.06)',
        padding: '32px 24px',
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg, #14b8a6, #0d9488)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Code2 size={14} color="#fff" />
            </div>
            <span style={{ fontWeight: 600, fontSize: 14, color: '#94a3b8' }}>ICR System</span>
          </div>
          <p style={{ fontSize: 12, color: '#475569' }}>
            © {new Date().getFullYear()} ICR System · Built by Riyash Patel
          </p>
          <button
            onClick={() => navigate('/login')}
            style={{
              padding: '6px 16px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)',
              background: 'transparent', color: '#94a3b8', fontSize: 13, fontWeight: 500,
              cursor: 'pointer', transition: 'color 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
            onMouseLeave={e => (e.currentTarget.style.color = '#94a3b8')}
          >
            Login →
          </button>
        </div>
      </footer>
    </div>
  );
};
