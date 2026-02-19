'use client';

import { useState, useRef, useCallback } from 'react';
import styles from "./page.module.css";

function BeforeAfterDemo() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [sliderPos, setSliderPos] = useState(50);
  const [isDragging, setIsDragging] = useState(false);

  const updateSlider = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(pct);
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    updateSlider(e.clientX);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    updateSlider(e.clientX);
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  return (
    <div className={styles.demoSection}>
      <div
        ref={containerRef}
        className={styles.demoContainer}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{ cursor: isDragging ? 'col-resize' : 'ew-resize' }}
      >
        {/* After image (full width, behind) */}
        <img
          src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80"
          alt="Enhanced listing — vibrant, warm lighting"
          className={styles.demoAfter}
          draggable={false}
        />
        {/* Before image (clipped) */}
        <img
          src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80"
          alt="Original listing — flat lighting, dull colors"
          className={styles.demoBefore}
          style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
          draggable={false}
        />
        {/* Slider handle */}
        <div
          className={styles.demoSlider}
          style={{ left: `${sliderPos}%` }}
        />
        <div className={styles.demoLabels}>
          <span className={styles.demoLabel}>Before</span>
          <span className={styles.demoLabel}>After</span>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <>
      {/* Navigation */}
      <nav className={styles.nav}>
        <div className={styles.navBrand}>
          <img src="/stager-logo.png" alt="Stager" className={styles.navLogoImg} />
        </div>
        <ul className={styles.navLinks}>
          <li><a href="#how-it-works">How It Works</a></li>
          <li><a href="#features">Features</a></li>
          <li><a href="#models">Models</a></li>
          <li><a href="#pricing">Pricing</a></li>
        </ul>
        <div className={styles.navActions}>
          <a href="/login" className="btn btn-ghost">Log in</a>
          <a href="/signup" className="btn btn-primary">Get Started Free</a>
        </div>
      </nav>

      {/* Hero */}
      <section className={`${styles.hero} container`}>
        <div className={styles.heroBadge}>
          <span className="badge">
            <span className={styles.dot}></span>
            Now in Beta
          </span>
        </div>
        <h1>
          Listing photos that <em>sell</em>
        </h1>
        <p className={styles.heroSubtitle}>
          Upload your real estate photos and get back stunning, enhanced images in seconds.
          Choose from the world&apos;s best AI models. Built for agents who close.
        </p>
        <div className={styles.heroActions}>
          <a href="/signup" className="btn btn-accent btn-lg">
            Start Enhancing — It&apos;s Free
          </a>
          <a href="#how-it-works" className="btn btn-outline btn-lg">
            See How It Works
          </a>
        </div>
        <p className={styles.heroNote}>5 free credits · No credit card required</p>

        <BeforeAfterDemo />
      </section>

      {/* How It Works */}
      <section id="how-it-works" className={`${styles.howItWorks} section`}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <span className="label">How It Works</span>
            <h2>Three steps to stunning listings</h2>
            <p>No design skills needed. Upload, pick your style, and download MLS-ready photos.</p>
          </div>
          <div className={styles.stepsGrid}>
            <div className={styles.stepCard}>
              <div className={styles.stepNumber}>1</div>
              <h3>Upload</h3>
              <p>Drag and drop your listing photos — singles or entire shoots of 30+ images.</p>
            </div>
            <div className={styles.stepCard}>
              <div className={styles.stepNumber}>2</div>
              <h3>Enhance</h3>
              <p>Choose your AI model, pick an enhancement style, and review 4 variations — just like Midjourney.</p>
            </div>
            <div className={styles.stepCard}>
              <div className={styles.stepNumber}>3</div>
              <h3>Download</h3>
              <p>Download your enhanced photos in MLS-ready resolution. Consistent style across every shot.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="section">
        <div className="container">
          <div className={styles.sectionHeader}>
            <span className="label">Enhancement Suite</span>
            <h2>Every tool a listing needs</h2>
            <p>Purpose-built enhancements for real estate — no generic filters here.</p>
          </div>
          <div className={styles.featuresGrid}>
            <div className={`card ${styles.featureCard}`}>
              <div className={styles.featureIcon}>🌅</div>
              <h4>Sky Replacement</h4>
              <p>Swap overcast skies for golden hour, blue sky, or dramatic clouds. Auto-relighting included.</p>
            </div>
            <div className={`card ${styles.featureCard}`}>
              <div className={styles.featureIcon}>🌆</div>
              <h4>Twilight Conversion</h4>
              <p>Transform daytime exteriors into warm, inviting dusk scenes with lit windows and ambient glow.</p>
            </div>
            <div className={`card ${styles.featureCard}`}>
              <div className={styles.featureIcon}>✨</div>
              <h4>HDR Enhancement</h4>
              <p>Balance interior and exterior exposure in a single shot. See through windows without blown-out highlights.</p>
            </div>
            <div className={`card ${styles.featureCard}`}>
              <div className={styles.featureIcon}>🛋️</div>
              <h4>Virtual Staging</h4>
              <p>Furnish empty rooms with stylish, realistic furniture. Multiple design styles to match any property.</p>
            </div>
            <div className={`card ${styles.featureCard}`}>
              <div className={styles.featureIcon}>🧹</div>
              <h4>Declutter & Remove</h4>
              <p>Remove personal items, power lines, cars, or any distractions. Clean, professional results every time.</p>
            </div>
            <div className={`card ${styles.featureCard}`}>
              <div className={styles.featureIcon}>🎨</div>
              <h4>Style Profiles</h4>
              <p>Create and save your signature look. Apply consistent color grading across every listing in your portfolio.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Model Picker Preview */}
      <section id="models" className={`${styles.modelsSection} section`}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <span className="label">Choose Your Engine</span>
            <h2>The best AI models, one platform</h2>
            <p>Pick the perfect model for every job — or let us recommend the best one automatically.</p>
          </div>
          <div className={styles.modelsGrid}>
            <div className={styles.modelCard}>
              <div className={styles.modelProvider}>Google</div>
              <div className={styles.modelName}>Gemini Flash Image</div>
              <p className={styles.modelDesc}>Lightning fast with excellent local edits. Great for quick batch processing.</p>
              <span className={styles.modelBadge}>Fastest</span>
            </div>
            <div className={styles.modelCard}>
              <div className={styles.modelProvider}>OpenAI</div>
              <div className={styles.modelName}>GPT-5 Image</div>
              <p className={styles.modelDesc}>Superior instruction following. Handles complex enhancement requests with precision.</p>
              <span className={styles.modelBadge}>Most Versatile</span>
            </div>
            <div className={styles.modelCard}>
              <div className={styles.modelProvider}>OpenAI</div>
              <div className={styles.modelName}>GPT-5 Image Mini</div>
              <p className={styles.modelDesc}>Lightweight and affordable. Great for prototyping and quick edits.</p>
              <span className={styles.modelBadge}>Budget Friendly</span>
            </div>
            <div className={styles.modelCard}>
              <div className={styles.modelProvider}>Google</div>
              <div className={styles.modelName}>Gemini 3 Pro Image</div>
              <p className={styles.modelDesc}>Highest quality output with excellent detail preservation and scene understanding.</p>
              <span className={styles.modelBadge}>Best Quality</span>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="section">
        <div className="container">
          <div className={styles.sectionHeader}>
            <span className="label">Pricing</span>
            <h2>Plans that scale with you</h2>
            <p>Start free, upgrade as you grow. Every plan includes all enhancement types.</p>
          </div>
          <div className={styles.pricingGrid}>
            {/* Free */}
            <div className={`card ${styles.pricingCard}`}>
              <div className={styles.pricingPlan}>Free</div>
              <div className={styles.pricingPrice}>
                <span className={styles.pricingAmount}>$0</span>
              </div>
              <div className={styles.pricingCredits}>5 credits to start</div>
              <ul className={styles.pricingFeatures}>
                <li>All enhancement types</li>
                <li>All AI models</li>
                <li>Before/after compare</li>
                <li>Standard resolution export</li>
              </ul>
              <a href="/signup" className="btn btn-outline">Get Started</a>
            </div>

            {/* Starter */}
            <div className={`card ${styles.pricingCard}`}>
              <div className={styles.pricingPlan}>Starter</div>
              <div className={styles.pricingPrice}>
                <span className={styles.pricingAmount}>$19</span>
                <span className={styles.pricingPeriod}>/mo</span>
              </div>
              <div className={styles.pricingCredits}>50 credits/month</div>
              <ul className={styles.pricingFeatures}>
                <li>Everything in Free</li>
                <li>No watermarks</li>
                <li>All presets & styles</li>
                <li>High-res export</li>
                <li>Credit rollover (1 month)</li>
              </ul>
              <a href="/signup?plan=starter" className="btn btn-primary">Start Trial</a>
            </div>

            {/* Pro — Featured */}
            <div className={`card ${styles.pricingCard} ${styles.featured}`}>
              <div className={styles.pricingFeaturedBadge}>Most Popular</div>
              <div className={styles.pricingPlan}>Pro</div>
              <div className={styles.pricingPrice}>
                <span className={styles.pricingAmount}>$49</span>
                <span className={styles.pricingPeriod}>/mo</span>
              </div>
              <div className={styles.pricingCredits}>200 credits/month</div>
              <ul className={styles.pricingFeatures}>
                <li>Everything in Starter</li>
                <li>Batch processing</li>
                <li>Brand profiles</li>
                <li>Priority processing</li>
                <li>Listing manager</li>
              </ul>
              <a href="/signup?plan=pro" className="btn btn-accent">Start Trial</a>
            </div>

            {/* Agency */}
            <div className={`card ${styles.pricingCard}`}>
              <div className={styles.pricingPlan}>Agency</div>
              <div className={styles.pricingPrice}>
                <span className={styles.pricingAmount}>$149</span>
                <span className={styles.pricingPeriod}>/mo</span>
              </div>
              <div className={styles.pricingCredits}>750 credits/month</div>
              <ul className={styles.pricingFeatures}>
                <li>Everything in Pro</li>
                <li>5 team seats</li>
                <li>Collaboration tools</li>
                <li>API access</li>
                <li>Dedicated support</li>
              </ul>
              <a href="/signup?plan=agency" className="btn btn-primary">Contact Sales</a>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className={`${styles.ctaSection} section`}>
        <div className="container">
          <h2>Ready to transform your listings?</h2>
          <p>Join thousands of agents already using Stager to create photos that sell faster.</p>
          <a href="/signup" className="btn btn-accent btn-lg">
            Get 5 Free Credits →
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={`container ${styles.footerContent}`}>
          <img src="/stager-logo.png" alt="Stager" className={styles.footerLogoImg} />
          <ul className={styles.footerLinks}>
            <li><a href="#features">Features</a></li>
            <li><a href="#pricing">Pricing</a></li>
            <li><a href="#">Privacy</a></li>
            <li><a href="#">Terms</a></li>
            <li><a href="#">Support</a></li>
          </ul>
          <span className={styles.footerCopy}>© 2026 Stager. All rights reserved.</span>
        </div>
      </footer>
    </>
  );
}
