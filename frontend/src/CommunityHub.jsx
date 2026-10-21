import { useState } from 'react';
import { BookOpen, Users, Sparkles, ArrowUpRight, CalendarDays, ShieldCheck, HeartHandshake, Search } from 'lucide-react';
import './CommunityHub.css';

const circles = [
  { id: 'study', icon: '📚', title: 'Study Buddies', label: 'Academics', detail: 'Find revision partners, swap study tips, and ask questions.', prompt: 'Who wants to form a study group this week?', tag: 'Department Forums' },
  { id: 'hostel', icon: '🏠', title: 'Hostel & Roommates', label: 'Campus life', detail: 'Discuss hostel tips, roommate searches, and everyday living.', prompt: 'Any hostel advice for a new student?', tag: 'Hostel Hub (Franco)' },
  { id: 'creators', icon: '🎨', title: 'Student Creators', label: 'Creativity', detail: 'Meet designers, photographers, writers, and filmmakers.', prompt: 'Creators on campus, what are you working on?', tag: 'General Discussion' },
  { id: 'tech', icon: '💻', title: 'Tech & Careers', label: 'Opportunity', detail: 'Share portfolios, internships, and career-building ideas.', prompt: 'Anyone building a portfolio or applying for internships?', tag: 'General Discussion' },
  { id: 'business', icon: '🛍️', title: 'Campus Entrepreneurs', label: 'Business', detail: 'Learn from student founders and exchange practical ideas.', prompt: 'Student entrepreneurs: what helped you find customers?', tag: 'General Discussion' },
  { id: 'wellbeing', icon: '🌱', title: 'Wellbeing & Support', label: 'Belonging', detail: 'Encourage peers and share helpful, respectful resources.', prompt: 'What is one habit helping you manage campus stress?', tag: 'General Discussion' }
];
export default function CommunityHub({ user, onStartConversation, onMarketplace }) {
  const storageKey = `campusverse_topics_${user?.id || 'visitor'}`;
  const [followed, setFollowed] = useState(() => {
    try { const ids = JSON.parse(localStorage.getItem(storageKey) || '[]'); return Array.isArray(ids) ? ids : []; }
    catch { return []; }
  });
  const [query, setQuery] = useState('');
  const toggle = (id) => {
    const next = followed.includes(id) ? followed.filter(x => x !== id) : [...followed, id];
    setFollowed(next);
    localStorage.setItem(storageKey, JSON.stringify(next));
  };
  const shown = circles.filter(c => `${c.title} ${c.detail} ${c.label}`.toLowerCase().includes(query.toLowerCase()));
  return <section className="community-hub" aria-label="Student community discovery">
    <div className="community-hero">
      <div className="community-hero-content">
        <span className="community-eyebrow"><Sparkles size={15}/> YOUR CAMPUS. YOUR PEOPLE.</span>
        <h2>Don't just attend campus. <em>Belong here.</em></h2>
        <p>Discover classmates, share ideas and find your corner of campus life. Start with a conversation that matters.</p>
        <div className="community-hero-actions">
          <button className="community-primary" onClick={() => onStartConversation('General Discussion', '')}>Start a conversation <ArrowUpRight size={17}/></button>
          <button className="community-outline" onClick={onMarketplace}>Explore marketplace</button>
        </div>
      </div>
      <div className="community-hero-art" aria-hidden="true">
        <span className="community-art-orbit community-orbit-one">📚</span><span className="community-art-orbit community-orbit-two">✨</span>
        <span className="community-art-center"><Users size={54}/></span>
        <span className="community-art-orbit community-orbit-three">🎓</span><span className="community-art-orbit community-orbit-four">💬</span>
      </div>
    </div>
    <div className="community-highlights" aria-label="Ways to connect">
      <div><BookOpen size={21}/><span><strong>Learn together</strong><small>Study partners & ideas</small></span></div>
      <div><HeartHandshake size={21}/><span><strong>Find your people</strong><small>Interest-based circles</small></span></div>
      <div><CalendarDays size={21}/><span><strong>Make campus count</strong><small>Real-world connections</small></span></div>
      <div><ShieldCheck size={21}/><span><strong>Connect thoughtfully</strong><small>Respect & report concerns</small></span></div>
    </div>
    <div className="community-section-title">
      <div><span className="community-kicker">EXPLORE YOUR INTERESTS</span><h3>Find your circle <span>✦</span></h3><p>Follow topics you care about, then spark discussions in the student feed.</p></div>
      <label className="community-search"><Search size={18}/><input aria-label="Search communities" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search interests..."/></label>
    </div>
    <div className="community-grid">
      {shown.map(circle=><article className="community-card" key={circle.id}>
        <div className="community-card-top"><span className="community-emoji" aria-hidden="true">{circle.icon}</span><span className="community-category">{circle.label}</span></div>
        <h4>{circle.title}</h4><p>{circle.detail}</p>
        <div className="community-card-actions">
          <button onClick={()=>toggle(circle.id)} className={followed.includes(circle.id)?'community-follow active':'community-follow'} aria-pressed={followed.includes(circle.id)}>{followed.includes(circle.id)?'✓ Following topic':'+ Follow topic'}</button>
          <button className="community-discuss" onClick={()=>onStartConversation(circle.tag,circle.prompt)} aria-label={`Discuss ${circle.title}`}>Discuss <ArrowUpRight size={15}/></button>
        </div>
      </article>)}
      {shown.length===0&&<p className="community-empty">No topics match yet. Try another search.</p>}
    </div>
    <p className="community-disclaimer">Topic follows are saved on this device only. These are discovery prompts, not live groups or scheduled events. Conversations use the existing student feed, which is currently local to your session.</p>
  </section>;
}
