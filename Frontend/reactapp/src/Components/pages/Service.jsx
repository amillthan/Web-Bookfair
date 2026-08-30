import React from "react";
import { motion } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const Services = () => {
  const services = [
    {
      desc: "The system provides a comprehensive Stall Reservation System that allows publishers and vendors to reserve stalls online through a dedicated portal. It includes Secure Authentication with a login and registration system to ensure safe access for users. An Interactive Stall Map enables users to view and select available stalls easily. Once a reservation is completed, the system sends a QR Code Confirmation via email for secure exhibition entry. Users also have access to a Home Dashboard where they can add and manage literary genres. Additionally, the platform offers Reports and Reservation History features to help track and manage all booking activities efficiently.",
    },
  ];

  const features = [
    {
      title: "Real-Time Availability",
      desc: "Interactive map shows which stalls are free or already reserved.",
    },
    {
      title: "Stall Categories",
      desc: "Small, Medium, Large stalls categorized for easy selection.",
    },
    {
      title: "Email & QR Pass",
      desc: "Instant email with unique QR code for exhibition entry.",
    },
    {
      title: "Reservation Limit",
      desc: "Each business can reserve up to 3 stalls to ensure fairness.",
    },
    {
      title: "User Dashboard",
      desc: "Track your stalls, reservations, and add literary genres.",
    },
  ];

  const steps = [
    "Register and login to the portal with your business details.",
    "Select your preferred stalls from the interactive map.",
    "Confirm your reservation. Receive QR code & email confirmation.",
    "Access your dashboard to add genres and track reservations.",
  ];

  return (
    <div className="bg-gray-50 min-h-screen text-gray-900">

      {/* Header */}
      <header className="bg-gray-50 text-gray-900 text-center py-6">
        <h1 className="text-3xl font-bold">Our Services</h1>
      </header>

      {/* Navigation */}
      <nav className="bg-blue-900 border-b border-gray-200 flex flex-wrap justify-center gap-6 py-4">
        {["services", "features", "steps", "participants"].map((link) => (
          <a
            key={link}
            href={`#${link}`}
            className="text-white hover:text-gray-900 font-medium transition"
          >
            {link.charAt(0).toUpperCase() + link.slice(1)}
          </a>
        ))}
      </nav>

      <div className="container mx-auto px-4 py-10 space-y-12">

        {/* Services Section */}
        <motion.section
          id="services"
          className="p-8 rounded-xl shadow-lg bg-gradient-to-r from-blue-100 to-blue-200"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
        >
          <h2 className="text-3xl text-center text-blue-900 font-bold mb-6">
            Our Services
          </h2>

          <div className="grid gap-6">
            {services.map((service, index) => (
              <motion.div
                key={index}
                className="p-6 rounded-xl shadow-lg bg-gradient-to-r from-white to-blue-50 hover:shadow-2xl transform transition hover:-translate-y-1"
                whileHover={{ scale: 1.02 }}
              >
                <p className="text-gray-900 leading-relaxed">{service.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Features Section */}
        <motion.section
          id="features"
          className="p-8 rounded-xl shadow-lg bg-gray-50"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
        >
          <h2 className="text-3xl text-center text-blue-900 font-bold mb-6">
            System Features
          </h2>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((f, index) => (
              <motion.div
                key={index}
                className="p-5 rounded-xl shadow-lg bg-gradient-to-r from-blue-50 to-blue-100 hover:shadow-2xl transform transition hover:-translate-y-1"
                whileHover={{ scale: 1.05 }}
              >
                <h3 className="text-blue-900 font-bold mb-2">{f.title}</h3>
                <p className="text-gray-900 text-sm">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Steps Section */}
        <motion.section
          id="steps"
          className="p-8 rounded-xl shadow-lg bg-gradient-to-r from-blue-50 to-blue-100"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
        >
          <h2 className="text-3xl text-center text-blue-900 font-bold mb-6">
            Reservation Steps
          </h2>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <div
                key={index}
                className="p-5 rounded-xl text-center shadow-lg bg-white hover:shadow-2xl transform transition hover:-translate-y-1"
              >
                <h3 className="font-bold text-blue-900 mb-2">
                  Step {index + 1}
                </h3>
                <p className="text-gray-900 text-sm">{step}</p>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Employee Portal Section */}
        <motion.section
          id="participants"
          className="p-8 rounded-xl shadow-lg bg-gray-50"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
        >
          <h2 className="text-3xl text-center text-blue-900 font-bold mb-4">
            Participation Dashboard
          </h2>
          <p className="text-gray-900 text-center">
            Authorized participants can log in to view all reservations, monitor stall availability,
            and generate reports.
          </p>
        </motion.section>

        {/* FAQ Section */}
        {/*<motion.section
          id="FAQ"
          className="p-8 rounded-xl shadow-lg bg-gradient-to-r from-blue-50 to-blue-100"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
        >
          <h2 className="text-3xl text-center text-blue-900 font-bold mb-4">
            Frequently Asked Questions
          </h2>
          <ul className="space-y-3 text-gray-900">
            <li>How many stalls can I reserve per business? → Max 3 stalls</li>
            <li>How will I receive my QR code? → Via email immediately after reservation</li>
          </ul>
        </motion.section> */}

      </div>
    </div>
  );
};

export default Services;