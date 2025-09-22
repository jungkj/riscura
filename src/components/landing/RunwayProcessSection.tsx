"use client";

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  Target,
  TrendingUp,
  Star,
  ArrowRight
} from 'lucide-react';

const RunwayProcessSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const steps = [
    {
      icon: Sparkles,
      title: "Analyze with AI",
      badge: "Beta",
      description: "Accelerate workflows, drill into variance, and deeply understand your business risks with AI-powered insights.",
      cta: "Get a personalized demo",
      ctaLink: "/auth/register",
      image: "/images/analyze-dashboard.png"
    },
    {
      icon: Target,
      title: "Shape risk assessments to your business",
      badge: "",
      description: "Create flexible, structured risk models built to scale. Define custom controls, compliance frameworks, and reuse across departments.",
      cta: "",
      ctaLink: "",
      image: "/images/shape-dashboard.png"
    },
    {
      icon: TrendingUp,
      title: "Plan mitigation strategies with confidence",
      badge: "",
      description: "Build multiple risk scenarios and response plans. Compare strategies side-by-side and understand the impact of your decisions.",
      cta: "",
      ctaLink: "",
      image: "/images/plan-dashboard.png"
    }
  ];

  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return;

      const items = sectionRef.current.querySelectorAll('.process-item');
      const sectionTop = sectionRef.current.offsetTop;
      const scrollPosition = window.scrollY + window.innerHeight / 2;

      items.forEach((item, index) => {
        const itemTop = sectionTop + (item as HTMLElement).offsetTop;
        const itemBottom = itemTop + (item as HTMLElement).offsetHeight;

        if (scrollPosition >= itemTop && scrollPosition <= itemBottom) {
          setActiveIndex(index);
        }
      });
    };

    // Use intersection observer for better performance
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = parseInt(entry.target.getAttribute('data-index') || '0');
            setActiveIndex(index);
          }
        });
      },
      {
        threshold: 0.5,
        rootMargin: '-20% 0px -20% 0px'
      }
    );

    const items = sectionRef.current?.querySelectorAll('.process-item');
    items?.forEach((item) => observer.observe(item));

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check

    return () => {
      window.removeEventListener('scroll', handleScroll);
      observer.disconnect();
    };
  }, []);

  return (
    <section ref={sectionRef} className="py-32 px-4 sm:px-6 lg:px-8 bg-white relative">
      {/* Grain texture overlay */}
      <div className="grain-overlay" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="sticky-scroll-container">
          {/* Sticky left column */}
          <div className="sticky-column">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <h2 className="font-playfair text-4xl sm:text-5xl lg:text-6xl font-light text-gray-900 mb-8 leading-tight">
                Turn complexity into
                <br />
                <span className="font-semibold text-gradient-primary">
                  conviction
                </span>
              </h2>

              <div className="backdrop-premium border border-gray-200 rounded-2xl p-6 shadow-lg">
                <p className="text-lg text-gray-600 italic mb-4 font-playfair">
                  "Incredibly flexible and powerful risk management copilot"
                </p>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-amber-500 fill-current" />
                    ))}
                  </div>
                  <span className="text-sm text-gray-500">G2 Review</span>
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            </motion.div>
          </div>

          {/* Scrolling right column */}
          <div className="space-y-4 mt-12 lg:mt-0">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                data-index={index}
                className={`process-item scroll-item ${
                  activeIndex === index ? 'scroll-item-active' : 'scroll-item-inactive'
                }`}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true, margin: "-100px" }}
              >
                <div className={`card-premium bg-white rounded-3xl overflow-hidden border transition-all duration-700 ${
                  activeIndex === index
                    ? 'border-gray-300 scale-[1.02]'
                    : 'border-gray-200 scale-100'
                }`}>
                  <div className="p-8">
                    <div className="flex items-start gap-4">
                      <motion.div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-500 ${
                          activeIndex === index
                            ? 'bg-gradient-to-br from-blue-100 to-purple-100'
                            : 'bg-gray-100'
                        }`}
                        animate={{
                          rotate: activeIndex === index ? 360 : 0
                        }}
                        transition={{ duration: 0.8 }}
                      >
                        <step.icon className={`w-6 h-6 transition-colors duration-300 ${
                          activeIndex === index ? 'text-blue-600' : 'text-gray-400'
                        }`} />
                      </motion.div>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-900 font-inter">
                          {step.title}
                          {step.badge && (
                            <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-600 rounded-full font-medium">
                              {step.badge}
                            </span>
                          )}
                        </h3>
                        <p className="text-gray-600 mt-2 leading-relaxed">
                          {step.description}
                        </p>
                        {step.cta && (
                          <a
                            href={step.ctaLink}
                            className="inline-flex items-center gap-2 text-blue-600 font-medium mt-4 hover:text-blue-700 transition-colors group"
                          >
                            {step.cta}
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Animated image section */}
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{
                      height: activeIndex === index ? 'auto' : 0,
                      opacity: activeIndex === index ? 1 : 0
                    }}
                    transition={{
                      duration: 0.6,
                      ease: [0.4, 0, 0.2, 1],
                      opacity: { delay: activeIndex === index ? 0.2 : 0 }
                    }}
                    className="overflow-hidden"
                  >
                    <div className="px-8 pb-8">
                      <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl h-72 flex items-center justify-center border border-gray-200/50">
                        {/* Placeholder for screenshot - replace with actual images */}
                        <div className="text-center space-y-4">
                          <motion.div
                            className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl flex items-center justify-center mx-auto"
                            animate={{
                              scale: activeIndex === index ? [1, 1.1, 1] : 1
                            }}
                            transition={{
                              duration: 2,
                              repeat: activeIndex === index ? Infinity : 0
                            }}
                          >
                            <step.icon className="w-8 h-8 text-blue-600" />
                          </motion.div>
                          <div className="space-y-2">
                            <h4 className="font-semibold text-gray-900">Interactive Demo</h4>
                            <p className="text-sm text-gray-600 max-w-sm">
                              Experience {step.title.toLowerCase()} capabilities in action
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Active indicator progress bar */}
                  {activeIndex === index && (
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 5, ease: "linear" }}
                      className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500"
                      onAnimationComplete={() => {
                        // Auto-advance to next item after 5 seconds
                        if (index < steps.length - 1) {
                          setActiveIndex(index + 1);
                        }
                      }}
                    />
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default RunwayProcessSection;