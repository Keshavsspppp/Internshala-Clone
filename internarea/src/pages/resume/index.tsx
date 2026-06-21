import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { selectuser } from "@/Feature/Userslice";
import { auth, storage } from "@/firebase/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import axios from "axios";
import { toast } from "react-toastify";
import { useRouter } from "next/router";
import { 
  CheckCircle, 
  CreditCard, 
  FileText, 
  GraduationCap, 
  Key, 
  Lock, 
  Mail, 
  Plus, 
  Trash2, 
  User, 
  Briefcase,
  UploadCloud,
  ChevronRight,
  ChevronLeft
} from "lucide-react";

type Qualification = {
  school: string;
  degree: string;
  year: string;
  percentage: string;
};

type Experience = {
  company: string;
  role: string;
  duration: string;
  description: string;
};

const ResumeBuilderPage = () => {
  const user = useSelector(selectuser);
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(1);
  const [isCheckingPlan, setIsCheckingPlan] = useState(true);
  const [isGoldPlan, setIsGoldPlan] = useState(false);
  
  // Auth state
  const [emailInput, setEmailInput] = useState("");
  const [otpInput, setOtpInput] = useState("");
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isOtpVerified, setIsOtpVerified] = useState(false);

  // Resume form state
  const [resumeData, setResumeData] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
    photoUrl: "",
    personalInfo: {
      about: "",
      skills: "",
      hobbies: ""
    }
  });

  const [qualifications, setQualifications] = useState<Qualification[]>([
    { school: "", degree: "", year: "", percentage: "" }
  ]);

  const [experience, setExperience] = useState<Experience[]>([
    { company: "", role: "", duration: "", description: "" }
  ]);

  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isInitiatingPayment, setIsInitiatingPayment] = useState(false);

  // Gating check on mount
  useEffect(() => {
    const checkSubscription = async () => {
      if (!user) {
        setIsCheckingPlan(false);
        return;
      }

      try {
        const token = await auth.currentUser?.getIdToken();
        if (!token) {
          setIsCheckingPlan(false);
          return;
        }

        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/subscription/status`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        if (response.data.planName === "Gold") {
          setIsGoldPlan(true);
        }
      } catch (error) {
        console.error("Subscription check failed:", error);
      } finally {
        setIsCheckingPlan(false);
      }
    };

    checkSubscription();
  }, [user]);

  // Prefill profile data when step 3 starts
  useEffect(() => {
    if (user && activeStep === 3) {
      setResumeData(prev => ({
        ...prev,
        name: prev.name || user.name || "",
        email: prev.email || user.email || "",
        photoUrl: prev.photoUrl || user.photo || ""
      }));
      setEmailInput(user.email || "");
    }
  }, [user, activeStep]);

  const handleSendOtp = async () => {
    if (!emailInput.trim()) {
      toast.error("Please enter your email.");
      return;
    }

    try {
      setIsSendingOtp(true);
      const token = await auth.currentUser?.getIdToken();
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/resume/send-otp`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      setIsOtpSent(true);
      if (response.data.developmentOtpPreview) {
        toast.info(`Development OTP Preview: ${response.data.developmentOtpPreview}`);
      } else {
        toast.success("OTP sent to your registered email.");
      }
      setActiveStep(2);
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to send OTP.");
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpInput.trim()) {
      toast.error("Please enter the OTP.");
      return;
    }

    try {
      setIsVerifyingOtp(true);
      const token = await auth.currentUser?.getIdToken();
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/resume/verify-otp`,
        { otp: otpInput.trim() },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setIsOtpVerified(true);
      toast.success("OTP verified successfully!");
      setActiveStep(3);
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || "Invalid OTP.");
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingPhoto(true);
      const storageRef = ref(storage, `resumes/photos/${user?.uid}_${Date.now()}_${file.name}`);
      const uploadResult = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(uploadResult.ref);
      setResumeData(prev => ({ ...prev, photoUrl: url }));
      toast.success("Photo uploaded successfully.");
    } catch (error) {
      console.error("Photo upload failed:", error);
      toast.error("Failed to upload photo.");
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const addQualification = () => {
    setQualifications(prev => [...prev, { school: "", degree: "", year: "", percentage: "" }]);
  };

  const removeQualification = (index: number) => {
    setQualifications(prev => prev.filter((_, i) => i !== index));
  };

  const updateQualification = (index: number, field: keyof Qualification, value: string) => {
    setQualifications(prev => {
      const updated = [...prev];
      updated[index][field] = value;
      return updated;
    });
  };

  const addExperience = () => {
    setExperience(prev => [...prev, { company: "", role: "", duration: "", description: "" }]);
  };

  const removeExperience = (index: number) => {
    setExperience(prev => prev.filter((_, i) => i !== index));
  };

  const updateExperience = (index: number, field: keyof Experience, value: string) => {
    setExperience(prev => {
      const updated = [...prev];
      updated[index][field] = value;
      return updated;
    });
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleCheckout = async () => {
    // Validate Step 3 Inputs
    if (!resumeData.name || !resumeData.email || !resumeData.phone || !resumeData.location) {
      toast.error("Please fill all required personal details.");
      return;
    }

    try {
      setIsInitiatingPayment(true);

      const sdkLoaded = await loadRazorpayScript();
      if (!sdkLoaded) {
        toast.error("Razorpay payment gateway failed to load. Please check your internet.");
        return;
      }

      const token = await auth.currentUser?.getIdToken();
      // 1. Create Order
      const orderResponse = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/resume/create-order`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      const order = orderResponse.data;

      // 2. Options for Razorpay
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_T3tbDnwaj6pkS2",
        amount: order.amount,
        currency: order.currency,
        name: "InternArea Resume Builder",
        description: "Payment for Resume PDF Generation",
        order_id: order.id,
        handler: async function (response: any) {
          try {
            toast.info("Verifying payment and generating PDF...");
            
            const verifyResponse = await axios.post(
              `${process.env.NEXT_PUBLIC_API_URL}/api/resume/verify-payment`,
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                resumeData: {
                  ...resumeData,
                  qualifications: qualifications.filter(q => q.school && q.degree),
                  experience: experience.filter(e => e.company && e.role)
                }
              },
              {
                headers: { Authorization: `Bearer ${token}` }
              }
            );

            if (verifyResponse.data.success) {
              toast.success("Resume generated successfully!");
              router.push("/profile");
            }
          } catch (verifyError: any) {
            console.error(verifyError);
            toast.error(verifyError.response?.data?.message || "Payment verification failed.");
          }
        },
        prefill: {
          name: user?.name || "",
          email: user?.email || "",
          contact: resumeData.phone
        },
        theme: {
          color: "#2563eb"
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (paymentError: any) {
      console.error(paymentError);
      toast.error(paymentError.response?.data?.message || "Failed to start payment.");
    } finally {
      setIsInitiatingPayment(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-slate-50 px-4">
        <div className="text-center p-8 bg-white border border-slate-100 rounded-3xl shadow-xl max-w-md w-full">
          <Lock className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <h2 className="text-xl font-black text-slate-800 font-heading">Authorization Required</h2>
          <p className="text-sm text-slate-500 mt-2 mb-6">
            Please log in with Google to access the premium Resume Builder.
          </p>
        </div>
      </div>
    );
  }

  if (isCheckingPlan) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-500 font-semibold animate-pulse">Verifying subscription status...</p>
      </div>
    );
  }

  if (!isGoldPlan) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-slate-50 px-4 animate-slide-up">
        <div className="text-center p-8 bg-white border border-slate-100 rounded-3xl shadow-xl max-w-lg w-full">
          <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[10px] font-bold uppercase tracking-wider">
            Premium Feature Gold ⭐
          </span>
          <h2 className="text-2xl font-black text-slate-800 font-heading mt-4">Upgrade to Gold</h2>
          <p className="text-sm text-slate-500 mt-2.5 leading-relaxed">
            The Resume Builder is a premium service reserved exclusively for Gold Tier subscribers. Upgrade your account now to unlock resume creation, unlimited applications, and instant downloads.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
            <button 
              onClick={() => router.push("/")}
              className="px-6 py-3 bg-blue-600 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-100 hover:bg-blue-700 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 py-12 animate-slide-up">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Step Indicator Header */}
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-black text-slate-800 font-heading">Premium Resume Builder</h1>
          <p className="text-sm text-slate-500 mt-1">Generate a verified, ATS-friendly professional resume</p>
          
          <div className="mt-8 flex items-center justify-between max-w-xl mx-auto">
            {[1, 2, 3, 4].map((step) => (
              <React.Fragment key={step}>
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    activeStep >= step 
                      ? "bg-blue-600 text-white shadow-md shadow-blue-100" 
                      : "bg-slate-200 text-slate-500"
                  }`}>
                    {step === 1 && <Mail className="h-3.5 w-3.5" />}
                    {step === 2 && <Key className="h-3.5 w-3.5" />}
                    {step === 3 && <FileText className="h-3.5 w-3.5" />}
                    {step === 4 && <CreditCard className="h-3.5 w-3.5" />}
                  </div>
                  <span className={`text-[10px] font-bold mt-2 uppercase tracking-wider ${
                    activeStep === step ? "text-blue-600" : "text-slate-400"
                  }`}>
                    {step === 1 && "OTP Request"}
                    {step === 2 && "Verification"}
                    {step === 3 && "Resume Info"}
                    {step === 4 && "Checkout"}
                  </span>
                </div>
                {step < 4 && (
                  <div className={`flex-1 h-[2px] mx-2 -mt-6 transition-colors ${
                    activeStep > step ? "bg-blue-600" : "bg-slate-200"
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Card Content Container */}
        <div className="bg-white border border-slate-100 rounded-3xl shadow-sm p-6 sm:p-10">
          
          {/* Step 1: Send OTP */}
          {activeStep === 1 && (
            <div className="max-w-md mx-auto text-center py-6">
              <Mail className="h-10 w-10 text-blue-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-slate-800 font-heading">Verify Your Account</h2>
              <p className="text-xs text-slate-500 mt-2 mb-6">
                To secure your session, we will send a 6-digit verification code to your email.
              </p>
              
              <div className="text-left mb-6">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email Address</label>
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="name@gmail.com"
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                />
              </div>

              <button
                onClick={handleSendOtp}
                disabled={isSendingOtp}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white font-bold text-xs py-3.5 rounded-xl shadow-md shadow-blue-100 hover:bg-blue-700 transition-colors disabled:opacity-60"
              >
                {isSendingOtp ? "Sending OTP..." : "Send Verification Code"}
                <ChevronRight size={14} />
              </button>
            </div>
          )}

          {/* Step 2: Verify OTP */}
          {activeStep === 2 && (
            <div className="max-w-md mx-auto text-center py-6">
              <Key className="h-10 w-10 text-blue-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-slate-800 font-heading">Enter Code</h2>
              <p className="text-xs text-slate-500 mt-2 mb-6">
                Enter the 6-digit verification code sent to <span className="font-semibold text-slate-700">{emailInput}</span>.
              </p>
              
              <div className="text-left mb-6">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Verification OTP</label>
                <input
                  type="text"
                  maxLength={6}
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value)}
                  placeholder="123456"
                  className="mt-1.5 w-full text-center tracking-widest text-lg font-bold rounded-xl border border-slate-200 px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                />
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setActiveStep(1)}
                  className="flex-1 py-3.5 border border-slate-200 font-bold text-xs text-slate-650 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleVerifyOtp}
                  disabled={isVerifyingOtp}
                  className="flex-1 bg-blue-600 text-white font-bold text-xs py-3.5 rounded-xl shadow-md shadow-blue-100 hover:bg-blue-700 transition-colors disabled:opacity-60"
                >
                  {isVerifyingOtp ? "Verifying..." : "Verify & Continue"}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Resume Form */}
          {activeStep === 3 && (
            <div className="space-y-10 animate-fade-in">
              
              {/* Personal Details */}
              <div>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">
                  Personal Details
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={resumeData.name}
                      onChange={(e) => setResumeData(prev => ({ ...prev, name: e.target.value }))}
                      className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-xs focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Address *</label>
                    <input
                      type="email"
                      required
                      disabled
                      value={resumeData.email}
                      className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Phone Number *</label>
                    <input
                      type="tel"
                      required
                      value={resumeData.phone}
                      onChange={(e) => setResumeData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="e.g. +91 9999999999"
                      className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-xs focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Location *</label>
                    <input
                      type="text"
                      required
                      value={resumeData.location}
                      onChange={(e) => setResumeData(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="e.g. Bangalore, India"
                      className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-xs focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                    />
                  </div>
                </div>

                {/* Profile Photo Upload */}
                <div className="mt-6 flex items-center gap-6">
                  {resumeData.photoUrl ? (
                    <img 
                      src={resumeData.photoUrl} 
                      alt="Resume Profile" 
                      className="w-16 h-16 rounded-full object-cover border border-slate-200" 
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                      <User className="h-6 w-6 text-slate-400" />
                    </div>
                  )}
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Resume Photo
                    </label>
                    <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-xs font-bold hover:bg-slate-50 transition-colors">
                      <UploadCloud size={14} className="text-slate-500" />
                      <span>{isUploadingPhoto ? "Uploading..." : "Upload Photo"}</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handlePhotoUpload} 
                        className="hidden" 
                        disabled={isUploadingPhoto}
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Profile Summary / Hobbies */}
              <div>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">
                  Summary & Interests
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">About Me / Professional Summary</label>
                    <textarea
                      rows={3}
                      value={resumeData.personalInfo.about}
                      onChange={(e) => setResumeData(prev => ({
                        ...prev,
                        personalInfo: { ...prev.personalInfo, about: e.target.value }
                      }))}
                      placeholder="Brief summary of your professional background and career objectives..."
                      className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-xs focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none resize-none"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Skills (Comma-separated)</label>
                      <input
                        type="text"
                        value={resumeData.personalInfo.skills}
                        onChange={(e) => setResumeData(prev => ({
                          ...prev,
                          personalInfo: { ...prev.personalInfo, skills: e.target.value }
                        }))}
                        placeholder="React, Node.js, Express, MongoDB"
                        className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-xs focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hobbies</label>
                      <input
                        type="text"
                        value={resumeData.personalInfo.hobbies}
                        onChange={(e) => setResumeData(prev => ({
                          ...prev,
                          personalInfo: { ...prev.personalInfo, hobbies: e.target.value }
                        }))}
                        placeholder="Reading, Photography, Traveling"
                        className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-xs focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Education / Qualifications */}
              <div>
                <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
                    Education
                  </h3>
                  <button
                    onClick={addQualification}
                    className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-2.5 py-1.5 rounded-lg transition-colors"
                  >
                    <Plus size={10} /> Add Education
                  </button>
                </div>
                
                <div className="space-y-6">
                  {qualifications.map((qual, idx) => (
                    <div key={idx} className="p-4 bg-slate-50/50 border border-slate-100 rounded-2xl relative">
                      {qualifications.length > 1 && (
                        <button
                          onClick={() => removeQualification(idx)}
                          className="absolute top-4 right-4 text-slate-400 hover:text-rose-600 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Institution / School</label>
                          <input
                            type="text"
                            value={qual.school}
                            onChange={(e) => updateQualification(idx, "school", e.target.value)}
                            placeholder="e.g. Stanford University"
                            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Degree / Course</label>
                          <input
                            type="text"
                            value={qual.degree}
                            onChange={(e) => updateQualification(idx, "degree", e.target.value)}
                            placeholder="e.g. B.S. in Computer Science"
                            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Year of Completion</label>
                          <input
                            type="text"
                            value={qual.year}
                            onChange={(e) => updateQualification(idx, "year", e.target.value)}
                            placeholder="e.g. 2024"
                            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Percentage / CGPA</label>
                          <input
                            type="text"
                            value={qual.percentage}
                            onChange={(e) => updateQualification(idx, "percentage", e.target.value)}
                            placeholder="e.g. 9.2 CGPA or 85%"
                            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Experience */}
              <div>
                <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
                    Work Experience
                  </h3>
                  <button
                    onClick={addExperience}
                    className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-2.5 py-1.5 rounded-lg transition-colors"
                  >
                    <Plus size={10} /> Add Experience
                  </button>
                </div>
                
                <div className="space-y-6">
                  {experience.map((exp, idx) => (
                    <div key={idx} className="p-4 bg-slate-50/50 border border-slate-100 rounded-2xl relative">
                      {experience.length > 1 && (
                        <button
                          onClick={() => removeExperience(idx)}
                          className="absolute top-4 right-4 text-slate-400 hover:text-rose-600 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Company Name</label>
                          <input
                            type="text"
                            value={exp.company}
                            onChange={(e) => updateExperience(idx, "company", e.target.value)}
                            placeholder="e.g. Google"
                            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Designation / Role</label>
                          <input
                            type="text"
                            value={exp.role}
                            onChange={(e) => updateExperience(idx, "role", e.target.value)}
                            placeholder="e.g. Software Engineer Intern"
                            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                          />
                        </div>
                        <div className="col-span-full">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Duration</label>
                          <input
                            type="text"
                            value={exp.duration}
                            onChange={(e) => updateExperience(idx, "duration", e.target.value)}
                            placeholder="e.g. May 2023 - August 2023 (3 Months)"
                            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Description</label>
                        <textarea
                          rows={3}
                          value={exp.description}
                          onChange={(e) => updateExperience(idx, "description", e.target.value)}
                          placeholder="Responsibilities and accomplishments during your tenure..."
                          className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none resize-none"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Form Navigation Buttons */}
              <div className="pt-6 border-t border-slate-100 flex justify-between">
                <button
                  onClick={() => setActiveStep(2)}
                  className="inline-flex items-center gap-1.5 px-6 py-3 border border-slate-200 font-bold text-xs text-slate-650 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  <ChevronLeft size={14} /> Back
                </button>
                <button
                  onClick={() => setActiveStep(4)}
                  className="inline-flex items-center gap-1.5 px-6 py-3 bg-blue-600 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-100 hover:bg-blue-700 transition-colors"
                >
                  Continue to Checkout <ChevronRight size={14} />
                </button>
              </div>

            </div>
          )}

          {/* Step 4: Checkout & Generate */}
          {activeStep === 4 && (
            <div className="max-w-md mx-auto text-center py-6">
              <CreditCard className="h-10 w-10 text-blue-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-slate-800 font-heading">Generate Premium PDF</h2>
              <p className="text-xs text-slate-500 mt-2 mb-6">
                Complete your ₹50 payment to compile and secure your resume download.
              </p>

              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 text-left mb-8 space-y-3.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-semibold uppercase tracking-wider">Service Fee</span>
                  <span className="text-slate-800 font-bold">₹50.00</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-semibold uppercase tracking-wider">VAT / Taxes</span>
                  <span className="text-slate-800 font-bold">₹0.00</span>
                </div>
                <div className="h-[1px] bg-slate-200 w-full" />
                <div className="flex justify-between items-center">
                  <span className="text-slate-800 text-sm font-bold uppercase tracking-wider">Total Amount</span>
                  <span className="text-blue-600 text-lg font-black font-heading">₹50.00</span>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setActiveStep(3)}
                  disabled={isInitiatingPayment}
                  className="flex-1 py-3.5 border border-slate-200 font-bold text-xs text-slate-650 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                  Edit Details
                </button>
                <button
                  onClick={handleCheckout}
                  disabled={isInitiatingPayment}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white font-bold text-xs py-3.5 rounded-xl shadow-md shadow-blue-100 hover:bg-blue-700 transition-colors disabled:opacity-60"
                >
                  {isInitiatingPayment ? "Processing..." : "Pay ₹50 & Build"}
                  <CheckCircle size={14} />
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};

export default ResumeBuilderPage;
