import { drizzle } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import { Pool } from 'pg';
import * as bcrypt from 'bcryptjs';
import { doctorSchema } from './schema/doctor.schema';
import * as dotenv from 'dotenv';

dotenv.config();

// All specialities with sample doctors
const DOCTORS_DATA = [
  // Primary Care
  { name: 'Dr. Rajesh Kumar', speciality: 'General Physician', degree: 'MBBS, MD', experience: '15', fees: '500', about: 'Experienced general physician specializing in preventive care and chronic disease management.' },
  { name: 'Dr. Priya Sharma', speciality: 'Family Medicine', degree: 'MBBS, DNB (Family Medicine)', experience: '12', fees: '600', about: 'Dedicated family medicine specialist providing comprehensive care for all ages.' },
  
  // Women's Health
  { name: 'Dr. Anjali Verma', speciality: 'Gynecologist', degree: 'MBBS, MS (OBG)', experience: '18', fees: '800', about: 'Senior gynecologist with expertise in women\'s reproductive health and fertility.' },
  { name: 'Dr. Meera Reddy', speciality: 'Obstetrician', degree: 'MBBS, DGO', experience: '14', fees: '900', about: 'Specialized in high-risk pregnancies and prenatal care.' },
  
  // Skin & Aesthetics
  { name: 'Dr. Vikram Singh', speciality: 'Dermatologist', degree: 'MBBS, MD (Dermatology)', experience: '10', fees: '700', about: 'Expert in treating skin conditions, acne, and cosmetic dermatology.' },
  { name: 'Dr. Neha Kapoor', speciality: 'Cosmetologist', degree: 'MBBS, DDVL', experience: '8', fees: '1200', about: 'Specialist in aesthetic treatments, laser therapy, and skin rejuvenation.' },
  
  // Children's Health
  { name: 'Dr. Amit Patel', speciality: 'Pediatrician', degree: 'MBBS, MD (Pediatrics)', experience: '16', fees: '600', about: 'Caring pediatrician focused on child development and preventive care.' },
  { name: 'Dr. Sunita Joshi', speciality: 'Neonatologist', degree: 'MBBS, MD, DM (Neonatology)', experience: '12', fees: '1500', about: 'Specialist in newborn intensive care and premature infant care.' },
  
  // Brain & Nerves
  { name: 'Dr. Arun Mehta', speciality: 'Neurologist', degree: 'MBBS, MD, DM (Neurology)', experience: '20', fees: '1200', about: 'Expert neurologist treating stroke, epilepsy, and movement disorders.' },
  { name: 'Dr. Kavita Rao', speciality: 'Neurosurgeon', degree: 'MBBS, MS, MCh (Neurosurgery)', experience: '18', fees: '2000', about: 'Skilled neurosurgeon specializing in brain and spine surgeries.' },
  { name: 'Dr. Sanjay Gupta', speciality: 'Psychiatrist', degree: 'MBBS, MD (Psychiatry)', experience: '15', fees: '1000', about: 'Compassionate psychiatrist treating depression, anxiety, and mental health disorders.' },
  { name: 'Dr. Deepa Nair', speciality: 'Psychologist', degree: 'PhD (Clinical Psychology)', experience: '12', fees: '800', about: 'Clinical psychologist specializing in therapy and counseling.' },
  
  // Heart & Blood
  { name: 'Dr. Ramesh Agarwal', speciality: 'Cardiologist', degree: 'MBBS, MD, DM (Cardiology)', experience: '22', fees: '1500', about: 'Leading cardiologist with expertise in interventional cardiology.' },
  { name: 'Dr. Suresh Iyer', speciality: 'Cardiac Surgeon', degree: 'MBBS, MS, MCh (CTVS)', experience: '20', fees: '2500', about: 'Expert cardiac surgeon performing bypass and valve surgeries.' },
  { name: 'Dr. Pooja Desai', speciality: 'Vascular Surgeon', degree: 'MBBS, MS, MCh (Vascular)', experience: '14', fees: '1800', about: 'Specialist in treating vascular diseases and performing vascular surgeries.' },
  
  // Digestive System
  { name: 'Dr. Anand Kumar', speciality: 'Gastroenterologist', degree: 'MBBS, MD, DM (Gastro)', experience: '16', fees: '1200', about: 'Expert in digestive disorders, endoscopy, and liver diseases.' },
  { name: 'Dr. Ritu Saxena', speciality: 'Hepatologist', degree: 'MBBS, MD, DM (Hepatology)', experience: '14', fees: '1400', about: 'Specialist in liver diseases and hepatitis treatment.' },
  
  // Bones & Joints
  { name: 'Dr. Manoj Tiwari', speciality: 'Orthopedic', degree: 'MBBS, MS (Ortho)', experience: '18', fees: '1000', about: 'Experienced orthopedic surgeon specializing in joint replacements.' },
  { name: 'Dr. Seema Malhotra', speciality: 'Rheumatologist', degree: 'MBBS, MD, DM (Rheumatology)', experience: '12', fees: '1100', about: 'Expert in treating arthritis and autoimmune disorders.' },
  { name: 'Dr. Rahul Sharma', speciality: 'Physiotherapist', degree: 'BPT, MPT', experience: '10', fees: '500', about: 'Skilled physiotherapist helping patients recover from injuries.' },
  { name: 'Dr. Karan Singh', speciality: 'Sports Medicine', degree: 'MBBS, DNB (Sports Medicine)', experience: '8', fees: '900', about: 'Specialist in sports injuries and athlete care.' },
  
  // Eyes & Vision
  { name: 'Dr. Vivek Khanna', speciality: 'Ophthalmologist', degree: 'MBBS, MS (Ophthalmology)', experience: '15', fees: '800', about: 'Expert eye surgeon performing cataract and LASIK surgeries.' },
  { name: 'Dr. Nidhi Goyal', speciality: 'Optometrist', degree: 'B.Optom, M.Optom', experience: '8', fees: '400', about: 'Specialist in vision care and contact lens fitting.' },
  
  // Ear, Nose & Throat
  { name: 'Dr. Ashok Menon', speciality: 'ENT Specialist', degree: 'MBBS, MS (ENT)', experience: '17', fees: '700', about: 'Expert ENT surgeon treating ear, nose, and throat disorders.' },
  { name: 'Dr. Shweta Bansal', speciality: 'Audiologist', degree: 'MASLP', experience: '10', fees: '600', about: 'Specialist in hearing assessments and hearing aid fitting.' },
  
  // Dental
  { name: 'Dr. Nitin Arora', speciality: 'Dentist', degree: 'BDS, MDS', experience: '12', fees: '500', about: 'Experienced dentist providing comprehensive dental care.' },
  { name: 'Dr. Pallavi Jain', speciality: 'Orthodontist', degree: 'BDS, MDS (Orthodontics)', experience: '10', fees: '800', about: 'Specialist in braces and teeth alignment.' },
  { name: 'Dr. Rohit Chawla', speciality: 'Oral Surgeon', degree: 'BDS, MDS (Oral Surgery)', experience: '14', fees: '1200', about: 'Expert in oral surgeries and dental implants.' },
  
  // Lungs & Respiratory
  { name: 'Dr. Vijay Malhotra', speciality: 'Pulmonologist', degree: 'MBBS, MD, DM (Pulmonology)', experience: '16', fees: '1100', about: 'Specialist in respiratory diseases and sleep disorders.' },
  { name: 'Dr. Anita Shetty', speciality: 'Allergist', degree: 'MBBS, MD (Allergy)', experience: '12', fees: '900', about: 'Expert in treating allergies and asthma.' },
  
  // Kidneys & Urinary
  { name: 'Dr. Prakash Rao', speciality: 'Nephrologist', degree: 'MBBS, MD, DM (Nephrology)', experience: '18', fees: '1300', about: 'Specialist in kidney diseases and dialysis management.' },
  { name: 'Dr. Siddharth Bose', speciality: 'Urologist', degree: 'MBBS, MS, MCh (Urology)', experience: '15', fees: '1400', about: 'Expert urologist treating urinary and male reproductive disorders.' },
  
  // Hormones & Metabolism
  { name: 'Dr. Lakshmi Menon', speciality: 'Endocrinologist', degree: 'MBBS, MD, DM (Endocrinology)', experience: '14', fees: '1200', about: 'Specialist in hormonal disorders and thyroid diseases.' },
  { name: 'Dr. Harish Sharma', speciality: 'Diabetologist', degree: 'MBBS, MD (Medicine), FACE', experience: '16', fees: '1000', about: 'Expert in diabetes management and metabolic disorders.' },
  
  // Cancer Care
  { name: 'Dr. Sunil Kapoor', speciality: 'Oncologist', degree: 'MBBS, MD, DM (Oncology)', experience: '20', fees: '2000', about: 'Leading oncologist specializing in cancer treatment and chemotherapy.' },
  { name: 'Dr. Rashmi Pillai', speciality: 'Radiation Oncologist', degree: 'MBBS, MD (Radiation Oncology)', experience: '15', fees: '1800', about: 'Expert in radiation therapy for cancer treatment.' },
  
  // Surgery
  { name: 'Dr. Mohan Krishnan', speciality: 'General Surgeon', degree: 'MBBS, MS (General Surgery)', experience: '18', fees: '1200', about: 'Experienced general surgeon performing various surgical procedures.' },
  { name: 'Dr. Rekha Nambiar', speciality: 'Plastic Surgeon', degree: 'MBBS, MS, MCh (Plastic Surgery)', experience: '14', fees: '2500', about: 'Expert in reconstructive and cosmetic plastic surgery.' },
  { name: 'Dr. Ajay Mathur', speciality: 'Laparoscopic Surgeon', degree: 'MBBS, MS, FMAS', experience: '12', fees: '1500', about: 'Specialist in minimally invasive laparoscopic surgeries.' },
  
  // Other Specialists
  { name: 'Dr. Gaurav Singh', speciality: 'Infectious Disease', degree: 'MBBS, MD (Medicine), FID', experience: '12', fees: '1100', about: 'Specialist in treating infectious diseases and tropical medicine.' },
  { name: 'Dr. Kamala Devi', speciality: 'Geriatrician', degree: 'MBBS, MD (Geriatrics)', experience: '15', fees: '800', about: 'Expert in elderly care and age-related health issues.' },
  { name: 'Dr. Arjun Reddy', speciality: 'Hematologist', degree: 'MBBS, MD, DM (Hematology)', experience: '14', fees: '1400', about: 'Specialist in blood disorders and blood cancer.' },
  { name: 'Dr. Sneha Kulkarni', speciality: 'Immunologist', degree: 'MBBS, MD, DM (Immunology)', experience: '10', fees: '1300', about: 'Expert in immune system disorders and autoimmune diseases.' },
  
  // Alternative Medicine
  { name: 'Dr. Ramakrishna Iyer', speciality: 'Ayurveda', degree: 'BAMS, MD (Ayurveda)', experience: '20', fees: '500', about: 'Experienced Ayurvedic practitioner offering holistic treatment.' },
  { name: 'Dr. Shilpa Bhatia', speciality: 'Homeopathy', degree: 'BHMS, MD (Homeopathy)', experience: '15', fees: '400', about: 'Specialist in homeopathic treatments for various conditions.' },
  { name: 'Dr. Yogesh Pandit', speciality: 'Naturopathy', degree: 'BNYS', experience: '12', fees: '600', about: 'Expert in natural healing and lifestyle medicine.' },
  
  // Nutrition
  { name: 'Dr. Priyanka Chopra', speciality: 'Dietitian', degree: 'MSc (Nutrition), RD', experience: '10', fees: '500', about: 'Certified dietitian helping with weight management and therapeutic diets.' },
  { name: 'Dr. Anil Kumar', speciality: 'Nutritionist', degree: 'PhD (Nutrition)', experience: '12', fees: '600', about: 'Clinical nutritionist specializing in sports and clinical nutrition.' },
];

