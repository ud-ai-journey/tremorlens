import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if credentials are missing or default
let localModeCheck =
  !supabaseUrl ||
  supabaseUrl === 'https://your-project-id.supabase.co' ||
  supabaseUrl.trim() === '' ||
  !supabaseAnonKey ||
  supabaseAnonKey.trim() === '';

let supabase = null;
if (!localModeCheck) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
  } catch (err) {
    console.error('Supabase client creation failed, falling back to localStorage sandbox:', err);
    localModeCheck = true;
  }
}

export const isLocalMode = localModeCheck;


// Helper to compress images locally to save localStorage limits (~5MB maximum)
function compressImage(file, maxWidth = 350, quality = 0.5) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}

// Upload report image to Storage bucket, then save row metadata to DB
export async function uploadReport(imageFile, analysis) {
  if (isLocalMode) {
    console.log('Local Mode: Saving report to localStorage');
    try {
      const compressedBase64 = await compressImage(imageFile);
      const newReport = {
        id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
        patient_id: '550e8400-e29b-41d4-a716-446655440000',
        image_url: compressedBase64,
        medicine_name: analysis.medicine_name || 'Unknown',
        dosage: analysis.dosage || '',
        frequency: analysis.frequency || '',
        warnings: analysis.warnings || '',
        side_effects: analysis.side_effects || '',
        simple_explanation: analysis.simple_explanation || '',
        ai_analysis: analysis,
        sent_to_doctor: false,
        created_at: new Date().toISOString(),
      };

      const existingReports = getLocalReports();
      existingReports.unshift(newReport);
      setLocalReports(existingReports);

      return newReport;
    } catch (err) {
      console.error('Error compressing/saving report locally:', err);
      throw new Error('Failed to compress and save image locally.');
    }
  }

  try {
    // 1. Generate unique file name
    const fileExtension = imageFile.name.split('.').pop() || 'jpg';
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExtension}`;

    // 2. Upload file to Supabase storage bucket 'report-images'
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('report-images')
      .upload(fileName, imageFile, {
        contentType: imageFile.type,
        upsert: false
      });

    if (uploadError) throw uploadError;

    // 3. Get Public URL for the image
    const { data: urlData } = supabase.storage
      .from('report-images')
      .getPublicUrl(fileName);
    
    const imageUrl = urlData.publicUrl;

    // 4. Save metadata to the reports database table
    const { data, error } = await supabase
      .from('reports')
      .insert([
        {
          image_url: imageUrl,
          medicine_name: analysis.medicine_name,
          dosage: analysis.dosage,
          frequency: analysis.frequency,
          warnings: analysis.warnings,
          side_effects: analysis.side_effects,
          simple_explanation: analysis.simple_explanation,
          ai_analysis: analysis,
          sent_to_doctor: false
        }
      ])
      .select();

    if (error) throw error;
    return data[0];
  } catch (error) {
    console.error('Error uploading report to Supabase:', error);
    throw error;
  }
}

// Fetch all reports
export async function getReports() {
  if (isLocalMode) {
    return getLocalReports();
  }

  try {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching reports from Supabase:', error);
    throw error;
  }
}

// Update report columns (e.g. set sent_to_doctor = TRUE)
export async function updateReport(id, updates) {
  if (isLocalMode) {
    const reports = getLocalReports();
    const updated = reports.map((r) => (r.id === id ? { ...r, ...updates } : r));
    setLocalReports(updated);
    return updated.find((r) => r.id === id);
  }

  try {
    const { data, error } = await supabase
      .from('reports')
      .update(updates)
      .eq('id', id)
      .select();

    if (error) throw error;
    return data[0];
  } catch (error) {
    console.error(`Error updating report ${id} in Supabase:`, error);
    throw error;
  }
}

// LocalStorage helpers
function getLocalReports() {
  try {
    const reportsString = localStorage.getItem('tremorlens_reports');
    return reportsString ? JSON.parse(reportsString) : [];
  } catch (e) {
    console.error('Failed to parse local storage reports:', e);
    return [];
  }
}

function setLocalReports(reports) {
  localStorage.setItem('tremorlens_reports', JSON.stringify(reports));
}
