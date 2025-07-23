'use client';

import React, { useState } from 'react';

export default function NewsletterCTA() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');

    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setStatus('success');
        setMessage('Thanks for subscribing! Check your email to confirm.');
        setEmail('');
      } else {
        setStatus('error');
        setMessage('Something went wrong. Please try again.');
      }
    } catch (error) {
      setStatus('error');
      setMessage('Something went wrong. Please try again.');
    }
  };

  return (
    <section className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-8 md:p-12 text-white">
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="text-3xl font-bold mb-4">
          Stay Ahead of Risk Management Trends
        </h2>
        <p className="text-lg mb-8 text-blue-100">
          Get weekly insights on transforming your Excel-based risk management into intelligent automation. 
          Join 5,000+ risk professionals.
        </p>
        
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
            className="flex-1 px-4 py-3 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-white"
            disabled={status === 'loading' || status === 'success'}
          />
          <button
            type="submit"
            disabled={status === 'loading' || status === 'success'}
            className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {status === 'loading' ? 'Subscribing...' : 'Subscribe'}
          </button>
        </form>

        {message && (
          <p className={`mt-4 text-sm ${status === 'error' ? 'text-red-200' : 'text-green-200'}`}>
            {message}
          </p>
        )}

        <p className="mt-6 text-sm text-blue-200">
          No spam. Unsubscribe anytime. We respect your privacy.
        </p>
      </div>
    </section>
  );
}