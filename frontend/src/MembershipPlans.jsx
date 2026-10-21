import { Check, Crown, GraduationCap, Mail, Sparkles } from 'lucide-react';
import './MembershipPlans.css';

const freeFeatures = ['Campus community and student discussions', 'Browse scholarships through AfriGrant Pipeline', 'Discover training programmes and learning resources', 'Browse student marketplace and accommodation'];
const premiumFeatures = ['Everything in Free', 'Weekly scholarship matches delivered by email (planned)', 'Ultimate Prompt Engineering course access (planned)', 'Personalised study and career opportunity recommendations (planned)', 'Priority opportunity reminders (planned)'];

export default function MembershipPlans() {
  return <section className="cv-memberships" aria-labelledby="membership-title">
    <div className="cv-membership-intro"><span><Sparkles size={15}/> YOUR NEXT LEVEL</span><h3 id="membership-title">Start free. Grow with Premium.</h3><p>CampusVerse community access stays free. Premium will offer deeper learning and tailored opportunities when subscriptions and delivery systems are ready.</p></div>
    <div className="cv-plan-grid">
      <article className="cv-plan"><div className="cv-plan-heading"><GraduationCap size={23}/><strong>Free Membership</strong></div><div className="cv-plan-price">₦0 <small>/ forever</small></div><p>Find your people, discover resources and explore campus opportunities.</p><ul>{freeFeatures.map(f=><li key={f}><Check size={16}/>{f}</li>)}</ul><span className="cv-plan-action">Included for registered students</span></article>
      <article className="cv-plan cv-plan-premium"><div className="cv-plan-top"><span><Crown size={19}/> Premium Membership</span><span className="cv-coming-soon">Coming soon</span></div><div className="cv-plan-price">Pricing to be announced</div><p>Go beyond browsing with scholarship matching and dedicated prompt-engineering training.</p><ul>{premiumFeatures.map(f=><li key={f}><Check size={16}/>{f}</li>)}</ul><div className="cv-premium-notice"><Mail size={17}/><span>Weekly emails require your opt-in and an active subscription. No automatic enrolment, emails or payments are enabled yet.</span></div><button type="button" disabled className="cv-plan-action cv-premium-disabled">Premium enrolment not open</button></article>
    </div><p className="cv-membership-footer">Scholarships are awarded by independent organisations. Premium membership will not guarantee any award. Scholarship alerts will require reliable opportunity data, expiry checks, unsubscribe controls and verified email delivery.</p>
  </section>;
}
