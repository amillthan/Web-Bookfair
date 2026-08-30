import React, { useState } from "react";
import UserAccountApi from "../../services/UserAccountApi";
import Error from "../../responseDisplay/Error";
import Success from "../../responseDisplay/Success";
import { motion } from "framer-motion";
import { SlideUp, SlideLeft } from "../../animation/direction";
import { Oval } from "react-loader-spinner";

const UserRegisterationForm = () => {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otp, setOtp] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "USER",
    businessName: "",
  });

  const isVendorOrPublisher =
    formData.role === "VENDOR" || formData.role === "PUBLISHER";

  const handleChange = (e) => {
    setError("");
    setSuccess("");
    const { name, value } = e.target;

    if (name === "role" && value === "ADMIN") return;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "role" &&
      !(value === "VENDOR" || value === "PUBLISHER")
        ? { businessName: "" }
        : {}),
    }));
  };

  const validateAfterOtpForm = () => {
    if (!formData.name?.trim()) return "Name is required";
    if (!formData.email?.trim()) return "Email is required";
    if (!formData.password) return "Password is required";
    if (!formData.confirmPassword) return "Confirm password is required";
    if (formData.password !== formData.confirmPassword)
      return "Password and confirm password do not match";
    if (isVendorOrPublisher && !formData.businessName?.trim())
      return "Business name is required for VENDOR or PUBLISHER";
    return "";
  };

  const handleSendOtp = async () => {
    if (!formData.email?.trim()) {
      setError("Please enter your email.");
      return;
    }

    try {
      setIsLoading(true);
      setError("");
      setSuccess("");

      const res = await UserAccountApi.sendEmailOtp({ email: formData.email });

      if (res?.statusCode === 200 || res?.status === 200) {
        setOtpSent(true);
        setSuccess("OTP sent to your email successfully.");
      } else {
        setError(res?.message || "Failed to send OTP.");
      }
    } catch (err) {
      setError(
        err?.response?.data?.message || err.message || "Failed to send OTP."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp?.trim()) {
      setError("Please enter the OTP.");
      return;
    }

    try {
      setIsLoading(true);
      setError("");
      setSuccess("");

      const res = await UserAccountApi.verifyEmailOtp({
        email: formData.email,
        otp,
      });

      if (res?.statusCode === 200 || res?.status === 200) {
        setOtpVerified(true);
        setSuccess("Email verified successfully. You can continue registration.");
      } else {
        setError(res?.message || "Invalid OTP.");
      }
    } catch (err) {
      setError(
        err?.response?.data?.message || err.message || "OTP verification failed."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!otpVerified) {
      setError("Please verify your email first.");
      return;
    }

    const validationError = validateAfterOtpForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!acceptedTerms) {
      setError("Please accept terms and conditions.");
      return;
    }

    try {
      setIsLoading(true);
      setError("");
      setSuccess("");

      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        role: formData.role,
        businessName: isVendorOrPublisher
          ? formData.businessName.trim()
          : null,
      };

      const res = await UserAccountApi.registerUser(payload);

      if (res?.statusCode === 200 || res?.status === 200) {
        setSuccess("Registration successful!");
        setError("");

        setFormData({
          name: "",
          email: "",
          password: "",
          confirmPassword: "",
          role: "USER",
          businessName: "",
        });
        setOtp("");
        setOtpSent(false);
        setOtpVerified(false);
        setAcceptedTerms(false);
      } else {
        setError(res?.message || "Registration failed.");
      }
    } catch (err) {
      setError(
        err?.response?.data?.message || err.message || "Registration failed."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white min-h-screen flex items-center justify-center ">
      {/* POPUP CARD */}
      <div className="bg-gray-100 w-[500px] p-8 rounded-xl shadow-md">
        <motion.div
          variants={SlideLeft(0.2)}
          initial="hidden"
          whileInView="visible"
          className="flex flex-col"
        >
          {/* HEADING */}
          <h2 className="text-3xl font-bold text-center text-blue-900 mb-6">
            Sign Up
          </h2>

          {error && <Error error={error} setError={setError} />}
          {success && <Success success={success} setSuccess={setSuccess} />}

          <form onSubmit={handleSubmit} className="w-full">
            {/* EMAIL + OTP SECTION */}
            <div className="w-full mb-4">
              <label className="block text-blue-900 font-semibold mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="name@gmail.com"
                className="bg-white p-2 w-full rounded border"
                disabled={otpSent}
              />

              {!otpSent && (
                <p className="text-blue-900 text-sm mt-2">
                  Verify your email with OTP
                </p>
              )}

              {!otpSent ? (
                <div className="flex justify-center">
                  <button
                    type="button"
                    className="bg-blue-900 text-gray-100 px-6 py-2 mt-4 rounded w-40"
                    onClick={handleSendOtp}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex justify-center">
                        <Oval height={20} width={20} color="white" visible />
                      </div>
                    ) : (
                      "Send OTP"
                    )}
                  </button>
                </div>
              ) : (
                <div className="mt-6">
                  <label className="block text-blue-900 font-semibold mb-1">
                    Enter OTP
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="bg-white p-2 w-full rounded border"
                      disabled={otpVerified}
                    />
                    <button
                      type="button"
                      className="bg-blue-900 text-gray-100 px-4 py-2 rounded w-32"
                      onClick={handleVerifyOtp}
                      disabled={isLoading || otpVerified}
                    >
                      {isLoading ? (
                        <Oval height={20} width={20} color="white" visible />
                      ) : otpVerified ? (
                        "Verified"
                      ) : (
                        "Verify"
                      )}
                    </button>
                  </div>
                  {!otpVerified && (
                    <button
                      type="button"
                      className="text-sm text-blue-900 underline mt-3"
                      onClick={() => {
                        setOtpSent(false);
                        setOtp("");
                        setSuccess("");
                        setError("");
                      }}
                    >
                      Change email / resend OTP
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* SHOW REST ONLY AFTER OTP VERIFIED */}
            {otpVerified && (
              <>
                {/* Name */}
                <div className="mt-6">
                  <label className="block text-blue-900 mb-1">Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="bg-white p-2 w-full rounded border"
                  />
                </div>

                {/* Passwords */}
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div>
                    <label className="block text-blue-900 mb-1">Password</label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="bg-white p-2 w-full rounded border"
                    />
                  </div>
                  <div>
                    <label className="block text-blue-900 mb-1">
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="bg-white p-2 w-full rounded border"
                    />
                  </div>
                </div>

                {/* Role */}
                <div className="mt-4">
                  <label className="block text-blue-900 mb-1">Role</label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="bg-white p-2 w-full rounded border"
                  >
                    
                    <option value="USER">User</option>
                    <option value="VENDOR">Vendor</option>
                    <option value="PUBLISHER">Publisher</option>
                  </select>
                </div>

                {/* Business Name */}
                {isVendorOrPublisher && (
                  <div className="mt-4">
                    <label className="block text-blue-900 mb-1">
                      Business Name
                    </label>
                    <input
                      type="text"
                      name="businessName"
                      value={formData.businessName}
                      onChange={handleChange}
                      className="bg-white p-2 w-full rounded border"
                    />
                  </div>
                )}

                {/* Accept Terms */}
                <div className="mt-5">
                  <label className="flex items-center gap-2 text-blue-900">
                    <input
                      type="checkbox"
                      checked={acceptedTerms}
                      onChange={(e) =>
                        setAcceptedTerms(e.target.checked)
                      }
                      className="accent-blue-900"
                    />
                    I accept the{" "}
                    <a
                      href="/termsAndConditions"
                      className="underline font-medium"
                    >
                      terms and conditions
                    </a>
                  </label>
                </div>

                {/* Submit */}
                <div className="mt-6">
                  <button
                    type="submit"
                    className={`bg-blue-900 text-gray-100 px-6 py-2 w-full rounded ${
                      !acceptedTerms ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                    disabled={!acceptedTerms || isLoading}
                  >
                    {isLoading ? (
                      <Oval height={20} width={20} color="white" visible />
                    ) : (
                      "Create an account"
                    )}
                  </button>
                </div>
              </>
            )}
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default UserRegisterationForm;