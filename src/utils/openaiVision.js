const API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

const MOCK_MEDICINES = [
  {
    medicine_name: "Aspirin Cardio",
    dosage: "81 mg",
    frequency: "Take 1 tablet daily with water, preferably after a meal.",
    warnings: "Do not take on an empty stomach. Stop taking and consult a doctor if you experience unusual bruising, dark stools, or ringing in the ears.",
    side_effects: "Indigestion, nausea, minor bleeding/easy bruising.",
    simple_explanation: "This is a low-dose aspirin. It thins your blood to help prevent heart attacks or strokes. Take one pill once a day after eating so your stomach doesn't get upset."
  },
  {
    medicine_name: "Lisinopril",
    dosage: "10 mg",
    frequency: "Take 1 tablet daily, at the same time each morning.",
    warnings: "Avoid salt substitutes containing potassium. Stand up slowly if you feel dizzy. Report any dry coughing that does not go away.",
    side_effects: "Dizziness, lightheadedness, mild headache, dry tickling cough.",
    simple_explanation: "This medicine lowers your blood pressure to protect your heart and kidneys. Take it once a day in the morning. If you feel dizzy when standing, take your time sitting up."
  },
  {
    medicine_name: "Metformin Hydrochloride",
    dosage: "500 mg",
    frequency: "Take 1 tablet twice daily with meals (with breakfast and dinner).",
    warnings: "Limit alcohol intake as it increases risks of lactic acidosis. Drink plenty of fluids. Tell your doctor if you have kidney problems.",
    side_effects: "Temporary diarrhea, stomach gas, metallic taste, nausea.",
    simple_explanation: "This pill helps manage your blood sugar if you have diabetes. Take it with food twice a day (morning and night) to help prevent stomach cramps or nausea."
  }
];

export async function analyzeMedicineLabel(imageBase64) {
  // Check if API key is missing or is the default placeholder
  const isMockMode = !API_KEY || API_KEY === 'sk-your-openai-api-key-here' || API_KEY.trim() === '';

  if (isMockMode) {
    console.log('OpenAI Key missing/default. Using simulated vision model parser...');
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 2000));
    // Pick a random mock medicine
    const randomIndex = Math.floor(Math.random() * MOCK_MEDICINES.length);
    return MOCK_MEDICINES[randomIndex];
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analyze this image. It could be a medicine label, a newspaper article, a letter, a book page, or a bill. Identify its type and extract the following: \n- "document_type": (either "medicine", "newspaper", "letter", "bill", or "general") \n- "title": (the name of the medicine, article title, letter sender, or bill issuer) \n- "subtitle_or_dosage": (dosage for medicine, author/date for article, date for letter, amount for bill) \n- "main_content_or_frequency": (dosing frequency for medicine, full text/body for article/letter, item details for bill) \n- "warnings_or_meta": (warnings/side-effects for medicine, metadata/notes for article, due date/status for bill, or empty string) \n- "simple_explanation": (plain language summary for elderly reading or listening to this document).\nReturn JSON only. Keys must match exactly: "document_type", "title", "subtitle_or_dosage", "main_content_or_frequency", "warnings_or_meta", "simple_explanation".'
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`
                }
              }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API returned status ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    let resultText = data.choices[0]?.message?.content || "";
    
    // Clean potential markdown json blocks formatting returned by API
    if (resultText.includes("```")) {
      resultText = resultText.replace(/```json/g, "").replace(/```/g, "").trim();
    }
    
    let resultJSON = {};
    try {
      resultJSON = JSON.parse(resultText) || {};
    } catch (parseErr) {
      console.warn("Failed to parse cleaned JSON content from OpenAI response:", resultText);
    }

    return {
      document_type: resultJSON.document_type || 'general',
      medicine_name: resultJSON.title || resultJSON.medicine_name || 'Scanned Document',
      dosage: resultJSON.subtitle_or_dosage || resultJSON.dosage || 'Not specified',
      frequency: resultJSON.main_content_or_frequency || resultJSON.frequency || 'Not specified',
      warnings: resultJSON.warnings_or_meta || resultJSON.warnings || '',
      side_effects: '',
      simple_explanation: resultJSON.simple_explanation || 'No plain explanation available.'
    };
  } catch (error) {
    console.error('Error analyzing medicine label with OpenAI:', error);
    throw error;
  }
}
