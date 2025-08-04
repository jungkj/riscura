'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
// import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard'
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyInput } from '@/components/ui/DaisyInput';
import { DaisyTextarea } from '@/components/ui/DaisyTextarea';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import { DaisyCardTitle } from '@/components/ui/daisy-components';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1000))

    alert("Thank you for your inquiry! We'll get back to you within 24 hours.");
    setFormData({ name: '', email: '', company: '', message: '' });
    setIsSubmitting(false);
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Header */}
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <DaisyBadge className="bg-[#199BEC]/10 text-[#199BEC] px-4 py-2 mb-6 text-sm">
              Enterprise Sales
            </DaisyBadge>
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
              Let's discuss your needs
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Ready to secure your enterprise with Riscura? Our team is here to help you get
              started.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Form & Info */}
      <section className="pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <DaisyCard className="shadow-xl">
                <DaisyCardBody>
                  <DaisyCardTitle className="text-2xl font-bold text-gray-900">
                    Get in touch
                  </DaisyCardTitle>
                  <p className="text-gray-600 mb-6">
                    Fill out the form below and we'll get back to you within 24 hours.
                  </p>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="name"
                          className="block text-sm font-medium text-gray-700 mb-2"
                        >
                          Full Name *
                        </label>
                        <DaisyInput
                          id="name"
                          name="name"
                          type="text"
                          required
                          value={formData.name}
                          onChange={handleChange}
                          placeholder="John Doe"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="email"
                          className="block text-sm font-medium text-gray-700 mb-2"
                        >
                          Email Address *
                        </label>
                        <DaisyInput
                          id="email"
                          name="email"
                          type="email"
                          required
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="john@company.com"
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="company"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Company Name *
                      </label>
                      <DaisyInput
                        id="company"
                        name="company"
                        type="text"
                        required
                        value={formData.company}
                        onChange={handleChange}
                        placeholder="Acme Corporation"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="message"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Message *
                      </label>
                      <DaisyTextarea
                        id="message"
                        name="message"
                        required
                        rows={4}
                        value={formData.message}
                        onChange={handleChange}
                        placeholder="Tell us about your risk management needs..."
                      />
                    </div>

                    <DaisyButton
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-[#199BEC] hover:bg-[#0f7dc7] text-white py-3 flex items-center justify-center"
                    >
                      {isSubmitting ? 'Sending...' : 'Send Message'}
                      <Send className="w-4 h-4 ml-2" />
                    </DaisyButton>
                  </form>
                </DaisyCardBody>
              </DaisyCard>
            </motion.div>

            {/* Contact Information */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="space-y-8"
            >
              <DaisyCard className="shadow-lg">
                <DaisyCardBody className="p-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-6">Contact Information</h3>

                  <div className="space-y-6">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-[#199BEC]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Mail className="w-6 h-6 text-[#199BEC]" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Email</h4>
                        <p className="text-gray-600">sales@riscura.com</p>
                        <p className="text-sm text-gray-500">We'll respond within 24 hours</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-[#199BEC]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Phone className="w-6 h-6 text-[#199BEC]" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Phone</h4>
                        <p className="text-gray-600">+1 (555) 123-4567</p>
                        <p className="text-sm text-gray-500">Mon-Fri 9AM-6PM EST</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-[#199BEC]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-6 h-6 text-[#199BEC]" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Office</h4>
                        <p className="text-gray-600">
                          123 Enterprise Blvd
                          <br />
                          San Francisco, CA 94105
                        </p>
                      </div>
                    </div>
                  </div>
                </DaisyCardBody>
              </DaisyCard>

              <DaisyCard className="shadow-lg bg-gradient-to-br from-[#199BEC]/5 to-white">
                <DaisyCardBody className="p-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Enterprise Features</h3>
                  <ul className="space-y-3 text-gray-700">
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-[#199BEC] rounded-full mr-3" />
                      Custom integrations & APIs
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-[#199BEC] rounded-full mr-3" />
                      Dedicated customer success manager
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-[#199BEC] rounded-full mr-3" />
                      SSO & advanced security
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-[#199BEC] rounded-full mr-3" />
                      SLA guarantees & priority support
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-[#199BEC] rounded-full mr-3" />
                      White-label options available
                    </li>
                  </ul>
                </DaisyCardBody>
              </DaisyCard>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
