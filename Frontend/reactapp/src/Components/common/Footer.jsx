import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 25 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

const Footer = () => {
  return (
    <footer className="bg-slate-900 text-gray-200 ">

      {/* TOP SECTION */}
      <motion.div
        className="
          max-w-7xl mx-auto
          px-6 lg:px-10
          py-20
          grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3
          gap-14
        "
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        {/* PROJECT INFO */}
        <motion.div variants={itemVariants} className="space-y-6">
          <h2 className="text-4xl font-bold tracking-tight text-blue-500">
            Colombo BookFair<span className="text-gray-200">.</span>
          </h2>

          <p className="text-base leading-relaxed">
            Official Stall Reservation Management System for
            <span className="font-semibold text-blue-500">
              {" "}Colombo International Book Fair
            </span>.
          </p>

          <p className="text-sm opacity-70">
            Secure · Transparent · Efficient
          </p>
        </motion.div>

        {/* EVENT DETAILS (NO BOX) */}
        <motion.div variants={itemVariants} className="space-y-6">
          <h3 className="text-2xl font-semibold text-blue-500">
            Event Details
          </h3>

          <ul className="space-y-3 text-sm">
            <li className="hover:text-blue-400 transition">
              📅 25<sup>th</sup> October – 04<sup>th</sup> November 2026
            </li>
            <li className="hover:text-blue-400 transition">
              ⏰ 9.00 AM to 9.00 PM
            </li>
            <li className="hover:text-blue-400 transition">
              📍 BMICH, Bauddhaloka Mawatha, Colombo 07
            </li>
          </ul>
        </motion.div>

        {/* QUICK LINKS */}
        <motion.div variants={itemVariants} className="space-y-6">
          <h3 className="text-xl font-semibold text-blue-500">
            Quick Links
          </h3>

          <ul className="space-y-3 text-sm">
            <li>
              <Link to="/" className="text-white hover:text-blue-400 transition">
                🔗 Home
              </Link>
            </li>
            <li>
              <Link to="/about" className="text-white hover:text-blue-400 transition">
                🔗 About
              </Link>
            </li>
            <li>
              <Link to="/sign-in" className="text-white hover:text-blue-400 transition">
                🔗 Login
              </Link>
            </li>
            <li>
              <Link to="/contact" className="text-white hover:text-blue-400 transition">
                🔗 Contact
              </Link>
            </li>
          </ul>
        </motion.div>
      </motion.div>

      {/* DIVIDER */}
      <div className="border-t border-blue-500/30"></div>

      {/* BOTTOM BAR */}
      <motion.div
        className="
          max-w-7xl mx-auto
          px-6 lg:px-10
          py-6
          flex flex-col md:flex-row
          justify-between items-center
          gap-3
          text-sm
        "
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.7 }}
        viewport={{ once: true }}
      >
        <p>© 2026 Colombo International BookFair. All Rights Reserved.</p>
        <p className="opacity-70">Creation:- NexaSpring...</p>
      </motion.div>
    </footer>
  );
};

export default Footer;