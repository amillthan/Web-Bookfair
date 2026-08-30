import { motion } from "framer-motion";

const About = () => {
  return (
    <section className="bg-gray-100 text-slate-900 py-20">
      <div className="max-w-6xl mx-auto px-6 space-y-20">

        {/* HEADER */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <h1 className="text-4xl font-bold mb-4">
            About Colombo Book Fair System
          </h1>
          <p className="text-gray-700 max-w-2xl mx-auto">
            A smart and modern stall reservation platform designed for publishers and vendors.
          </p>
        </motion.div>

        {/* ABOUT + MISSION */}
        <div className="grid md:grid-cols-2 gap-10">
          <div className="bg-blue-200 rounded-xl shadow-lg p-8 hover:scale-105 transition">
            <h2 className="text-2xl font-semibold text-blue-900 mb-4">
              About the System
            </h2>
            <p className="text-gray-700 leading-relaxed">
              The Colombo International Book Fair Stall Reservation System allows vendors
              to register, select stalls, confirm reservations, and receive QR-based entry
              passes instantly. It simplifies stall booking and improves transparency.
            </p>
          </div>

          <div className="bg-blue-200 rounded-xl shadow-lg p-8 hover:scale-105 transition">
            <h2 className="text-2xl font-semibold text-blue-900 mb-4">
              Mission & Vision
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Our mission is to provide a secure, reliable, and easy-to-use platform
              that modernizes exhibition stall management. We aim to create a seamless
              experience for vendors and publishers.
            </p>
          </div>
        </div>

        {/* FEATURES */}
        <div>
          <h2 className="text-3xl font-bold text-center mb-12">
            Key Features
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              "Real-time stall availability",
              "Secure online reservations",
              "QR code confirmations",
              "Reservation tracking dashboard"
            ].map((feature, index) => (
              <div
                key={index}
                className="bg-white rounded-xl p-6 shadow-lg hover:scale-105 transition"
              >
                <h3 className="text-lg font-semibold text-blue-900 mb-2">
                  Feature {index + 1}
                </h3>
                <p className="text-gray-700 text-sm">
                  {feature}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* HISTORY */}
       {/* OUR JOURNEY */}
<section className="bg-blue-900 py-20 text-white">
  <div className="max-w-6xl mx-auto px-6">

    <h2 className="text-4xl font-bold text-center mb-12">
      Our Journey
    </h2>

    <div className="space-y-8">
      {[
        { year: "2023", text: "System concept and architecture design." },
        { year: "2024", text: "Beta launch for Colombo Book Fair vendors." },
        { year: "2025", text: "Handled 1000+ reservations successfully." }
      ].map((item, index) => (
        <div
          key={index}
          className="bg-white/10 backdrop-blur-sm p-6 rounded-xl flex flex-col md:flex-row md:justify-between md:items-center hover:bg-white/20 transition"
        >
          <span className="text-xl font-bold text-white">
            {item.year}
          </span>
          <p className="text-gray-200 mt-2 md:mt-0">
            {item.text}
          </p>
        </div>
      ))}
    </div>

  </div>
</section>
</div>

    </section>
  );
};

export default About;