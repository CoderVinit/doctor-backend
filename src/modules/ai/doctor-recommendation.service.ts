import { Injectable } from "@nestjs/common";

@Injectable()
export class DoctorRecommendationService {
  extractKeywords(symptoms: string): string[] {
    // Common stop words to filter out
    const stopWords = new Set(['the', 'and', 'for', 'have', 'has', 'been', 'with', 'that', 'this', 'from', 'are', 'was', 'were']);
    
    return symptoms
      .toLowerCase()
      .replace(/[^a-z\s]/g, "")
      .split(/\s+/)
      .filter(w => w.length > 3 && !stopWords.has(w));
  }

  calculateMatchScore(doctor: any, keywords: string[]): number {
    let score = 0;
    const doctorKeywords = doctor.keywords || [];
    const speciality = doctor.speciality?.toLowerCase() || '';
    const about = doctor.about?.toLowerCase() || '';

    keywords.forEach(keyword => {
      // Exact match in doctor's keywords (highest weight)
      if (doctorKeywords.some((dk: string) => dk.toLowerCase() === keyword)) {
        score += 10;
      }
      // Partial match in doctor's keywords
      else if (doctorKeywords.some((dk: string) => dk.toLowerCase().includes(keyword))) {
        score += 7;
      }
      // Match in speciality
      if (speciality.includes(keyword)) {
        score += 8;
      }
      // Match in about section
      if (about.includes(keyword)) {
        score += 3;
      }
    });

    // Bonus for rating
    score += (doctor.rating || 0) * 2;

    // Bonus for experience (convert "5 years" to number)
    const expYears = parseInt(doctor.experience) || 0;
    score += Math.min(expYears, 10); // Cap at 10 bonus points

    return score;
  }

