import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { CheckCircle2, Grid3x3, List, Download } from "lucide-react";

import bookFairImg from "../../assets/img1.jpg.jpeg";

/* ---------------- Animations ---------------- */

const textVariant = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8 },
  },
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6 },
  },
};

/* ---------------- Component ---------------- */

const HomePage = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    if (token) {
      if (role === "Organizer") {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }
    } else {
      navigate("/sign-in");
    }
  };

  return (
    <>
      {/* ================= HERO ================= */}
      <section
        className="relative text-white overflow-hidden"
        style={{
          backgroundImage: `url(${bookFairImg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-black/60"></div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-24">
          <motion.div
            variants={textVariant}
            initial="hidden"
            animate="visible"
            className="max-w-2xl"
          >
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mt-4">
              Smart Stall Reservation System for{" "}
              <span className="text-blue-300">Colombo International Book Fair 2026</span>
            </h1>

            {/* 📅 Event Date & Venue – new addition */}
            <div className="mt-6 space-y-1 border-l-4 border-blue-900 pl-4">
              <p className="text-lg sm:text-xl font-semibold text-white">
                25th October – 4th November 2026
              </p>
              <p className="text-base sm:text-lg text-gray-100">
                Bandaranaike Memorial International Conference Hall – BMICH
              </p>
              <p className="text-sm sm:text-base text-gray-200">
                Bauddhaloka Mawatha, Colombo 07, Sri Lanka.
              </p>
            </div>

            <p className="mt-4 text-gray-200">
              The Colombo International Book Fair (CIBF) has evolved into Sri Lanka’s most anticipated cultural and literary event, drawing passionate readers, seasoned writers, creative illustrators, pioneering publishers, and the general public into a single, vibrant space that celebrates the written word.
            </p>

            <div className="flex gap-4 mt-6">
              <button
                onClick={handleGetStarted}
                className="px-5 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition text-white font-medium cursor-pointer"
              >
                Get Started
              </button>

              <Link
                to="/about"
                className="px-5 py-2 border border-white rounded-lg hover:bg-white/20 transition"
              >
                Explore
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ================= SYSTEM FEATURES ================= */}
      <section className="bg-blue-900 py-20 text-white">
        <motion.div
          className="max-w-6xl mx-auto px-6 text-center"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <motion.h2
            className="text-4xl font-bold mb-12"
            variants={cardVariants}
          >
            System Features
          </motion.h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                title: "Online Reservation",
                desc: "Reserve stalls online with real-time availability and instant confirmation.",
              },
              {
                title: "Interactive Stall Map",
                desc: "Visual layout of stalls with reserved spaces clearly marked.",
              },
              {
                title: "Email & QR Code",
                desc: "Receive confirmation emails with QR-based entry passes.",
              },
              {
                title: "Secure Access",
                desc: "Protected login and secure authentication for vendors.",
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                variants={cardVariants}
                className="bg-white rounded-xl p-6 shadow-lg hover:scale-105 transition text-black"
              >
                <h3 className="text-xl font-semibold mb-3">
                  {item.title}
                </h3>
                <p className="text-gray-700">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ================= WHY CHOOSE US ================= */}
      <section className="bg-gray-50 py-20 text-slate-900">
        <motion.div
          className="max-w-6xl mx-auto px-6"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <motion.h2
            className="text-4xl font-bold mb-12 text-center"
            variants={cardVariants}
          >
            Why Choose Our System
          </motion.h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <CheckCircle2 size={24} className="text-blue-900" />,
                title: "Secure & Reliable",
                desc: "Advanced encryption ensures your data and reservations are fully protected.",
              },
              {
                icon: <Grid3x3 size={24} className="text-blue-900" />,
                title: "Easy Stall Selection",
                desc: "Clear layout and interactive map make stall selection simple.",
              },
              {
                icon: <List size={24} className="text-blue-900" />,
                title: "Track Reservations",
                desc: "Manage and monitor your bookings efficiently in one place.",
              },
              {
                icon: <Download size={24} className="text-blue-900" />,
                title: "Instant QR Pass",
                desc: "Receive your QR code immediately after successful booking.",
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                variants={cardVariants}
                className="bg-white rounded-xl p-6 shadow-lg hover:scale-105 transition"
              >
                <div className="flex items-center justify-center w-12 h-12 mb-4 bg-blue-100 rounded-full">
                  {item.icon}
                </div>

                <h3 className="text-xl font-semibold mb-2 text-blue-900">
                  {item.title}
                </h3>

                <p className="text-gray-700 text-sm">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>
    </>
  );
};

export default HomePage;