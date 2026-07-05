import React, { useState, useEffect, useRef } from 'react';
import { analyzeMedicineLabel } from '../utils/openaiVision';
import { uploadReport } from '../utils/supabase';
import { useDeviceMotion } from '../hooks/useDeviceMotion';

export function CameraCapture({ onReportSaved, onCancel }) {
  const [imagePreview, setImagePreview] = useState(null);
  const [base64Data, setBase64Data] = useState(null);
  
  // Loading & status states
  // 'idle': video stream showing, ready to auto-capture
  // 'processing_image', 'analyzing', 'saving', 'saved', 'error'
  const [status, setStatus] = useState('idle'); 
  const [errorMsg, setErrorMsg] = useState('');
  const [analysis, setAnalysis] = useState(null);

  // References for live video streaming
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const captureTimeoutRef = useRef(null);

  // Listen to device motion for tremor auto-triggering
  // (In desktop demo mode, we simulate values so we can test the trigger)
  const isDesktop = typeof window !== 'undefined' && !/Mobi|Android|iPhone/i.test(navigator.userAgent);
  const { offset } = useDeviceMotion(isDesktop); 

  const [autoSpeak, setAutoSpeak] = useState(true);
  const [doctorEmail, setDoctorEmail] = useState('doctor@hospital.com');

  // Speak voice prompt helper
  const speakInstruction = (textMsg) => {
    if (!autoSpeak) return;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(textMsg);
      utterance.rate = 0.95; // Slightly slower for elderly
      window.speechSynthesis.speak(utterance);
    }
  };

  // Start video stream
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      speakInstruction("Please hold your medicine label in front of the camera. I will take the photo automatically once you hold it steady.");
    } catch (err) {
      console.error('Camera stream access failed:', err);
      // Fallback message
      setStatus('error');
      setErrorMsg("Camera access failed. Please ensure camera permissions are allowed.");
    }
  };

  useEffect(() => {
    if (status === 'idle') {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [status]);

  // Stop video stream
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (captureTimeoutRef.current) {
      clearTimeout(captureTimeoutRef.current);
    }
  };

  // Track tremor readings to trigger Auto-Capture
  useEffect(() => {
    if (status !== 'idle' || !streamRef.current) return;

    // Calculate motion magnitude/variance
    // Offset has alpha, beta, gamma deltas from rolling average.
    // High magnitude means active tremor/moving hand. Low magnitude means steady camera.
    const magnitude = Math.sqrt(offset.beta * offset.beta + offset.gamma * offset.gamma);
    
    // Set a steady threshold. If magnitude stays below this threshold, trigger auto-capture.
    // (In simulated demo mode, values shake but occasionally land below threshold).
    const STEADY_THRESHOLD = isDesktop ? 1.5 : 0.8; 

    if (magnitude > 0 && magnitude < STEADY_THRESHOLD) {
      // Hand is steady! Wait for 800ms of sustained stability before auto-snapping to prevent focus blur
      if (!captureTimeoutRef.current) {
        captureTimeoutRef.current = setTimeout(() => {
          captureFrame();
        }, 800);
      }
    } else {
      // Reset timer if hand shakes again
      if (captureTimeoutRef.current) {
        clearTimeout(captureTimeoutRef.current);
        captureTimeoutRef.current = null;
      }
    }
  }, [offset, status]);

  // Capture frame from video stream
  const captureFrame = () => {
    if (!videoRef.current || !streamRef.current) return;

    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;

      const ctx = canvas.getContext('2d');
      // Draw frame from stream
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Stop camera stream immediately
      stopCamera();
      
      speakInstruction("Perfect, holding steady. Capturing photo now.");
      
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      setImagePreview(dataUrl);
      const base64 = dataUrl.split(',')[1];
      setBase64Data(base64);

      // Run Vision OCR
      performAnalysis(base64);
    } catch (err) {
      console.error("Frame capture failed:", err);
      setStatus('error');
      setErrorMsg("Failed to capture image frame from video stream.");
    }
  };

  const performAnalysis = async (base64) => {
    setStatus('analyzing');
    speakInstruction("Got the photo! Analyzing your medicine now, please wait.");
    try {
      const result = await analyzeMedicineLabel(base64);
      setAnalysis(result);
      setStatus('analyzed');
      speakInstruction(`Analysis complete. This is ${result.medicine_name}. ${result.simple_explanation}`);
    } catch (err) {
      console.error(err);
      setStatus('error');
      setErrorMsg(`Analysis failed: ${err.message || 'The connection failed.'}`);
      speakInstruction("The analysis failed. Please try again.");
    }
  };

  const handleSave = async (sendToDoctor = false) => {
    if (!analysis || !imagePreview) return;
    setStatus('saving');
    speakInstruction(sendToDoctor ? "Sending reports to doctor." : "Saving reports.");
    try {
      // Convert base64 preview back to blob file to upload
      const fetchRes = await fetch(imagePreview);
      const imageBlob = await fetchRes.blob();
      const optimizedFile = new File([imageBlob], "prescription_label.jpg", { type: 'image/jpeg' });

      // Save report
      await uploadReport(optimizedFile, {
        ...analysis,
        sent_to_doctor: sendToDoctor
      });

      // Compose pre-filled email to the doctor
      if (sendToDoctor) {
        const subject = encodeURIComponent(`TremorLens Health Report: ${analysis.medicine_name}`);
        const bodyText = `Hello Doctor,\n\nHere is a scanned report shared from TremorLens:\n\n` +
          `• Item: ${analysis.medicine_name}\n` +
          `• Subtitle/Dosage: ${analysis.dosage}\n` +
          `• Full parsed content: ${analysis.frequency}\n\n` +
          `• Summary explanation: ${analysis.simple_explanation}\n\n` +
          `You can view the full record and captured label on the Supabase logs.`;
        
        const mailtoUrl = `mailto:${doctorEmail}?subject=${subject}&body=${encodeURIComponent(bodyText)}`;
        window.open(mailtoUrl, '_self');
      }

      setStatus('saved');
      speakInstruction(sendToDoctor ? "Reports successfully sent to your doctor and saved." : "Reports successfully saved.");
      
      if (onReportSaved) {
        onReportSaved();
      }
    } catch (err) {
      console.error(err);
      setStatus('error');
      setErrorMsg(`Failed to save report: ${err.message || 'database error'}`);
      speakInstruction("Failed to save report.");
    }
  };

  const handleRetry = () => {
    setAnalysis(null);
    setImagePreview(null);
    setBase64Data(null);
    setStatus('idle');
    setErrorMsg('');
  };

  return (
    <div className="w-full bg-white rounded-2xl shadow-md p-6 border border-blue-100 flex flex-col gap-6">
      {/* Title Header */}
      <div className="flex justify-between items-center border-b border-neutral-100 pb-3">
        <div>
          <h2 className="text-2xl font-black text-blue-900">Auto-Capture Scanner</h2>
          <p className="text-neutral-500 text-sm font-medium mt-0.5">
            Hold steady. App triggers automatically when vibration stops.
          </p>
        </div>
        <button
          onClick={onCancel}
          className="min-h-[48px] px-4 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold rounded-xl transition touch-manipulation active:scale-95"
        >
          Cancel
        </button>
      </div>
      {/* Voice & Doctor Settings sub-bar */}
      {status === 'idle' && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col gap-3">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            Reader Settings
          </span>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-1">
            {/* Auto Voice Readout Toggle */}
            <div className="flex items-center gap-3">
              <input
                id="voice-readout-toggle"
                type="checkbox"
                checked={autoSpeak}
                onChange={(e) => setAutoSpeak(e.target.checked)}
                className="w-5 h-5 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
              />
              <label htmlFor="voice-readout-toggle" className="text-sm font-bold text-slate-700 cursor-pointer">
                🔊 Auto-read reports aloud
              </label>
            </div>
            
            {/* Doctor Email Configuration Input */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <label htmlFor="doctor-email-input" className="text-sm font-bold text-slate-700 whitespace-nowrap">
                🩺 Doctor Email:
              </label>
              <input
                id="doctor-email-input"
                type="email"
                value={doctorEmail}
                onChange={(e) => setDoctorEmail(e.target.value)}
                placeholder="doctor@hospital.com"
                className="w-full sm:w-48 px-3 py-1.5 bg-white border border-slate-300 text-sm font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      )}
      {/* Main capture action (Live Video Feed) */}
      {status === 'idle' && (
        <div className="flex flex-col items-center justify-center gap-4">
          {/* Live Video Viewfinder */}
          <div className="relative w-full max-w-md aspect-[4/3] rounded-2xl overflow-hidden bg-black border-4 border-blue-900 shadow-inner flex items-center justify-center">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {/* Viewfinder Target Align Overlay */}
            <div className="absolute inset-8 border-2 border-dashed border-yellow-400 rounded-xl opacity-60 pointer-events-none flex items-center justify-center">
              <span className="text-xs font-bold text-yellow-400 bg-black/50 px-2 py-1 rounded">
                Center label here
              </span>
            </div>
            {/* Tremor status ring */}
            <div className="absolute top-4 left-4 bg-black/60 px-3 py-1.5 rounded-xl flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
              </span>
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Monitoring Tremors
              </span>
            </div>
          </div>
          
          {/* Backup Manual Capture Button */}
          <button
            onClick={captureFrame}
            className="w-full max-w-xs min-h-[56px] bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border border-neutral-300 font-bold text-base rounded-xl active:scale-95 transition touch-manipulation"
          >
            Or Capture Manually
          </button>
        </div>
      )}

      {/* Loaders */}
      {(status === 'analyzing' || status === 'saving') && (
        <div className="flex flex-col items-center justify-center p-12 gap-5 border border-neutral-100 rounded-2xl bg-neutral-50/50">
          <div className="relative flex items-center justify-center">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
            <div className="w-6 h-6 bg-yellow-400 rounded-full absolute animate-pulse" />
          </div>
          <div className="text-center">
            <h3 className="text-lg font-bold text-blue-900 capitalize">
              {status === 'analyzing' ? 'Analyzing Medicine Label...' : 'Syncing medical files...'}
            </h3>
            <p className="text-xs text-neutral-500 font-semibold mt-1">
              {status === 'analyzing' && 'OpenAI Vision reading ingredients & cautions...'}
              {status === 'saving' && 'Saving copy to doctor reports...'}
            </p>
          </div>
        </div>
      )}

      {/* Error */}
      {status === 'error' && (
        <div className="flex flex-col items-center justify-center p-8 gap-5 border-2 border-red-100 rounded-2xl bg-red-50/50">
          <div className="w-14 h-14 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="text-center max-w-sm">
            <h3 className="text-lg font-bold text-red-800">Scan Failed</h3>
            <p className="text-sm text-red-700 font-medium mt-1">{errorMsg}</p>
          </div>
          <div className="flex gap-4 w-full max-w-xs">
            <button
              onClick={handleRetry}
              className="flex-1 min-h-[48px] bg-red-600 hover:bg-red-700 text-white font-extrabold rounded-xl active:scale-95 transition touch-manipulation"
            >
              Retry Scan
            </button>
          </div>
        </div>
      )}

      {/* Results View */}
      {status === 'analyzed' && analysis && (
        <div className="flex flex-col gap-6 border border-blue-100 rounded-2xl p-4 bg-blue-50/10">
          <div className="flex flex-col sm:flex-row gap-4">
            {imagePreview && (
              <div className="w-full sm:w-32 h-32 rounded-xl overflow-hidden border border-blue-200 shadow-inner flex-shrink-0">
                <img
                  src={imagePreview}
                  alt="Scanned prescription label"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="flex-1 flex flex-col justify-center">
              <span className="text-xs text-blue-600 font-extrabold uppercase tracking-wider">
                {analysis.document_type === 'medicine' ? 'Medication Details' : 'Document Scan Info'}
              </span>
              <h3 className="text-2xl font-black text-blue-950 mt-0.5">
                {analysis.medicine_name}
              </h3>
              
              {/* Show different details depending on document type */}
              {analysis.document_type === 'medicine' ? (
                <div className="flex gap-6 mt-2">
                  <div>
                    <span className="text-xs text-neutral-400 font-bold block uppercase">Dosage</span>
                    <span className="text-base font-bold text-neutral-800">{analysis.dosage}</span>
                  </div>
                  <div>
                    <span className="text-xs text-neutral-400 font-bold block uppercase">Frequency</span>
                    <span className="text-base font-bold text-neutral-800">{analysis.frequency}</span>
                  </div>
                </div>
              ) : (
                <div className="mt-2">
                  <span className="text-xs text-neutral-400 font-bold block uppercase">Subtitle/Source</span>
                  <span className="text-base font-bold text-neutral-800">{analysis.dosage}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-4 divide-y divide-neutral-100 pt-2">
            <div className="pt-3">
              <span className="text-xs font-bold text-green-700 uppercase bg-green-50 px-2 py-0.5 rounded">
                {analysis.document_type === 'medicine' ? 'Simple Explanation (For Elderly)' : 'Read-Aloud Summary'}
              </span>
              <p className="text-base text-neutral-800 font-semibold mt-1 bg-green-50/20 p-3 rounded-lg border border-green-100 leading-relaxed animate-pulse">
                {analysis.simple_explanation}
              </p>
            </div>

            {/* Structured details (only for medicine) or full parsed text */}
            {analysis.document_type === 'medicine' ? (
              <>
                <div className="pt-3">
                  <span className="text-xs font-bold text-red-700 uppercase bg-red-50 px-2 py-0.5 rounded">
                    Warnings & Cautions
                  </span>
                  <p className="text-sm text-neutral-700 font-medium mt-1 leading-relaxed">
                    {analysis.warnings}
                  </p>
                </div>
              </>
            ) : (
              analysis.frequency && analysis.frequency !== 'Not specified' && (
                <div className="pt-3">
                  <span className="text-xs font-bold text-blue-700 uppercase bg-blue-50 px-2 py-0.5 rounded">
                    Full Scanned Text
                  </span>
                  <p className="text-sm text-neutral-700 font-medium mt-2 leading-relaxed bg-white p-3 rounded-lg border border-neutral-200 max-h-40 overflow-y-auto">
                    {analysis.frequency}
                  </p>
                </div>
              )
            )}

            {analysis.warnings && analysis.document_type !== 'medicine' && (
              <div className="pt-3">
                <span className="text-xs font-bold text-amber-700 uppercase bg-amber-50 px-2 py-0.5 rounded">
                  Additional Notes
                </span>
                <p className="text-sm text-neutral-700 font-medium mt-1 leading-relaxed">
                  {analysis.warnings}
                </p>
              </div>
            )}
          </div>

          {/* Giant single Action Buttons layout */}
          <div className="flex flex-col gap-3 border-t border-neutral-100 pt-4">
            <button
              onClick={() => handleSave(true)}
              className="w-full min-h-[72px] bg-green-600 hover:bg-green-700 text-white font-black text-xl rounded-2xl transition active:scale-95 touch-manipulation shadow-md flex items-center justify-center gap-3"
            >
              <svg className="w-8 h-8 text-green-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span>Yes, Save & Send to Doctor</span>
            </button>
            
            <button
              onClick={() => handleSave(false)}
              className="w-full min-h-[48px] bg-neutral-100 hover:bg-neutral-200 text-neutral-600 font-bold text-sm rounded-xl transition active:scale-95 touch-manipulation"
            >
              Only save report to logs (do not send)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