// Sample profile images (using placeholder URLs - replace with actual images)
const PROFILE_IMAGES = [
  'https://res.cloudinary.com/demo/image/upload/v1/samples/people/smiling-man',
  'https://res.cloudinary.com/demo/image/upload/v1/samples/people/kitchen-bar',
  'https://res.cloudinary.com/demo/image/upload/v1/samples/people/jazz',
];

async function seedDoctors() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  const db = drizzle(pool);

  console.log('🌱 Starting doctor seeding...\n');

  const salt = await bcrypt.genSalt(10);
  const defaultPassword = await bcrypt.hash('Doctor@123', salt);

  let successCount = 0;
  let skipCount = 0;

  for (const doctor of DOCTORS_DATA) {
    try {
      // Generate email from name
      const email = doctor.name.toLowerCase().replace('dr. ', '').replace(/\s+/g, '.') + '@gmail.com';
      
      // Check if doctor already exists
      const existing = await db
        .select()
        .from(doctorSchema)
        .where(eq(doctorSchema.email, email));

      if (existing.length > 0) {
        console.log(`⏭️  Skipping ${doctor.name} (already exists)`);
        skipCount++;
        continue;
      }

      // Random image from array
      const randomImage = PROFILE_IMAGES[Math.floor(Math.random() * PROFILE_IMAGES.length)];

      const newDoctor = {
        name: doctor.name,
        email: email,
        password: defaultPassword,
        speciality: doctor.speciality,
        degree: doctor.degree,
        experience: doctor.experience,
        fees: doctor.fees,
        about: doctor.about,
        image: randomImage,
        address: 'Medical Center, Healthcare District',
        available: true,
        date: String(Date.now()),
        slotsBooked: '',
      };

      await db.insert(doctorSchema).values(newDoctor);
      console.log(`✅ Added: ${doctor.name} (${doctor.speciality})`);
      successCount++;
    } catch (error: any) {
      console.error(`❌ Failed to add ${doctor.name}: ${error.message}`);
    }
  }

  console.log('\n📊 Seeding Summary:');
  console.log(`   ✅ Added: ${successCount} doctors`);
  console.log(`   ⏭️  Skipped: ${skipCount} doctors (already exist)`);
  console.log(`   📋 Total specialities covered: ${new Set(DOCTORS_DATA.map(d => d.speciality)).size}`);

  await pool.end();
  console.log('\n✨ Seeding completed!');
}

// Run the seed
seedDoctors().catch(console.error);
