import React, { useState } from "react";
import { motion } from "framer-motion";

const faqData = [
  { question: "How many stalls can I reserve per business?", answer: "Each business can reserve a maximum of 3 stalls to ensure fairness." },
  { question: "How will I receive my QR code?", answer: "The QR code will be emailed immediately after reservation confirmation." },
  { question: "Who can access the employee portal?", answer: "Only authorized exhibition staff can log in to the employee portal." },
];

const ContactPage = () => {
  const [activeFaq, setActiveFaq] = useState(null);
  const toggleFaq = (index) => setActiveFaq(activeFaq === index ? null : index);

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 flex flex-col items-center">
      {/* Header */}
      <header className="bg-white text-blue-900 py-8 w-full shadow-md text-center">
        <h1 className="text-4xl font-bold">Contact Us</h1>
      </header>

      <div className="max-w-6xl w-full px-4 py-12 flex flex-col gap-16">
        {/* Main 2-column layout: Info + Form */}
        <div className="grid md:grid-cols-2 gap-10 items-start">
          {/* Left: Info section */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            <h2 className="text-3xl font-bold text-blue-900">Get in touch</h2>
            <p className="text-gray-700 leading-relaxed max-w-md">
              Use our contact form for information requests or contact us directly using the details below.
            </p>

            {/* Info blocks */}
            <div className="space-y-6 mt-4">
              <div className="flex gap-4">
                <div className="w-11 h-11 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xl">📍</div>
                <div>
                  <p className="font-semibold text-blue-900">Our Office Location</p>
                  <p className="mt-1 text-sm text-gray-600 italic">Colombo International Bookfair</p>
                  <p className="mt-1 text-sm text-gray-600">  
                    <pre>SWRD Bandaranaike National Memorial Foundation, <br />
                          Bauddhaloka Mawatha,<br />
                          Colombo 07.</pre></p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-11 h-11 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xl">📞</div>
                <div>
                  <p className="font-semibold text-blue-900">Phone</p>
                  <p className="mt-1 text-sm text-gray-600">+94 11 123 4567</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-11 h-11 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xl">✉️</div>
                <div>
                  <p className="font-semibold text-blue-900">Email</p>
                  <p className="mt-1 text-sm text-gray-600">info@colombobookfair.lk</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right: Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            <div className="bg-white rounded-2xl p-6 md:p-8 shadow-lg border">
              <h2 className="text-2xl font-bold text-blue-900 text-center">Send a Message</h2>
              <form className="mt-6 space-y-4">
                <div>
                  <label className="text-blue-900 font-semibold mb-1 block">Name</label>
                  <input
                    type="text"
                    placeholder="Enter your Name"
                    className="w-full rounded-lg bg-gray-100 px-4 py-2 text-sm outline-none border focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="text-blue-900 font-semibold mb-1 block">Email</label>
                  <input
                    type="email"
                    placeholder="Enter your Email"
                    className="w-full rounded-lg bg-gray-100 px-4 py-2 text-sm outline-none border focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="text-blue-900 font-semibold mb-1 block">Message</label>
                  <textarea
                    rows={4}
                    placeholder="Enter your Message"
                    className="w-full rounded-lg bg-gray-100 px-4 py-2 text-sm outline-none border focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <button
                  type="submit"
                  className="mt-4 w-full rounded-lg bg-blue-700 text-white px-4 py-2 font-semibold hover:bg-blue-600 transition"
                >
                  Send Message
                </button>
              </form>
            </div>
          </motion.div>
        </div>

        {/* FAQ + Map */}
        <div className="grid md:grid-cols-2 gap-10 items-start">
          {/* FAQ */}
          <div>
            <h3 className="text-2xl font-bold text-blue-900 mb-6">Frequently Asked Questions</h3>
            <div className="space-y-3">
              {faqData.map((faq, index) => (
                <motion.div
                  key={index}
                  onClick={() => toggleFaq(index)}
                  whileHover={{ scale: 1.01 }}
                  className="cursor-pointer rounded-lg border border-gray-300 bg-white p-5 shadow-sm"
                >
                  <div className="flex justify-between items-center">
                    <p className="font-semibold text-blue-900">{faq.question}</p>
                    <span className="text-gray-400">{activeFaq === index ? "−" : "+"}</span>
                  </div>
                  {activeFaq === index && <p className="mt-3 text-gray-700">{faq.answer}</p>}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Map */}
          <div className="h-96 rounded-2xl overflow-hidden shadow-lg border border-gray-300">
            <iframe
              className="w-full h-full"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d63366.6342039674!2d79.8436!3d6.9271!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ae2590fcd4b5b8f%3A0x42d64c15d24b7c4!2sColombo%2C%20Sri%20Lanka!5e0!3m2!1sen!2slk!4v1701831100000!5m2!1sen!2slk"
              allowFullScreen=""
              loading="lazy"
            ></iframe>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;