  getSpecialityMapping(): Record<string, string[]> {
    return {
      // Primary Care
      'General Physician': ['fever', 'cold', 'cough', 'flu', 'weakness', 'fatigue', 'headache', 'body', 'ache', 'infection', 'viral', 'general'],
      'Family Medicine': ['checkup', 'routine', 'preventive', 'family', 'health', 'screening'],
      
      // Women's Health
      'Gynecologist': ['menstrual', 'pregnancy', 'periods', 'cramps', 'pcos', 'fertility', 'ovary', 'uterus', 'vaginal'],
      'Obstetrician': ['pregnancy', 'prenatal', 'delivery', 'childbirth', 'cesarean', 'labor', 'fetal'],
      
      // Skin & Aesthetics
      'Dermatologist': ['skin', 'rash', 'acne', 'eczema', 'allergy', 'itching', 'hair', 'nail', 'psoriasis', 'fungal', 'pigmentation'],
      'Cosmetologist': ['beauty', 'aesthetic', 'anti-aging', 'botox', 'filler', 'laser', 'cosmetic'],
      
      // Children's Health
      'Pediatrician': ['child', 'baby', 'infant', 'vaccination', 'growth', 'kids', 'toddler', 'developmental'],
      'Neonatologist': ['newborn', 'premature', 'neonatal', 'nicu', 'birth'],
      
      // Brain & Nerves
      'Neurologist': ['migraine', 'headache', 'seizure', 'numbness', 'memory', 'dizziness', 'nerve', 'paralysis', 'stroke', 'tremor', 'parkinson'],
      'Neurosurgeon': ['brain', 'tumor', 'spine', 'surgery', 'disc', 'herniated'],
      'Psychiatrist': ['anxiety', 'depression', 'stress', 'mental', 'bipolar', 'schizophrenia', 'ocd', 'ptsd', 'panic'],
      'Psychologist': ['counseling', 'therapy', 'behavioral', 'cognitive', 'emotional', 'trauma'],
      
      // Heart & Blood
      'Cardiologist': ['heart', 'chest', 'blood pressure', 'palpitation', 'cholesterol', 'cardiac', 'ecg', 'hypertension'],
      'Cardiac Surgeon': ['bypass', 'valve', 'heart surgery', 'angioplasty', 'stent'],
      'Vascular Surgeon': ['vein', 'artery', 'varicose', 'circulation', 'dvt', 'peripheral'],
      
      // Digestive System
      'Gastroenterologist': ['stomach', 'digestion', 'acidity', 'constipation', 'diarrhea', 'liver', 'nausea', 'ibs', 'ulcer', 'reflux', 'gerd'],
      'Hepatologist': ['liver', 'hepatitis', 'cirrhosis', 'jaundice', 'fatty liver'],
      
      // Bones & Joints
      'Orthopedic': ['bone', 'joint', 'fracture', 'knee', 'back', 'spine', 'muscle', 'arthritis', 'shoulder', 'hip', 'ligament'],
      'Rheumatologist': ['arthritis', 'lupus', 'autoimmune', 'joint pain', 'inflammation', 'fibromyalgia'],
      'Physiotherapist': ['rehabilitation', 'physical therapy', 'mobility', 'exercise', 'recovery', 'pain management'],
      'Sports Medicine': ['sports injury', 'athlete', 'sprain', 'strain', 'performance'],
      
      // Eyes
      'Ophthalmologist': ['eye', 'vision', 'glasses', 'cataract', 'glaucoma', 'retina', 'lasik', 'cornea'],
      'Optometrist': ['eye exam', 'prescription', 'contact lens', 'vision test'],
      
      // Ear, Nose & Throat
      'ENT Specialist': ['ear', 'nose', 'throat', 'hearing', 'sinus', 'tonsil', 'snoring', 'vertigo', 'nasal'],
      'Audiologist': ['hearing loss', 'hearing aid', 'tinnitus', 'deaf'],
      
      // Dental
      'Dentist': ['teeth', 'dental', 'gum', 'cavity', 'tooth', 'mouth', 'oral', 'cleaning'],
      'Orthodontist': ['braces', 'alignment', 'crooked', 'invisalign', 'jaw'],
      'Oral Surgeon': ['wisdom teeth', 'extraction', 'implant', 'jaw surgery'],
      
      // Lungs & Respiratory
      'Pulmonologist': ['lung', 'breathing', 'asthma', 'copd', 'pneumonia', 'respiratory', 'bronchitis', 'shortness of breath'],
      'Allergist': ['allergy', 'allergic', 'hay fever', 'hives', 'anaphylaxis', 'food allergy'],
      
      // Kidneys & Urinary
      'Nephrologist': ['kidney', 'renal', 'dialysis', 'creatinine', 'kidney stone'],
      'Urologist': ['urinary', 'bladder', 'prostate', 'urine', 'uti', 'erectile', 'incontinence'],
      
      // Hormones & Metabolism
      'Endocrinologist': ['hormone', 'thyroid', 'pituitary', 'adrenal', 'metabolism', 'growth hormone'],
      'Diabetologist': ['diabetes', 'sugar', 'insulin', 'glucose', 'blood sugar', 'hba1c'],
      
      // Cancer
      'Oncologist': ['cancer', 'tumor', 'chemotherapy', 'malignant', 'biopsy', 'oncology'],
      'Radiation Oncologist': ['radiation', 'radiotherapy', 'cancer treatment'],
      
      // Surgery
      'General Surgeon': ['surgery', 'hernia', 'appendix', 'gallbladder', 'operation'],
      'Plastic Surgeon': ['reconstruction', 'cosmetic surgery', 'burn', 'scar'],
      'Laparoscopic Surgeon': ['minimally invasive', 'keyhole', 'laparoscopy'],
      
      // Other Specialists
      'Anesthesiologist': ['anesthesia', 'pain block', 'sedation'],
      'Infectious Disease': ['infection', 'virus', 'bacteria', 'hiv', 'tropical', 'tb', 'tuberculosis'],
      'Geriatrician': ['elderly', 'aging', 'senior', 'old age', 'dementia', 'alzheimer'],
      'Hematologist': ['blood', 'anemia', 'clotting', 'leukemia', 'platelet', 'hemoglobin'],
      'Immunologist': ['immune', 'autoimmune', 'immunodeficiency', 'vaccination'],
      
      // Alternative Medicine
      'Ayurveda': ['ayurvedic', 'natural', 'herbal', 'traditional', 'holistic'],
      'Homeopathy': ['homeopathic', 'alternative', 'natural remedy'],
      
      // Nutrition & Diet
      'Dietitian': ['diet', 'nutrition', 'weight', 'obesity', 'eating', 'meal plan'],
      'Nutritionist': ['supplements', 'vitamins', 'minerals', 'healthy eating', 'weight management'],
    };
  }
}
