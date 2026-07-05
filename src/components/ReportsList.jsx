import React, { useState, useEffect } from 'react';
import { getReports, updateReport } from '../utils/supabase';

export function ReportsList({ refreshTrigger, onDetailSelect }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Keep track of which report ID is expanded
  const [expandedId, setExpandedId] = useState(null);
  const [sendingId, setSendingId] = useState(null);

  const fetchReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getReports();
      setReports(data || []);
    } catch (err) {
      console.error(err);
      setError('Could not load reports database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [refreshTrigger]);

  const handleSendToDoctor = async (e, reportId) => {
    e.stopPropagation(); // Avoid triggering card collapse
    setSendingId(reportId);
    try {
      await updateReport(reportId, { sent_to_doctor: true });
      // Update local state
      setReports((prev) =>
        prev.map((r) => (r.id === reportId ? { ...r, sent_to_doctor: true } : r))
      );
      alert('Report sent to doctor successfully.');
    } catch (err) {
      console.error(err);
      alert('Failed to send report to doctor. Please check your internet connection.');
    } finally {
      setSendingId(null);
    }
  };

  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const formatDate = (isoString) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      return 'Unknown Date';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 gap-3 border border-neutral-100 rounded-2xl bg-white">
        <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        <span className="text-sm font-bold text-blue-900">Retrieving scan logs...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-2xl flex flex-col items-center gap-4 text-center">
        <span className="text-red-700 font-extrabold text-lg">{error}</span>
        <button
          onClick={fetchReports}
          className="min-h-[48px] px-6 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl active:scale-95 transition"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-neutral-200 rounded-2xl bg-neutral-50/50 gap-4 text-center">
        <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-bold text-neutral-800">No reports yet</h3>
          <p className="text-sm text-neutral-400 mt-0.5">
            Capture and analyze a medicine label to start building your records.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center px-1">
        <h3 className="text-lg font-bold text-blue-900">Scan Logs ({reports.length})</h3>
        <button
          onClick={fetchReports}
          className="text-sm font-bold text-blue-600 hover:underline min-h-[48px] px-3 flex items-center gap-1.5"
          aria-label="Refresh reports list"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H18" />
          </svg>
          <span>Refresh</span>
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {reports.map((report) => {
          const isExpanded = expandedId === report.id;
          return (
            <div
              key={report.id}
              onClick={() => toggleExpand(report.id)}
              className={`w-full bg-white rounded-2xl border transition-all duration-200 cursor-pointer overflow-hidden select-none hover:shadow-sm ${
                isExpanded ? 'border-blue-300 ring-2 ring-blue-500/10' : 'border-neutral-100'
              }`}
            >
              {/* Row Summary Card */}
              <div className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  {/* Thumbnail */}
                  <div className="w-14 h-14 rounded-xl border border-neutral-100 overflow-hidden flex-shrink-0 bg-neutral-50 shadow-inner">
                    <img
                      src={report.image_url}
                      alt={report.medicine_name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Text meta */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-extrabold text-lg text-blue-950 truncate">
                      {report.medicine_name}
                    </h4>
                    <span className="text-xs text-neutral-400 font-bold block">
                      {formatDate(report.created_at)}
                    </span>
                  </div>
                </div>

                {/* Status Badges */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  {report.sent_to_doctor ? (
                    <span className="bg-green-50 border border-green-200 text-green-700 font-extrabold text-xs px-2.5 py-1 rounded-full flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M2.166 4.9L10 9.554 17.834 4.9A2 2 0 0016 4H4a2 2 0 00-1.834.9zM18 6.641l-6.84 4.023a2 2 0 01-2.32 0L2 6.641V14a2 2 0 002 2h12a2 2 0 002-2V6.641z" clipRule="evenodd" />
                      </svg>
                      <span>Sent</span>
                    </span>
                  ) : (
                    <button
                      onClick={(e) => handleSendToDoctor(e, report.id)}
                      disabled={sendingId === report.id}
                      className="bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 font-extrabold text-xs px-3 py-2 rounded-xl transition duration-150 min-h-[48px] flex items-center justify-center touch-manipulation active:scale-95"
                    >
                      {sendingId === report.id ? 'Sending...' : 'Send to Doctor'}
                    </button>
                  )}

                  {/* Collapse Icon */}
                  <svg
                    className={`w-6 h-6 text-neutral-400 transition-transform duration-200 ${
                      isExpanded ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* Expanded Card Details */}
              {isExpanded && (
                <div className="border-t border-neutral-100 bg-slate-50/50 p-5 flex flex-col gap-5">
                  <div className="flex flex-col sm:flex-row gap-5">
                    {/* Larger image copy */}
                    <div className="w-full sm:w-44 h-44 rounded-xl border border-neutral-200 shadow overflow-hidden flex-shrink-0 bg-neutral-100">
                      <img
                        src={report.image_url}
                        alt="Label Capture Scan"
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Metadata details */}
                    <div className="flex-1 flex flex-col gap-2">
                      <div>
                        <span className="text-xs text-neutral-400 font-extrabold block uppercase">Dosage</span>
                        <span className="text-lg font-black text-neutral-800">{report.dosage || 'Not specified'}</span>
                      </div>
                      <div>
                        <span className="text-xs text-neutral-400 font-extrabold block uppercase">Frequency</span>
                        <span className="text-lg font-black text-neutral-800">{report.frequency || 'Not specified'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-4 divide-y divide-neutral-100 pt-2">
                    {/* Simple explanation */}
                    <div className="pt-3">
                      <span className="text-xs font-bold text-green-700 uppercase bg-green-50 px-2 py-0.5 rounded">
                        Simple Explanation (For Elderly)
                      </span>
                      <p className="text-base text-neutral-800 font-semibold mt-1 bg-green-50/30 p-3 rounded-lg border border-green-100 leading-relaxed">
                        {report.simple_explanation}
                      </p>
                    </div>

                    {/* Warnings */}
                    <div className="pt-3">
                      <span className="text-xs font-bold text-red-700 uppercase bg-red-50 px-2 py-0.5 rounded">
                        Warnings & Cautions
                      </span>
                      <p className="text-sm text-neutral-700 font-medium mt-1 leading-relaxed">
                        {report.warnings}
                      </p>
                    </div>

                    {/* Side Effects */}
                    <div className="pt-3">
                      <span className="text-xs font-bold text-amber-700 uppercase bg-amber-50 px-2 py-0.5 rounded">
                        Potential Side Effects
                      </span>
                      <p className="text-sm text-neutral-700 font-medium mt-1 leading-relaxed">
                        {report.side_effects}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
